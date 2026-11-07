import { ScrollView, Text, View } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { say } from '../rival';
import { PrimaryButton, RivalBubble, SecondaryButton, styles, Title } from '../components';
import { formatScore } from '../data';

const LABEL = { win: 'Gagné', loss: 'Perdu', tie: 'Égalité' };

export default function ResultScreen({ go, results, today, protein }) {
  const profile = useProfile();
  const { rivalName: RIVAL_NAME, tone } = profile;
  const PROTEIN_GOAL = profile.goals.protein;
  const STEPS_GOAL = profile.goals.steps;
  if (!results) return null;
  const won = results.filter((r) => r.outcome === 'win').length;
  const lost = results.filter((r) => r.outcome === 'loss').length;
  const ties = results.length - won - lost;
  const title = won > lost ? `Tu as battu ${RIVAL_NAME}` : lost > won ? `${RIVAL_NAME} gagne cette séance` : 'Match nul';
  const worst = results.find((r) => r.outcome === 'loss');
  const taunt = worst
    ? say(tone, 'resultLost', { exercise: worst.name, target: formatScore(worst.type, Math.ceil(worst.nova * 1.07)) })
    : say(tone, 'resultAllWon');

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Title kicker="Brûle-graisse maison · séance terminée">{title}</Title>

      <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View>
          <Text style={styles.label}>Toi</Text>
          <Text style={[styles.big, { color: colors.me }]}>{won}</Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
          exercices gagnés{'\n'}
          {ties} égalité{ties > 1 ? 's' : ''}
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>{RIVAL_NAME}</Text>
          <Text style={[styles.big, { color: colors.rival }]}>{lost}</Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {results.map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '700' }}>{r.name}</Text>
            <Text style={{ color: colors.soft, fontSize: 13 }}>
              {formatScore(r.type, r.me)} vs {formatScore(r.type, r.nova)}
            </Text>
            <Text
              style={[
                { width: 64, textAlign: 'center', fontSize: 11, fontWeight: '800', borderRadius: 999, paddingVertical: 4, overflow: 'hidden' },
                r.outcome === 'win' && { backgroundColor: colors.me, color: colors.bg },
                r.outcome === 'loss' && { borderWidth: 1.5, borderColor: colors.rival, color: colors.rival },
                r.outcome === 'tie' && { backgroundColor: colors.line, color: colors.soft },
              ]}
            >
              {LABEL[r.outcome]}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: colors.winBg, borderRadius: 16, padding: 14 }}>
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
          Épreuve « Séance » {won > lost ? 'gagnée' : lost > won ? 'perdue' : 'à égalité'}. Aujourd'hui : <Text style={{ fontWeight: '800' }}>{today.me}–{today.nova}</Text>.
          {protein < PROTEIN_GOAL ? ` Prochaine épreuve : les protéines (${protein} / ${PROTEIN_GOAL} g).` : ''}
        </Text>
      </View>

      <RivalBubble>{taunt}</RivalBubble>

      <View style={{ gap: 10 }}>
        <PrimaryButton label="Voir mon bilan de la semaine" onPress={() => go('week')} />
        <SecondaryButton label="Retour au duel" onPress={() => go('duel')} />
      </View>
    </ScrollView>
  );
}
