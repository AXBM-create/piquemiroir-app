import { Pressable, ScrollView, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors } from '../theme';
import { Bar, Title } from '../components';
import { EXERCISES, PROGRAMS } from '../data';

const videoOf = (id) => EXERCISES.find((e) => e.id === id).video;

export default function ProgramsScreen({ go }) {
  const featured = PROGRAMS[0];
  const others = PROGRAMS.slice(1);
  const player = useVideoPlayer(videoOf(featured.thumb), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Title kicker="Choisis ton terrain de duel">Programmes</Title>

      <Pressable accessibilityRole="button" onPress={() => go('session')} style={{ backgroundColor: colors.card, borderRadius: 24, padding: 10, flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 118, height: 206, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.videoBg }}>
          <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />
        </View>
        <View style={{ flex: 1, gap: 8, paddingVertical: 6 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.me, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.bg }}>En cours · sem. 2/6</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{featured.name}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19 }}>{featured.meta}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Bar pct={33} color={colors.me} />
          </View>
          <Text style={{ marginTop: 'auto', fontSize: 15, fontWeight: '800', color: colors.me }}>▶ Commencer</Text>
        </View>
      </Pressable>

      <View style={{ gap: 10 }}>
        {others.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 10 }}>
            <View style={{ width: 36, height: 64, borderRadius: 8, backgroundColor: colors.videoBg }} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: colors.text }}>{p.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{p.meta}</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
              Bientôt
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
