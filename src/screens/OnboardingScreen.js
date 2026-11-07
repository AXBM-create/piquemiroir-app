import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { PrimaryButton, SecondaryButton, styles as ui } from '../components';
import { GOALS, LB_PER_KG, LEVELS, RIVAL_NAMES, TONES, computeGoals } from '../profile';
import { say } from '../rival';

const WELCOME = require('../../assets/welcome.png');

const STEPS = ['name', 'goal', 'weight', 'level', 'rival', 'creating', 'ready'];

export default function OnboardingScreen({ initial, onDone, onCancel }) {
  const [step, setStep] = useState(0);
  const [welcome, setWelcome] = useState(!initial); // écran d'accueil : seulement à la première ouverture
  const [name, setName] = useState(initial?.name ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? null);
  const [unit, setUnit] = useState(initial?.unit ?? 'kg');
  const [weightText, setWeightText] = useState(
    initial ? String(Math.round(initial.unit === 'lb' ? initial.weightKg * LB_PER_KG : initial.weightKg)) : '',
  );
  const [level, setLevel] = useState(initial?.level ?? null);
  const [rivalName, setRivalName] = useState(initial?.rivalName ?? 'Nova');
  const [tone, setTone] = useState(initial?.tone ?? 'teasing');

  const current = STEPS[step];
  const weightNum = parseFloat(weightText.replace(',', '.'));
  const weightKg = unit === 'lb' ? weightNum / LB_PER_KG : weightNum;
  const weightOk = Number.isFinite(weightKg) && weightKg >= 30 && weightKg <= 250;

  const profile = {
    name: name.trim(),
    goal,
    weightKg: weightOk ? Math.round(weightKg * 10) / 10 : 70,
    unit,
    level,
    rivalName,
    tone,
  };
  const goals = computeGoals(profile);

  // Petite pause « création du rival » pour l'effet.
  useEffect(() => {
    if (current !== 'creating') return undefined;
    const t = setTimeout(() => setStep((s) => s + 1), 1800);
    return () => clearTimeout(t);
  }, [current]);

  const next = () => setStep((s) => s + 1);
  const back = () => (step === 0 ? onCancel?.() : setStep((s) => s - 1));
  const questionCount = 5;

  if (welcome) return <Welcome onStart={() => setWelcome(false)} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        {step < questionCount ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {Array.from({ length: questionCount }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: i <= step ? colors.me : colors.line }} />
              ))}
            </View>
            {step > 0 || onCancel ? (
              <Pressable accessibilityRole="button" onPress={back} style={{ alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>← {step === 0 ? 'Annuler' : 'Retour'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {current === 'name' ? (
          <Question title="Comment tu t'appelles ?" hint="Ton rival t'appellera comme ça.">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ton prénom"
              placeholderTextColor={colors.muted}
              autoFocus
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => name.trim() && next()}
              style={inputStyle}
              accessibilityLabel="Prénom"
            />
            <PrimaryButton label="Continuer" onPress={next} disabled={!name.trim()} />
          </Question>
        ) : null}

        {current === 'goal' ? (
          <Question title={`${name.trim()}, quel est ton objectif ?`}>
            {GOALS.map((g) => (
              <Choice key={g.key} label={g.label} hint={g.hint} selected={goal === g.key} onPress={() => setGoal(g.key)} />
            ))}
            <PrimaryButton label="Continuer" onPress={next} disabled={!goal} />
          </Question>
        ) : null}

        {current === 'weight' ? (
          <Question title="Quel est ton poids actuel ?" hint="Il sert à calculer ton objectif de protéines. Il reste sur ton téléphone.">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={weightText}
                onChangeText={setWeightText}
                placeholder={unit === 'kg' ? '70' : '155'}
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                autoFocus
                style={[inputStyle, { flex: 1 }]}
                accessibilityLabel={`Poids en ${unit}`}
              />
              {['kg', 'lb'].map((u) => (
                <Pressable
                  key={u}
                  accessibilityRole="button"
                  accessibilityState={{ selected: unit === u }}
                  onPress={() => setUnit(u)}
                  style={{ width: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: unit === u ? colors.text : colors.card }}
                >
                  <Text style={{ fontWeight: '800', color: unit === u ? colors.bg : colors.soft }}>{u}</Text>
                </Pressable>
              ))}
            </View>
            {weightText && !weightOk ? <Text style={{ color: colors.rival, fontSize: 13 }}>Entre un poids entre 30 et 250 kg (66 et 550 lb).</Text> : null}
            <PrimaryButton label="Continuer" onPress={next} disabled={!weightOk} />
          </Question>
        ) : null}

        {current === 'level' ? (
          <Question title="Quel est ton niveau ?" hint="Ton rival démarrera à ton niveau, puis montera avec toi.">
            {LEVELS.map((l) => (
              <Choice key={l.key} label={l.label} hint={l.hint} selected={level === l.key} onPress={() => setLevel(l.key)} />
            ))}
            <PrimaryButton label="Continuer" onPress={next} disabled={!level} />
          </Question>
        ) : null}

        {current === 'rival' ? (
          <Question title="Choisis ton rival" hint="Son nom et son caractère.">
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {RIVAL_NAMES.map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityState={{ selected: rivalName === n }}
                  onPress={() => setRivalName(n)}
                  style={{ paddingHorizontal: 18, minHeight: 44, borderRadius: 999, justifyContent: 'center', backgroundColor: rivalName === n ? colors.rival : colors.card }}
                >
                  <Text style={{ fontWeight: '800', color: rivalName === n ? colors.bg : colors.soft }}>{n}</Text>
                </Pressable>
              ))}
            </View>
            {TONES.map((t) => (
              <Choice key={t.key} label={t.label} hint={t.hint} selected={tone === t.key} onPress={() => setTone(t.key)} accent={colors.rival} />
            ))}
            <PrimaryButton label={`Créer ${rivalName}`} onPress={next} />
          </Question>
        ) : null}

        {current === 'creating' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <ActivityIndicator size="large" color={colors.rival} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              Création de {rivalName}…
            </Text>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>On cale ton rival sur ton objectif et ton niveau.</Text>
          </View>
        ) : null}

        {current === 'ready' ? (
          <View style={{ flex: 1, gap: 18, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.rival, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 44, fontWeight: '800', color: colors.bg }}>{rivalName[0]}</Text>
              </View>
              <Text style={[ui.title, { textAlign: 'center' }]}>{rivalName} est prêt</Text>
              <Text style={{ color: colors.soft, fontSize: 15, lineHeight: 21, textAlign: 'center' }}>
                « {say(tone, 'intro', { name: profile.name })} »
              </Text>
            </View>
            <View style={[ui.card, { gap: 12 }]}>
              <Text style={ui.label}>Vos épreuves chaque jour</Text>
              <Line label="Protéines" value={`${goals.protein} g`} />
              <Line label="Pas" value={goals.steps.toLocaleString('fr-FR')} />
              <Line label="Séance" value="5 exercices en duel" />
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
                Gagne 2 épreuves sur 3 pour gagner la journée. Ces repères sont indicatifs et ne remplacent pas l'avis d'un professionnel de santé.
              </Text>
            </View>
            <PrimaryButton label="Commencer le duel" onPress={() => onDone({ ...profile, goals })} />
            <SecondaryButton label="Modifier mes réponses" onPress={() => setStep(0)} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  height: 56,
  borderRadius: 16,
  backgroundColor: colors.card,
  color: colors.text,
  fontSize: 18,
  paddingHorizontal: 16,
};

function Welcome({ onStart }) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 22, justifyContent: 'center' }}>
      <Image
        source={WELCOME}
        style={{ width: '100%', aspectRatio: 1080 / 1000, borderRadius: 28 }}
        accessibilityLabel="Toi contre ton rival IA"
      />
      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.me, fontSize: 13, fontWeight: '800', letterSpacing: 2 }}>KONTRA</Text>
        <Text style={[ui.title, { fontSize: 32, lineHeight: 38 }]}>Ton rival IA t'attend.</Text>
        <Text style={{ color: colors.soft, fontSize: 16, lineHeight: 23 }}>
          Chaque jour, un duel : séance, protéines, pas. Bats-le, ou il te le rappellera.
        </Text>
      </View>
      <PrimaryButton label="Créer mon rival" onPress={onStart} />
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>1 minute · sans compte</Text>
    </ScrollView>
  );
}

function Question({ title, hint, children }) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={[ui.title, { fontSize: 26 }]}>{title}</Text>
      {hint ? <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{hint}</Text> : null}
      {children}
    </View>
  );
}

function Choice({ label, hint, selected, onPress, accent = colors.me }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{ minHeight: 64, borderRadius: 18, padding: 14, gap: 2, justifyContent: 'center', backgroundColor: colors.card, borderWidth: 2, borderColor: selected ? accent : colors.card }}
    >
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{label}</Text>
      {hint ? <Text style={{ color: colors.muted, fontSize: 13 }}>{hint}</Text> : null}
    </Pressable>
  );
}

function Line({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.soft, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{value}</Text>
    </View>
  );
}
