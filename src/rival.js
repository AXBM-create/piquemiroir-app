// Les phrases du rival selon son caractère (bienveillant, taquin, sans pitié).
// Chaque entrée reçoit des paramètres et renvoie une phrase.

const LINES = {
  intro: {
    kind: ({ name }) => `Salut ${name} ! Je serai ton rival, mais aussi ton meilleur allié. On commence quand tu veux.`,
    teasing: ({ name }) => `Enchanté ${name}. J'espère que tu aimes perdre, parce que je ne compte pas te laisser gagner.`,
    ruthless: ({ name }) => `${name}. Je ne saute jamais une séance. Je ne rate jamais un repas. À toi de voir si tu tiens.`,
  },
  missingProtein: {
    kind: ({ missing }) => `Encore ${missing} g de protéines et cette épreuve est à toi. Tu peux le faire !`,
    teasing: ({ missing }) => `Il te manque ${missing} g de protéines. Moi, j'ai déjà fini ma journée.`,
    ruthless: ({ missing }) => `${missing} g de retard sur les protéines. Je prends de l'avance.`,
  },
  sessionPending: {
    kind: () => `Tes protéines sont faites, bravo. Une petite séance et la journée est pliée.`,
    teasing: () => `Tes protéines sont faites. Viens te mesurer à moi sur la séance, si tu oses.`,
    ruthless: () => `Les protéines, c'est facile. La séance, on va voir.`,
  },
  stepsLeft: {
    kind: ({ steps }) => `Plus que ${steps} pas pour gagner la journée. Une petite marche ?`,
    teasing: ({ steps }) => `Encore ${steps} pas et la journée est à toi. Ou à moi, si tu restes assis.`,
    ruthless: ({ steps }) => `${steps} pas. C'est tout ce qui te sépare de la victoire. Lève-toi.`,
  },
  dayWon: {
    kind: () => `Journée gagnée, je suis fier de toi. Demain, je remets ça.`,
    teasing: () => `Bien joué, tu m'as battu aujourd'hui. Profite, ça ne durera pas.`,
    ruthless: () => `Tu as gagné aujourd'hui. Note-le, ça n'arrivera pas souvent.`,
  },
  dayLost: {
    kind: () => `Journée pour moi, mais tu as fait des efforts. Demain, revanche ?`,
    teasing: () => `Journée pour moi. Je t'attends demain pour ta revanche.`,
    ruthless: () => `Journée pour moi. Comme prévu.`,
  },
  resultLost: {
    kind: ({ exercise, target }) => `${exercise}, j'ai eu l'avantage. La prochaine fois je vise ${target}, on progresse ensemble.`,
    teasing: ({ exercise, target }) => `${exercise}, c'est mon terrain. La prochaine fois je vise ${target}.`,
    ruthless: ({ exercise, target }) => `${exercise} : trop facile. Prochain objectif : ${target}. Suis-moi si tu peux.`,
  },
  resultAllWon: {
    kind: () => `Tu as tout donné, bravo ! Demain j'augmente un peu mes objectifs.`,
    teasing: () => `Respect. Demain j'augmente mes objectifs, prépare-toi.`,
    ruthless: () => `Tu as gagné cette fois. Demain, je monte d'un cran.`,
  },
  weekLeft: {
    kind: ({ days }) => `Il reste ${days} jour${days > 1 ? 's' : ''} cette semaine. Chaque jour compte, on y va ensemble.`,
    teasing: ({ days }) => `Il reste ${days} jour${days > 1 ? 's' : ''} cette semaine. Je compte bien tous les gagner.`,
    ruthless: ({ days }) => `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}. Je les veux tous.`,
  },
  weekOverWon: {
    kind: () => `Semaine pour toi, bravo ! Lundi, on remet les compteurs à zéro.`,
    teasing: () => `Semaine perdue pour moi. Lundi, je prends ma revanche.`,
    ruthless: () => `Tu as eu cette semaine. Lundi, je ne te laisse rien.`,
  },
  weekOverLost: {
    kind: () => `Semaine pour moi, mais tu progresses. Lundi, tu as ta revanche.`,
    teasing: () => `Semaine pour moi. Lundi, tu as ta revanche.`,
    ruthless: () => `Semaine pour moi. Recommence lundi.`,
  },
};

export function say(tone, key, params = {}) {
  const entry = LINES[key];
  if (!entry) return '';
  const fn = entry[tone] || entry.teasing;
  return fn(params);
}
