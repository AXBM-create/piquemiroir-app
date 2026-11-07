import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, RIVAL_NAME } from '../theme';
import { PrimaryButton, Title } from '../components';

const PERKS = ['Rival IA calé sur ton objectif', 'Analyse photo illimitée des repas', 'Duel quotidien et bilan chaque semaine', 'Programmes vidéo et séances en duel'];

export default function PaywallScreen({ onReset }) {
  const [plan, setPlan] = useState('annual');
  const annual = plan === 'annual';

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
      <Title kicker="PiqueMiroir Premium">{`${RIVAL_NAME} est prête.\nEt toi ?`}</Title>
      <Text style={{ color: colors.soft, fontSize: 15, lineHeight: 21 }}>Ton rival IA s'adapte à ton objectif. Il ne saute jamais une séance.</Text>

      <View style={{ gap: 10 }}>
        {PERKS.map((p) => (
          <Text key={p} style={{ color: colors.text, fontSize: 14 }}>
            <Text style={{ color: colors.me, fontWeight: '800' }}>✓ </Text>
            {p}
          </Text>
        ))}
      </View>

      <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
        <Plan selected={annual} onPress={() => setPlan('annual')} title="Annuel" detail="59,99 $ par an, soit 5 $ par mois" badge="−61 %" />
        <Plan selected={!annual} onPress={() => setPlan('monthly')} title="Mensuel" detail="12,99 $ par mois" />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Step title="Aujourd'hui" text="accès complet" />
        <Step title="Jour 5" text="rappel" center />
        <Step title="Jour 7" text="1er paiement" right />
      </View>

      <PrimaryButton label="Commencer mes 7 jours gratuits" onPress={() => Alert.alert('Prototype', "Le paiement n'est pas encore activé dans cette version de test.")} />
      <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12 }}>
        {annual ? 'Puis 59,99 $ par an.' : 'Puis 12,99 $ par mois.'} Annulable à tout moment.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert('Réinitialiser', 'Effacer tous tes scores, repas et séances enregistrés sur ce téléphone ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Effacer', style: 'destructive', onPress: onReset },
          ])
        }
        style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 12 }}
      >
        <Text style={{ color: colors.muted, fontSize: 12, textDecorationLine: 'underline' }}>Test : réinitialiser mes données</Text>
      </Pressable>
    </ScrollView>
  );
}

function Plan({ selected, onPress, title, detail, badge }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{ minHeight: 72, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: selected ? colors.winBg : colors.card, borderWidth: 2, borderColor: selected ? colors.me : colors.line }}
    >
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{detail}</Text>
      </View>
      {badge ? (
        <Text style={{ backgroundColor: colors.me, color: colors.bg, fontSize: 11, fontWeight: '800', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, overflow: 'hidden' }}>{badge}</Text>
      ) : null}
    </Pressable>
  );
}

function Step({ title, text, center, right }) {
  return (
    <Text style={{ color: colors.muted, fontSize: 12, textAlign: right ? 'right' : center ? 'center' : 'left' }}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
      {'\n'}
      {text}
    </Text>
  );
}
