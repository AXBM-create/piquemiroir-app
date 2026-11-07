// Règles du duel contre le rival. Les objectifs viennent du profil (voir profile.js).
const DEFAULT_GOALS = { protein: 120, steps: 8000 };

// Les 3 épreuves d'une journée. Nova atteint toujours ses objectifs :
// - Protéines : gagnée si tu atteins l'objectif, sinon perdue à la fin de la journée.
// - Pas : gagnée si tu dépasses l'objectif, sinon perdue à la fin de la journée.
// - Séance : résultat du duel d'exercices ; non faite = perdue à la fin de la journée.
export function evaluateDay(day, isOver, goals = DEFAULT_GOALS) {
  const d = day || { protein: 0, steps: 0, session: null };
  const unresolved = isOver ? 'loss' : 'pending';
  const events = [
    { key: 'seance', label: 'Séance', state: d.session ?? unresolved },
    { key: 'protein', label: 'Protéines', state: d.protein >= goals.protein ? 'win' : unresolved },
    { key: 'steps', label: 'Pas', state: d.steps > goals.steps ? 'win' : unresolved },
  ];
  const me = events.filter((e) => e.state === 'win').length;
  const nova = events.filter((e) => e.state === 'loss').length;
  let decided = me >= 2 ? 'win' : nova >= 2 ? 'loss' : null;
  if (isOver && !decided) decided = me > nova ? 'win' : 'loss';
  return { events, me, nova, decided };
}
