// Exercices de la séance « Brûle-graisse maison ».
// type 'reps' : on compte les répétitions ; type 'hold' : on compte les secondes tenues.
export const EXERCISES = [
  {
    id: 'squat',
    name: 'Squats',
    type: 'reps',
    tip: "Dos droit, genoux dans l'axe des pieds, cuisses à l'horizontale",
    video: require('../assets/videos/squat.mp4'),
    startBest: 15,
  },
  {
    id: 'fente',
    name: 'Fentes avant',
    type: 'reps',
    tip: 'Buste droit, les deux genoux à 90°, poussée sur le talon avant',
    video: require('../assets/videos/fente.mp4'),
    startBest: 13,
  },
  {
    id: 'pompes',
    name: 'Pompes',
    type: 'reps',
    tip: 'Mains sous les épaules, corps gainé, poitrine près du sol',
    video: require('../assets/videos/pompes.mp4'),
    startBest: 8,
  },
  {
    id: 'jumping',
    name: 'Jumping jacks',
    type: 'reps',
    tip: "Réceptions souples sur l'avant du pied, rythme régulier",
    video: require('../assets/videos/jumping.mp4'),
    startBest: 32,
  },
  {
    id: 'gainage',
    name: 'Gainage',
    type: 'hold',
    tip: 'Coudes sous les épaules, bassin aligné, respiration calme',
    video: require('../assets/videos/gainage.mp4'),
    startBest: 40,
  },
];

export const EFFORT_SECONDS = 40;
export const HOLD_MAX_SECONDS = 90;

// Nova vise ton meilleur score récent + 5 à 10 % (arrondi au-dessus).
export function novaTarget(best, streakLosses = 0) {
  const boost = streakLosses >= 2 ? 1.0 : 1.07;
  return Math.max(1, Math.ceil(best * boost));
}

export function formatScore(type, value) {
  if (type === 'hold') {
    const m = Math.floor(value / 60);
    const s = String(value % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
  return `${value} rép.`;
}

export const PROGRAMS = [
  { id: 'brule', name: 'Brûle-graisse maison', meta: '25 min · 5 exercices · sans matériel', level: 'Débutant', thumb: 'jumping', active: true },
  { id: 'ventre', name: 'Ventre plat 6 semaines', meta: '6 sem. · 4 séances/sem. · 20 min', level: 'Débutant', thumb: 'gainage' },
  { id: 'force', name: 'Force en salle', meta: '8 sem. · 3 séances/sem. · 45 min', level: 'Inter.', thumb: 'pompes' },
  { id: 'jambes', name: 'Jambes et fessiers', meta: '4 sem. · 4 séances/sem. · 25 min', level: 'Débutant', thumb: 'fente' },
  { id: 'glp1', name: 'Muscle et protéines (GLP-1)', meta: '6 sem. · 3 séances/sem. · 30 min', level: 'Tous', thumb: 'squat' },
];

// Repas simulés : en V1 l'analyse photo est une démonstration (pas encore d'IA branchée).
export const SAMPLE_MEALS = [
  { title: 'Déjeuner', protein: 38, kcal: 540, carbs: 52, items: [['Poulet grillé', '150 g · 33 g prot.'], ['Riz basmati', '120 g · 3 g prot.'], ['Brocoli', '80 g · 2 g prot.']] },
  { title: 'Petit-déjeuner', protein: 24, kcal: 410, carbs: 38, items: [['Yaourt grec', '200 g · 18 g prot.'], ['Flocons d’avoine', '40 g · 5 g prot.'], ['Fruits rouges', '80 g · 1 g prot.']] },
  { title: 'Dîner', protein: 42, kcal: 620, carbs: 45, items: [['Saumon', '160 g · 35 g prot.'], ['Patate douce', '150 g · 3 g prot.'], ['Haricots verts', '100 g · 2 g prot.'], ['Huile d’olive', '1 c. à s. · 0 g prot.']] },
];
