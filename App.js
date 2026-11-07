import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './src/theme';
import { addDays, dayKey, dayLetter, weekDays } from './src/dates';
import { clearState, emptyDay, initialState, loadState, saveState } from './src/storage';
import { evaluateDay } from './src/rules';
import { EXERCISES } from './src/data';
import { ProfileContext, startBests } from './src/profile';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DuelScreen from './src/screens/DuelScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import SessionScreen from './src/screens/SessionScreen';
import ResultScreen from './src/screens/ResultScreen';
import WeekScreen from './src/screens/WeekScreen';
import PaywallScreen from './src/screens/PaywallScreen';

const TABS = [
  { key: 'duel', label: 'Duel' },
  { key: 'programs', label: 'Programmes' },
  { key: 'week', label: 'Bilan' },
  { key: 'paywall', label: 'Profil' },
];

// Calcule le résultat d'une semaine (lundi → dimanche) à partir des journées enregistrées.
function buildWeek(state, todayKey, refKey = todayKey) {
  const goals = state.profile?.goals;
  const days = weekDays(refKey).map((key) => {
    let s;
    if (key > todayKey) s = 'future';
    else if (key < state.startedOn) s = 'none'; // avant l'installation : non compté
    else if (key === todayKey) s = evaluateDay(state.days[key], false, goals).decided ?? 'today';
    else s = evaluateDay(state.days[key], true, goals).decided; // journée terminée
    return { key, day: dayLetter(key), state: s };
  });
  return {
    keys: days.map((d) => d.key),
    days,
    me: days.filter((d) => d.state === 'win').length,
    nova: days.filter((d) => d.state === 'loss').length,
  };
}

export default function App() {
  const [screen, setScreen] = useState('duel');
  const [todayKey, setTodayKey] = useState(dayKey());
  const [state, setState] = useState(null); // null = chargement
  const loaded = useRef(false);

  // Chargement au démarrage.
  useEffect(() => {
    loadState(dayKey()).then((s) => {
      setState(s);
      loaded.current = true;
    });
  }, []);

  // Sauvegarde à chaque changement.
  useEffect(() => {
    if (loaded.current && state) saveState(state);
  }, [state]);

  // Passage à minuit : on vérifie la date chaque minute et au retour dans l'app.
  useEffect(() => {
    const check = () => setTodayKey((k) => (k === dayKey() ? k : dayKey()));
    const timer = setInterval(check, 60 * 1000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const day = (state && state.days[todayKey]) || emptyDay();

  const updateToday = useCallback(
    (fn) =>
      setState((s) => {
        const current = s.days[todayKey] || emptyDay();
        return { ...s, days: { ...s.days, [todayKey]: fn(current) } };
      }),
    [todayKey],
  );

  const today = useMemo(() => evaluateDay(day, false, state?.profile?.goals), [day, state?.profile]);
  const week = useMemo(() => (state ? buildWeek(state, todayKey) : null), [state, todayKey]);
  const lastWeek = useMemo(() => {
    if (!state) return null;
    const sunday = addDays(weekDays(todayKey)[0], -1);
    if (sunday < state.startedOn) return null; // pas encore de semaine précédente
    return buildWeek(state, todayKey, sunday);
  }, [state, todayKey]);

  if (!state) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.me} />
      </View>
    );
  }

  const saveProfile = (profile) => {
    setState((s) => ({
      ...s,
      profile,
      // Premier profil : les scores de départ du rival suivent le niveau choisi.
      best: s.profile || Object.keys(s.days).length ? s.best : startBests(EXERCISES, profile.level),
    }));
    setScreen('duel');
  };

  if (!state.profile || screen === 'editProfile') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <OnboardingScreen
            initial={state.profile}
            onDone={saveProfile}
            onCancel={state.profile ? () => setScreen('paywall') : undefined}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const addMeal = (meal) =>
    updateToday((d) => ({
      ...d,
      protein: d.protein + meal.protein,
      meals: [...d.meals, { at: new Date().toISOString(), title: meal.title, protein: meal.protein }],
    }));

  const finishSession = (results) => {
    const won = results.filter((r) => r.outcome === 'win').length;
    const lost = results.filter((r) => r.outcome === 'loss').length;
    const outcome = won > lost ? 'win' : lost > won ? 'loss' : 'tie';
    setState((s) => {
      const best = { ...s.best };
      results.forEach((r) => {
        best[r.id] = Math.max(best[r.id] ?? 0, r.me);
      });
      const current = s.days[todayKey] || emptyDay();
      return { ...s, best, days: { ...s.days, [todayKey]: { ...current, session: outcome, results } } };
    });
    setScreen('result');
  };

  const resetAll = async () => {
    await clearState();
    setState(initialState(dayKey()));
    setScreen('duel');
  };

  const go = setScreen;
  const showTabs = ['duel', 'programs', 'week', 'paywall'].includes(screen);

  let content = null;
  if (screen === 'duel') {
    content = (
      <DuelScreen
        go={go}
        todayKey={todayKey}
        today={today}
        week={week}
        protein={day.protein}
        steps={day.steps}
        sessionDone={!!day.session}
        onAddSteps={() => updateToday((d) => ({ ...d, steps: d.steps + 1000 }))}
      />
    );
  } else if (screen === 'photo') {
    content = <PhotoScreen go={go} protein={day.protein} onAdd={addMeal} />;
  } else if (screen === 'programs') {
    content = <ProgramsScreen go={go} />;
  } else if (screen === 'session') {
    content = <SessionScreen go={go} best={state.best} onFinish={finishSession} />;
  } else if (screen === 'result') {
    content = <ResultScreen go={go} results={day.results} today={today} protein={day.protein} />;
  } else if (screen === 'week') {
    content = <WeekScreen go={go} week={week} lastWeek={lastWeek} />;
  } else if (screen === 'paywall') {
    content = <PaywallScreen go={go} onReset={resetAll} onEditProfile={() => setScreen('editProfile')} />;
  }

  return (
    <ProfileContext.Provider value={state.profile}>
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
    </ProfileContext.Provider>
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
