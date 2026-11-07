// Fonction serveur Vercel : POST /api/analyze-meal
// Reçoit la photo d'un repas (base64) et renvoie l'estimation nutritionnelle de Claude.
// La clé ANTHROPIC_API_KEY reste sur le serveur (variable d'environnement Vercel).

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
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

const PROMPT = `Tu es nutritionniste. Analyse la photo de ce repas.
Identifie chaque aliment visible, estime sa portion en grammes à partir des indices visuels (taille de l'assiette, couverts, mains),
puis estime les protéines, les calories, les glucides et les lipides du repas entier.
Utilise des valeurs nutritionnelles moyennes courantes. Arrondis à l'entier.
Si la photo ne montre pas de nourriture, mets est_un_repas à false et toutes les valeurs à 0.
Réponds uniquement en appelant l'outil enregistrer_repas.`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Clé ANTHROPIC_API_KEY absente sur le serveur" });

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  const image = body && body.image;
  const mediaType = (body && body.mediaType) || 'image/jpeg';
  if (!image || typeof image !== 'string') return res.status(400).json({ error: 'Photo manquante' });
  if (image.length > MAX_BASE64) return res.status(413).json({ error: 'Photo trop lourde' });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) return res.status(400).json({ error: "Format d'image non pris en charge" });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        tools: [TOOL],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Anthropic', r.status, JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: "L'analyse a échoué, réessaie dans un instant" });
    }

    const block = (data.content || []).find((b) => b.type === 'tool_use' && b.name === TOOL.name);
    let meal = block ? block.input : null;
    if (!meal) {
      // Repli : certains modèles répondent en texte JSON.
      const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
      const match = text.match(/\{[\s\S]*\}/);
      meal = match ? safeJson(match[0]) : null;
    }
    if (!meal) return res.status(502).json({ error: "Réponse de l'analyse illisible" });

    return res.status(200).json({ meal: normalize(meal), model: MODEL });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

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
