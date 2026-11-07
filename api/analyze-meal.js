// Fonction serveur Vercel : POST /api/analyze-meal
// Reçoit la photo d'un repas (base64) et renvoie une estimation nutritionnelle par IA.
// Fournisseur : Gemini (offre gratuite) si GEMINI_API_KEY est défini, sinon Claude (ANTHROPIC_API_KEY).
// Les clés restent sur le serveur (variables d'environnement Vercel), jamais dans l'app.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
// Modèles Gemini essayés dans l'ordre (le premier disponible en offre gratuite est utilisé).
const GEMINI_MODELS = [process.env.GEMINI_MODEL, 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'].filter(Boolean);
const MAX_BASE64 = 6 * 1024 * 1024; // ~4,5 Mo d'image

const TOOL = {
  name: 'enregistrer_repas',
  description: "Enregistre l'estimation nutritionnelle du repas visible sur la photo.",
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['est_un_repas', 'titre', 'aliments', 'proteines_g', 'kcal', 'glucides_g', 'lipides_g', 'confiance', 'remarque'],
    properties: {
      est_un_repas: { type: 'boolean', description: "false si la photo ne montre pas de nourriture ou de boisson" },
      titre: { type: 'string', description: 'Nom court du repas en français, ex. « Poulet, riz et brocoli »' },
      aliments: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['nom', 'grammes', 'proteines_g'],
          properties: {
            nom: { type: 'string' },
            grammes: { type: 'integer' },
            proteines_g: { type: 'integer' },
          },
        },
      },
      proteines_g: { type: 'integer' },
      kcal: { type: 'integer' },
      glucides_g: { type: 'integer' },
      lipides_g: { type: 'integer' },
      confiance: { type: 'string', enum: ['faible', 'moyenne', 'elevee'] },
      remarque: { type: 'string', description: 'Une phrase courte en français (ex. portion difficile à estimer), ou chaîne vide' },
    },
  },
};

function stripAdditional(schema) {
  if (Array.isArray(schema)) return schema.map(stripAdditional);
  if (!schema || typeof schema !== 'object') return schema;
  const out = {};
  for (const [k, v] of Object.entries(schema)) if (k !== 'additionalProperties') out[k] = stripAdditional(v);
  return out;
}
const GEMINI_SCHEMA = stripAdditional(TOOL.input_schema);

const PROMPT = `Tu es nutritionniste. Analyse la photo de ce repas.
Identifie chaque aliment visible, estime sa portion en grammes à partir des indices visuels (taille de l'assiette, couverts, mains),
puis estime les protéines, les calories, les glucides et les lipides du repas entier.
Utilise des valeurs nutritionnelles moyennes courantes. Arrondis à l'entier.
Si la photo ne montre pas de nourriture, mets est_un_repas à false et toutes les valeurs à 0.
Réponds uniquement avec l'objet JSON demandé.`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!geminiKey && !anthropicKey) return res.status(500).json({ error: 'Aucune clé IA configurée sur le serveur' });

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  const image = body && body.image;
  const mediaType = (body && body.mediaType) || 'image/jpeg';
  if (!image || typeof image !== 'string') return res.status(400).json({ error: 'Photo manquante' });
  if (image.length > MAX_BASE64) return res.status(413).json({ error: 'Photo trop lourde' });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) return res.status(400).json({ error: "Format d'image non pris en charge" });

  try {
    const result = geminiKey ? await withGemini(geminiKey, image, mediaType) : await withClaude(anthropicKey, image, mediaType);
    if (result.error) return res.status(result.status || 502).json({ error: result.error });
    return res.status(200).json({ meal: normalize(result.meal), model: result.model });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

async function withGemini(key, image, mediaType) {
  let last = null;
  for (const model of GEMINI_MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mediaType, data: image } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: GEMINI_SCHEMA, temperature: 0.2 },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      const text = (((data.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || '').join('') || '';
      const meal = safeJson(text) || safeJson((text.match(/\{[\s\S]*\}/) || [])[0] || '');
      if (meal) return { meal, model };
      last = { status: 502, error: "Réponse de l'analyse illisible" };
      continue;
    }
    console.error('Gemini', model, r.status, JSON.stringify(data).slice(0, 400));
    if (r.status === 429) {
      last = { status: 429, error: "Limite gratuite atteinte pour l'instant. Réessaie dans une minute." };
      continue; // modèle suivant : il a peut-être son propre quota
    }
    // 400/403/404 (modèle indisponible) ou 5xx (surcharge) : on essaie le modèle suivant.
    last = { status: 502, error: "L'analyse a échoué, réessaie dans un instant" };
  }
  return last || { status: 502, error: "L'analyse a échoué" };
}

async function withClaude(key, image, mediaType) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      tools: [TOOL],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT + " Appelle l'outil enregistrer_repas." },
          ],
        },
      ],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('Anthropic', r.status, JSON.stringify(data).slice(0, 400));
    return { status: 502, error: "L'analyse a échoué, réessaie dans un instant" };
  }
  const block = (data.content || []).find((b) => b.type === 'tool_use' && b.name === TOOL.name);
  let meal = block ? block.input : null;
  if (!meal) {
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    meal = safeJson((text.match(/\{[\s\S]*\}/) || [])[0] || '');
  }
  return meal ? { meal, model: MODEL } : { status: 502, error: "Réponse de l'analyse illisible" };
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function int(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalize(m) {
  return {
    isMeal: m.est_un_repas !== false,
    title: String(m.titre || 'Repas'),
    items: Array.isArray(m.aliments)
      ? m.aliments.slice(0, 12).map((a) => ({ name: String(a.nom || ''), grams: int(a.grammes), protein: int(a.proteines_g) }))
      : [],
    protein: int(m.proteines_g),
    kcal: int(m.kcal),
    carbs: int(m.glucides_g),
    fat: int(m.lipides_g),
    confidence: ['faible', 'moyenne', 'elevee'].includes(m.confiance) ? m.confiance : 'moyenne',
    note: String(m.remarque || ''),
  };
}
