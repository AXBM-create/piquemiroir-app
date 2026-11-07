import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { FREE_PHOTOS_PER_DAY, usePremium } from '../premium';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { say } from '../rival';
import { PrimaryButton, SecondaryButton, Title } from '../components';
import { GOALS, LEVELS, TONES } from '../profile';

const PERKS = ['Analyse photo illimitée des repas', 'Rival IA calé sur ton objectif', 'Tous les programmes vidéo en duel', 'Bilan de la semaine et historique'];

export default function PaywallScreen({ onReset, onEditProfile }) {
  const profile = useProfile();
  const { rivalName: RIVAL_NAME, tone } = profile;
  const PROTEIN_GOAL = profile.goals.protein;
  const STEPS_GOAL = profile.goals.steps;
  const premium = usePremium();
  const [plan, setPlan] = useState('annual');
  const [busy, setBusy] = useState(false);
  const annualPkg = premium.offering?.annual ?? null;
  const monthlyPkg = premium.offering?.monthly ?? null;
  const selected = plan === 'annual' ? annualPkg || monthlyPkg : monthlyPkg || annualPkg;
  const annual = selected === annualPkg;
  const trial = selected?.product?.introPrice && selected.product.introPrice.price === 0 ? selected.product.introPrice : null;
  const saving =
    annualPkg && monthlyPkg && monthlyPkg.product.price > 0
      ? Math.round((1 - annualPkg.product.price / (monthlyPkg.product.price * 12)) * 100)
      : 0;

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const ok = await premium.purchase(selected);
      if (ok) Alert.alert('Bienvenue dans Premium', `Analyse photo illimitée débloquée. ${RIVAL_NAME} n'a qu'à bien se tenir.`);
    } catch (e) {
      Alert.alert('Achat impossible', e?.message || 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const ok = await premium.restore();
      Alert.alert('Restauration', ok ? 'Ton abonnement Premium est de nouveau actif.' : 'Aucun abonnement trouvé pour ce compte.');
    } catch (e) {
      Alert.alert('Restauration impossible', e?.message || 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 8 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{profile.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
          {GOALS.find((g) => g.key === profile.goal)?.label} · {LEVELS.find((l) => l.key === profile.level)?.label} ·{' '}
          {profile.unit === 'lb' ? `${Math.round(profile.weightKg * 2.20462)} lb` : `${profile.weightKg} kg`}
          {'\n'}Rival : {RIVAL_NAME} ({TONES.find((t) => t.key === tone)?.label.toLowerCase()}) · {PROTEIN_GOAL} g de protéines · {STEPS_GOAL.toLocaleString('fr-FR')} pas
        </Text>
        <SecondaryButton label="Modifier mon profil" onPress={onEditProfile} style={{ height: 44 }} />
      </View>

      {premium.isPro ? (
        <View style={{ backgroundColor: colors.winBg, borderRadius: 20, padding: 18, gap: 8, borderWidth: 2, borderColor: colors.me }}>
          <Text style={{ color: colors.me, fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>PREMIUM ACTIF</Text>
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21 }}>Analyse photo illimitée et tous les avantages Premium sont débloqués.</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Mode test : aucun paiement réel.</Text>
        </View>
      ) : (
        <>
          <Title kicker="PiqueMiroir Premium">{`${RIVAL_NAME} t'attend.\nEt toi ?`}</Title>
          <Text style={{ color: colors.soft, fontSize: 15, lineHeight: 21 }}>
            Version gratuite : {FREE_PHOTOS_PER_DAY} analyses de repas par jour. Premium enlève toutes les limites.
          </Text>

          <View style={{ gap: 10 }}>
            {PERKS.map((p) => (
              <Text key={p} style={{ color: colors.text, fontSize: 14 }}>
                <Text style={{ color: colors.me, fontWeight: '800' }}>✓ </Text>
                {p}
              </Text>
            ))}
          </View>

          {!premium.ready ? (
            <ActivityIndicator color={colors.me} />
          ) : !annualPkg && !monthlyPkg ? (
            <Text style={{ color: colors.rival, fontSize: 13, lineHeight: 19 }}>
              Les formules ne sont pas disponibles pour le moment{premium.error ? ` (${premium.error})` : ''}.
            </Text>
          ) : (
            <>
              <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
                {annualPkg ? (
                  <Plan
                    selected={annual}
                    onPress={() => setPlan('annual')}
                    title="Annuel"
                    detail={`${annualPkg.product.priceString} par an${annualPkg.product.pricePerMonthString ? `, soit ${annualPkg.product.pricePerMonthString} par mois` : ''}`}
                    badge={saving > 0 ? `−${saving} %` : null}
                  />
                ) : null}
                {monthlyPkg ? (
                  <Plan selected={!annual} onPress={() => setPlan('monthly')} title="Mensuel" detail={`${monthlyPkg.product.priceString} par mois`} />
                ) : null}
              </View>

              {trial ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Step title="Aujourd'hui" text="accès complet" />
                  <Step title="Avant la fin" text="rappel" center />
                  <Step title="Fin de l'essai" text="1er paiement" right />
                </View>
              ) : null}

              <PrimaryButton
                label={busy ? 'Un instant…' : trial ? 'Commencer mon essai gratuit' : 'Passer à Premium'}
                onPress={buy}
                disabled={busy}
              />
              <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12 }}>
                {annual ? `${annualPkg?.product.priceString} par an.` : `${monthlyPkg?.product.priceString} par mois.`} Annulable à tout moment.
                {'\n'}Mode test RevenueCat : aucun paiement réel.
              </Text>
            </>
          )}
        </>
      )}

      <Pressable accessibilityRole="button" onPress={restore} disabled={busy} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.soft, fontSize: 13, textDecorationLine: 'underline' }}>Restaurer mes achats</Text>
      </Pressable>

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
