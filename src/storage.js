import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISES } from './data';

const KEY = 'piquemiroir:v1';

// Structure enregistrée sur le téléphone :
// {
//   best: { squat: 15, ... },            meilleurs scores (Nova vise +7 %)
//   days: { 'AAAA-MM-JJ': {
//       protein: 0, steps: 0,
//       meals: [{ at, title, protein }],
//       session: 'win' | 'loss' | 'tie' | null,
//       results: [ ...résultats exercice par exercice ]
//   } },
//   startedOn: 'AAAA-MM-JJ'               premier jour d'utilisation
// }

export function emptyDay() {
  return { protein: 0, steps: 0, meals: [], session: null, results: null };
}

export function initialState(todayKey) {
  return {
    best: Object.fromEntries(EXERCISES.map((e) => [e.id, e.startBest])),
    days: {},
    startedOn: todayKey,
  };
}

export async function loadState(todayKey) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return initialState(todayKey);
    const parsed = JSON.parse(raw);
    const base = initialState(todayKey);
    return { ...base, ...parsed, best: { ...base.best, ...(parsed.best || {}) }, days: parsed.days || {} };
  } catch {
    return initialState(todayKey);
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sauvegarde au mieux : en cas d'échec, l'app continue avec les données en mémoire.
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // rien
  }
}
