import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { say } from '../rival';
import { Avatar, Bar, PrimaryButton, RivalBubble, SecondaryButton, styles, Title } from '../components';

import { longLabel } from '../dates';

const STATE_LABEL = { win: 'Gagné', loss: 'Perdu', tie: 'Égalité', pending: 'En cours' };

export default function DuelScreen({ go, todayKey, today, week, protein, steps, sessionDone, stepStatus, onAddSteps }) {
  const profile = useProfile();
  const { rivalName: RIVAL_NAME, tone } = profile;
  const PROTEIN_GOAL = profile.goals.protein;
  const STEPS_GOAL = profile.goals.steps;
  const sessionState = today.events.find((e) => e.key === 'seance').state;
  const rows = [
    { label: 'Séance', target: '5 exercices', me: STATE_LABEL[sessionState], meP: sessionState === 'pending' ? 0 : 100, rival: 'faite', rP: 100, state: sessionState },
    { label: 'Protéines', target: `objectif ${PROTEIN_GOAL} g`, me: `${protein} g`, meP: (protein / PROTEIN_GOAL) * 100, rival: `${PROTEIN_GOAL} g`, rP: 100, state: today.events[1].state },
    { label: 'Pas', target: `objectif ${STEPS_GOAL.toLocaleString('fr-FR')}`, me: steps.toLocaleString('fr-FR'), meP: (steps / STEPS_GOAL) * 100, rival: STEPS_GOAL.toLocaleString('fr-FR'), rP: 100, state: today.events[2].state },
  ];

  const missing = Math.max(0, PROTEIN_GOAL - protein);
  const message =
    today.decided === 'win'
      ? say(tone, 'dayWon')
      : today.decided === 'loss'
        ? say(tone, 'dayLost')
        : missing > 0
          ? say(tone, 'missingProtein', { missing })
          : sessionState === 'pending'
            ? say(tone, 'sessionPending')
            : say(tone, 'stepsLeft', { steps: Math.max(0, STEPS_GOAL - steps + 1).toLocaleString('fr-FR') });

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title kicker={longLabel(todayKey)}>{profile.name ? `${profile.name} vs ${RIVAL_NAME}` : 'Duel du jour'}</Title>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 999, paddingVertical: 6, paddingLeft: 6, paddingRight: 12 }}>
          <Avatar />
          <Text style={{ color: colors.text, fontWeight: '700' }}>{RIVAL_NAME}</Text>
        </View>
      </View>

      <View style={[styles.card, { gap: 16 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={styles.label}>Toi</Text>
            <Text style={[styles.big, { color: colors.me }]}>{week.me}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13, paddingBottom: 10, textAlign: 'center' }}>
            Score de la semaine{'\n'}aujourd'hui {today.me}–{today.nova}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>{RIVAL_NAME}</Text>
            <Text style={[styles.big, { color: colors.rival }]}>{week.nova}</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.line }} />
        {rows.map((r) => (
          <View key={r.label} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {r.label}
                {r.state === 'win' ? '  ✓' : ''}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{r.target}</Text>
            </View>
            <Row who="Toi" pct={r.meP} value={r.me} color={colors.me} />
            <Row who={RIVAL_NAME} pct={r.rP} value={r.rival} color={colors.rival} />
          </View>
        ))}
{stepStatus === 'ok' ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>Pas comptés automatiquement par ton téléphone.</Text>
        ) : stepStatus === 'checking' ? null : (
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
              {stepStatus === 'denied'
                ? "Podomètre refusé : autorise « Mouvements et forme » pour Expo Go dans les Réglages de l'iPhone."
                : 'Podomètre indisponible sur cet appareil.'}
            </Text>
            <Pressable onPress={onAddSteps} accessibilityRole="button" style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 12, textDecorationLine: 'underline' }}>Test : simuler +1 000 pas</Text>
            </Pressable>
          </View>
        )}
      </View>

      <RivalBubble>{message}</RivalBubble>

      <View style={{ gap: 10 }}>
        <PrimaryButton label="Photographier un repas" onPress={() => go('photo')} />
        {sessionDone ? (
          <SecondaryButton label="Séance faite · voir le résultat" onPress={() => go('result')} />
        ) : (
          <SecondaryButton label="Lancer ma séance du jour · 25 min" onPress={() => go('session')} />
        )}
      </View>
    </ScrollView>
  );
}

function Row({ who, pct, value, color }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ width: 40, fontSize: 12, color: colors.muted }}>{who}</Text>
      <Bar pct={pct} color={color} />
      <Text style={{ width: 64, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.text }}>{value}</Text>
    </View>
  );
}
