import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { say } from '../rival';
import { EFFORT_SECONDS, EXERCISES, HOLD_MAX_SECONDS, formatScore, novaTarget } from '../data';

// Phases d'un exercice : 'ready' (on regarde la démo) -> 'go' (effort) -> 'done' (verdict).
export default function SessionScreen({ go, best, onFinish }) {
  const profile = useProfile();
  const { rivalName: RIVAL_NAME, tone } = profile;
  const PROTEIN_GOAL = profile.goals.protein;
  const STEPS_GOAL = profile.goals.steps;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('ready');
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState(0);
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  const ex = EXERCISES[idx];
  const nova = novaTarget(best[ex.id]);
  const isHold = ex.type === 'hold';
  const limit = isHold ? HOLD_MAX_SECONDS : EFFORT_SECONDS;

  const player = useVideoPlayer(ex.video, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Changer de vidéo quand on passe à l'exercice suivant.
  useEffect(() => {
    let alive = true;
    player.replaceAsync(ex.video).then(() => {
      if (alive) player.play();
    });
    return () => {
      alive = false;
    };
  }, [idx]);

  // Chronomètre de l'effort.
  useEffect(() => {
    if (phase !== 'go') return undefined;
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'go' && elapsed >= limit) finishExercise();
  }, [elapsed]);

  const start = () => {
    setElapsed(0);
    setReps(0);
    setPhase('go');
  };

  const finishExercise = () => {
    clearInterval(timer.current);
    const me = isHold ? elapsed : reps;
    const outcome = me > nova ? 'win' : me < nova ? 'loss' : 'tie';
    setResults((r) => [...r, { id: ex.id, name: ex.name, type: ex.type, me, nova, outcome }]);
    setPhase('done');
  };

  const next = () => {
    if (idx === EXERCISES.length - 1) {
      onFinish(results);
      return;
    }
    setIdx(idx + 1);
    setPhase('ready');
    setElapsed(0);
    setReps(0);
  };

  // Progression en direct de Nova pendant l'effort (pour la sensation de course).
  const novaLive = isHold ? Math.min(elapsed, nova) : Math.min(nova, Math.round((nova * elapsed) / EFFORT_SECONDS));
  const meNow = isHold ? elapsed : reps;
  const last = results[results.length - 1];
  const remaining = isHold ? elapsed : Math.max(0, EFFORT_SECONDS - elapsed);
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  let status = `Objectif de ${RIVAL_NAME} : ${formatScore(ex.type, nova)}`;
  if (phase === 'go') status = meNow > novaLive ? 'Tu mènes' : meNow < novaLive ? `${RIVAL_NAME} mène` : 'Égalité';
  if (phase === 'done' && last) status = last.outcome === 'win' ? 'Exercice gagné' : last.outcome === 'loss' ? 'Exercice perdu' : 'Égalité';

  return (
    <View style={{ flex: 1 }}>
      <View style={s.videoBox}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
        <View style={s.steps}>
          {EXERCISES.map((e, k) => (
            <View key={e.id} style={[s.step, { backgroundColor: k < idx ? colors.me : k === idx ? colors.text : 'rgba(244,245,247,0.45)' }]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Quitter la séance" onPress={() => go('programs')} style={s.close}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>✕</Text>
        </Pressable>
        <View style={s.counter}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
            Exercice {idx + 1} / {EXERCISES.length}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{ex.name}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>{ex.tip}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: colors.me }}>{clock}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>{isHold ? 'tenu' : 'restant'}</Text>
        </View>
      </View>

      <View style={s.duel}>
        <View>
          <Text style={{ fontSize: 11, color: colors.muted }}>Toi</Text>
          <Text style={[s.score, { color: colors.me }]}>{formatScore(ex.type, phase === 'done' ? last.me : meNow)}</Text>
        </View>
        <Text style={{ flex: 1, textAlign: 'center', color: colors.soft, fontSize: 12, fontWeight: '700' }}>{status}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: colors.muted }}>{RIVAL_NAME}</Text>
          <Text style={[s.score, { color: colors.rival }]}>{formatScore(ex.type, phase === 'ready' ? nova : phase === 'done' ? nova : novaLive)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingHorizontal: 20, paddingBottom: 12 }}>
        {phase === 'ready' ? (
          <Pressable accessibilityRole="button" onPress={start} style={s.primary}>
            <Text style={s.primaryText}>Démarrer · {isHold ? 'tiens le plus longtemps' : `${EFFORT_SECONDS} s`}</Text>
          </Pressable>
        ) : null}

        {phase === 'go' && !isHold ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une répétition" onPress={() => setReps((r) => r + 1)} style={[s.primary, { flex: 1, height: 72 }]}>
              <Text style={[s.primaryText, { fontSize: 22 }]}>+1 répétition</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={finishExercise} style={[s.secondary, { width: 96, height: 72 }]}>
              <Text style={s.secondaryText}>Fini</Text>
            </Pressable>
          </View>
        ) : null}

        {phase === 'go' && isHold ? (
          <Pressable accessibilityRole="button" onPress={finishExercise} style={[s.primary, { height: 72 }]}>
            <Text style={[s.primaryText, { fontSize: 20 }]}>Je lâche</Text>
          </Pressable>
        ) : null}

        {phase === 'done' ? (
          <Pressable accessibilityRole="button" onPress={next} style={s.primary}>
            <Text style={s.primaryText}>{idx === EXERCISES.length - 1 ? 'Voir le résultat du duel' : 'Exercice suivant'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  videoBox: { height: '58%', backgroundColor: colors.videoBg, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  steps: { position: 'absolute', top: 12, left: 20, right: 20, flexDirection: 'row', gap: 4 },
  step: { flex: 1, height: 4, borderRadius: 999 },
  close: { position: 'absolute', top: 26, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(14,15,18,0.6)', alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', top: 34, right: 16, backgroundColor: 'rgba(14,15,18,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  duel: { marginHorizontal: 20, marginTop: 12, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  score: { fontSize: 26, fontWeight: '800' },
  primary: { height: 56, borderRadius: 16, backgroundColor: colors.me, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  secondary: { borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
