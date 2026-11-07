import { createContext, useContext } from 'react';

// Profil de l'utilisateur et de son rival, créé à l'accueil.
// {
//   name: 'Sam', goal: 'lose' | 'fit' | 'muscle',
//   weightKg: 78, unit: 'kg' | 'lb',
//   level: 'beginner' | 'intermediate' | 'advanced',
//   rivalName: 'Nova', tone: 'kind' | 'teasing' | 'ruthless',
//   goals: { protein: 110, steps: 8000 },
// }

export const GOALS = [
  { key: 'lose', label: 'Perdre du poids', hint: 'Brûler des graisses en gardant ton muscle' },
  { key: 'fit', label: 'Me remettre en forme', hint: 'Plus d’énergie, plus d’endurance' },
  { key: 'muscle', label: 'Prendre du muscle', hint: 'Plus de force, plus de volume' },
];

export const LEVELS = [
  { key: 'beginner', label: 'Débutant', hint: 'Je bouge peu ou je reprends le sport' },
  { key: 'intermediate', label: 'Intermédiaire', hint: 'Je m’entraîne 1 à 3 fois par semaine' },
  { key: 'advanced', label: 'Avancé', hint: 'Je m’entraîne au moins 4 fois par semaine' },
];

export const TONES = [
  { key: 'kind', label: 'Bienveillant', hint: 'Il te pousse avec le sourire' },
  { key: 'teasing', label: 'Taquin', hint: 'Il te chambre, gentiment' },
  { key: 'ruthless', label: 'Sans pitié', hint: 'Il ne te fait aucun cadeau' },
];

export const RIVAL_NAMES = ['Nova', 'Rex', 'Luna', 'Max'];

export const LB_PER_KG = 2.20462;

// Protéines par kg de poids corporel selon l'objectif (repères sportifs courants),
// arrondies à 5 g et bornées pour rester raisonnables.
const PROTEIN_PER_KG = { lose: 1.4, fit: 1.2, muscle: 1.8 };
const STEPS_BY_LEVEL = { beginner: 6000, intermediate: 8000, advanced: 10000 };
const START_FACTOR = { beginner: 0.7, intermediate: 1, advanced: 1.4 };

export function computeGoals({ goal, weightKg, level }) {
  const raw = (weightKg || 70) * (PROTEIN_PER_KG[goal] ?? 1.2);
  const protein = Math.min(180, Math.max(60, Math.round(raw / 5) * 5));
  return { protein, steps: STEPS_BY_LEVEL[level] ?? 8000 };
}

// Scores de départ par exercice, ajustés au niveau (Nova vise ensuite +7 %).
export function startBests(exercises, level) {
  const f = START_FACTOR[level] ?? 1;
  return Object.fromEntries(exercises.map((e) => [e.id, Math.max(3, Math.round(e.startBest * f))]));
}

export const DEFAULT_PROFILE = {
  name: '',
  goal: 'fit',
  weightKg: 70,
  unit: 'kg',
  level: 'intermediate',
  rivalName: 'Nova',
  tone: 'teasing',
  goals: { protein: 120, steps: 8000 },
};

export const ProfileContext = createContext(DEFAULT_PROFILE);

export function useProfile() {
  return useContext(ProfileContext);
}
