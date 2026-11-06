import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './src/theme';
import { EXERCISES } from './src/data';
import DuelScreen from './src/screens/DuelScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import SessionScreen from './src/screens/SessionScreen';
import ResultScreen from './src/screens/ResultScreen';
import WeekScreen from './src/screens/WeekScreen';
import PaywallScreen from './src/screens/PaywallScreen';

export const PROTEIN_GOAL = 120;
export const STEPS_GOAL = 8000;

const TABS = [
  { key: 'duel', label: 'Duel' },
  { key: 'programs', label: 'Programmes' },
  { key: 'week', label: 'Bilan' },
  { key: 'paywall', label: 'Profil' },
];

// Jours passés de la semaine (démo) : true = gagné, false = perdu.
const PAST_DAYS = [
  { day: 'L', won: true },
  { day: 'M', won: true },
  { day: 'M', won: false },
];

export default function App() {
  const [screen, setScreen] = useState('duel');
  const [protein, setProtein] = useState(84);
  const [steps, setSteps] = useState(6200);
  const [session, setSession] = useState(null); // 'win' | 'loss' | 'tie' | null
  const [lastResults, setLastResults] = useState(null);
  const [best, setBest] = useState(() => Object.fromEntries(EXERCISES.map((e) => [e.id, e.startBest])));

  // Les 3 épreuves du jour : séance, protéines, pas. Nova atteint toujours ses objectifs.
  const today = useMemo(() => {
    const events = [
      { key: 'seance', label: 'Séance', state: session ?? 'pending' },
      { key: 'protein', label: 'Protéines', state: protein >= PROTEIN_GOAL ? 'win' : 'pending' },
      { key: 'steps', label: 'Pas', state: steps > STEPS_GOAL ? 'win' : 'pending' },
    ];
    const me = events.filter((e) => e.state === 'win').length;
    const nova = events.filter((e) => e.state === 'loss').length;
    const decided = me >= 2 ? 'win' : nova >= 2 ? 'loss' : null;
    return { events, me, nova, decided };
  }, [session, protein, steps]);

  const week = useMemo(() => {
    const days = [
      ...PAST_DAYS.map((d) => ({ ...d, state: d.won ? 'win' : 'loss' })),
      { day: 'J', state: today.decided ?? 'today' },
      { day: 'V', state: 'future' },
      { day: 'S', state: 'future' },
      { day: 'D', state: 'future' },
    ];
    return {
      days,
      me: days.filter((d) => d.state === 'win').length,
      nova: days.filter((d) => d.state === 'loss').length,
    };
  }, [today.decided]);

  const finishSession = (results) => {
    const won = results.filter((r) => r.outcome === 'win').length;
    const lost = results.filter((r) => r.outcome === 'loss').length;
    setSession(won > lost ? 'win' : lost > won ? 'loss' : 'tie');
    setBest((b) => {
      const next = { ...b };
      results.forEach((r) => {
        next[r.id] = Math.max(next[r.id], r.me);
      });
      return next;
    });
    setLastResults(results);
    setScreen('result');
  };

  const go = setScreen;
  const showTabs = ['duel', 'programs', 'week', 'paywall'].includes(screen);

  let content = null;
  if (screen === 'duel') {
    content = (
      <DuelScreen
        go={go}
        today={today}
        week={week}
        protein={protein}
        steps={steps}
        onAddSteps={() => setSteps((s) => s + 1000)}
      />
    );
  } else if (screen === 'photo') {
    content = <PhotoScreen go={go} protein={protein} onAdd={(g) => setProtein((p) => p + g)} />;
  } else if (screen === 'programs') {
    content = <ProgramsScreen go={go} />;
  } else if (screen === 'session') {
    content = <SessionScreen go={go} best={best} onFinish={finishSession} />;
  } else if (screen === 'result') {
    content = <ResultScreen go={go} results={lastResults} today={today} protein={protein} />;
  } else if (screen === 'week') {
    content = <WeekScreen go={go} week={week} />;
  } else if (screen === 'paywall') {
    content = <PaywallScreen go={go} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }}>{content}</View>
        {showTabs ? (
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: screen === t.key }}
                onPress={() => go(t.key)}
                style={styles.tab}
              >
                <View style={[styles.tabDot, screen === t.key && { backgroundColor: colors.me }]} />
                <Text style={[styles.tabText, screen === t.key && { color: colors.me }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.cardAlt,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 44, justifyContent: 'center' },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  tabText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
});
