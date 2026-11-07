// Dates locales (fuseau du téléphone). Une journée = clé 'AAAA-MM-JJ'.

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// La semaine commence le lundi.
export function weekDays(key) {
  const d = fromKey(key);
  const offset = (d.getDay() + 6) % 7; // lundi = 0
  const monday = addDays(key, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
export function dayLetter(key) {
  return LETTERS[fromKey(key).getDay()];
}

export function longLabel(key) {
  return fromKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function shortRange(keys) {
  const opts = { day: 'numeric', month: 'short' };
  return `${fromKey(keys[0]).toLocaleDateString('fr-FR', opts)} – ${fromKey(keys[keys.length - 1]).toLocaleDateString('fr-FR', opts)}`;
}
