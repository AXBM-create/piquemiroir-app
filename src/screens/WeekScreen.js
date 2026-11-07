import { Share, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { say } from '../rival';
import { PrimaryButton, RivalBubble, Title } from '../components';
import { shortRange } from '../dates';

const MARK = { win: 'G', loss: 'P', today: '•' };

export default function WeekScreen({ week, lastWeek }) {
  const profile = useProfile();
  const { rivalName: RIVAL_NAME, tone } = profile;
  const PROTEIN_GOAL = profile.goals.protein;
  const STEPS_GOAL = profile.goals.steps;
  const leading = week.me > week.nova;
  const tied = week.me === week.nova;
  const remaining = week.days.filter((d) => d.state === 'future' || d.state === 'today').length;
  const share = () =>
    Share.share({
      message: `Cette semaine sur PiqueMiroir : ${week.me}–${week.nova} contre mon rival IA ${RIVAL_NAME}. Et toi, tu tiendrais ?`,
    });

  const headline = leading
    ? 'Je mène contre mon rival IA'
    : tied
      ? `Égalité avec ${RIVAL_NAME}`
      : `${RIVAL_NAME} mène, je n'ai pas dit mon dernier mot`;

  const taunt =
    remaining === 0
      ? leading
        ? say(tone, 'weekOverWon')
        : say(tone, 'weekOverLost')
      : say(tone, 'weekLeft', { days: remaining });

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Title kicker={`Semaine du ${shortRange(week.keys)}`}>Ton bilan</Title>

      <View style={{ borderRadius: 28, backgroundColor: colors.me, padding: 24, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', fontSize: 15, color: colors.bg }}>PiqueMiroir</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.bg, backgroundColor: 'rgba(14,15,18,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' }}>
            {remaining === 0 ? 'Semaine terminée' : 'Semaine en cours'}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.bg }}>{headline}</Text>
          <Text style={{ fontSize: 88, fontWeight: '800', color: colors.bg, letterSpacing: -2, lineHeight: 92 }}>
            {week.me}–{week.nova}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {week.days.map((d) => (
            <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
              <View
                style={[
                  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
                  d.state === 'win' && { backgroundColor: colors.bg },
                  d.state === 'loss' && { borderWidth: 2, borderColor: colors.bg },
                  (d.state === 'today' || d.state === 'future' || d.state === 'none') && { borderWidth: 2, borderColor: 'rgba(14,15,18,0.25)', borderStyle: 'dashed' },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: d.state === 'win' ? colors.text : colors.bg }}>{MARK[d.state] ?? ''}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.bg }}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
        G = journée gagnée, P = perdue. Une journée se gagne avec 2 épreuves sur 3 ; à minuit, les épreuves non faites reviennent à {RIVAL_NAME}.
      </Text>

      <RivalBubble>{taunt}</RivalBubble>

      {lastWeek ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Semaine précédente</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>
            {lastWeek.me}–{lastWeek.nova} {lastWeek.me > lastWeek.nova ? '· gagnée' : lastWeek.me < lastWeek.nova ? '· perdue' : '· nulle'}
          </Text>
        </View>
      ) : null}

      <PrimaryButton label="Partager mon score" onPress={share} />
    </ScrollView>
  );
}
