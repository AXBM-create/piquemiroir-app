import { Share, ScrollView, Text, View } from 'react-native';
import { colors, RIVAL_NAME } from '../theme';
import { PrimaryButton, RivalBubble, Title } from '../components';

export default function WeekScreen({ week }) {
  const leading = week.me > week.nova;
  const share = () =>
    Share.share({
      message: `Cette semaine sur PiqueMiroir : ${week.me}–${week.nova} contre mon rival IA ${RIVAL_NAME}. Et toi, tu tiendrais ?`,
    });

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Title kicker="Cette semaine">Ton bilan</Title>

      <View style={{ borderRadius: 28, backgroundColor: colors.me, padding: 24, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', fontSize: 15, color: colors.bg }}>PiqueMiroir</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.bg, backgroundColor: 'rgba(14,15,18,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' }}>
            Semaine en cours
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.bg }}>
            {leading ? 'Je mène contre mon rival IA' : `${RIVAL_NAME} mène, je n'ai pas dit mon dernier mot`}
          </Text>
          <Text style={{ fontSize: 88, fontWeight: '800', color: colors.bg, letterSpacing: -2, lineHeight: 92 }}>
            {week.me}–{week.nova}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {week.days.map((d, k) => (
            <View key={k} style={{ alignItems: 'center', gap: 6 }}>
              <View
                style={[
                  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
                  d.state === 'win' && { backgroundColor: colors.bg },
                  d.state === 'loss' && { borderWidth: 2, borderColor: colors.bg },
                  (d.state === 'today' || d.state === 'future') && { borderWidth: 2, borderColor: 'rgba(14,15,18,0.25)', borderStyle: 'dashed' },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: d.state === 'win' ? colors.text : colors.bg }}>
                  {d.state === 'win' ? 'G' : d.state === 'loss' ? 'P' : d.state === 'today' ? '•' : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.bg }}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <RivalBubble>La semaine n'est pas finie. Je compte bien gagner vendredi, samedi et dimanche.</RivalBubble>

      <PrimaryButton label="Partager mon score" onPress={share} />
    </ScrollView>
  );
}
