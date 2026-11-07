import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { say } from '../rival';
import { PrimaryButton, SecondaryButton, styles, Title } from '../components';
import { SAMPLE_MEALS } from '../data';


export default function PhotoScreen({ go, protein, onAdd }) {
  const profile = useProfile();
  const { rivalName: RIVAL_NAME, tone } = profile;
  const PROTEIN_GOAL = profile.goals.protein;
  const STEPS_GOAL = profile.goals.steps;
  const [uri, setUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meal, setMeal] = useState(null);

  const analyse = (photoUri) => {
    setUri(photoUri);
    setMeal(null);
    setLoading(true);
    // Démo : l'analyse IA n'est pas encore branchée, on simule un résultat.
    setTimeout(() => {
      setMeal(SAMPLE_MEALS[Math.floor(Math.random() * SAMPLE_MEALS.length)]);
      setLoading(false);
    }, 1400);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Appareil photo', "Autorise l'appareil photo pour analyser tes repas, ou choisis une photo dans ta galerie.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets?.length) analyse(res.assets[0].uri);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets?.length) analyse(res.assets[0].uri);
  };

  const after = meal ? protein + meal.protein : protein;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <SecondaryButton label="← Retour" onPress={() => go('duel')} style={{ alignSelf: 'flex-start', height: 44 }} />
      <Title kicker="Preuve par photo">{meal ? `${meal.title} analysé` : 'Ton repas'}</Title>

      <View style={{ height: 260, borderRadius: 24, backgroundColor: colors.card, borderWidth: uri ? 0 : 1.5, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel="Photo du repas" /> : <Text style={{ color: colors.muted }}>Aucune photo pour l'instant</Text>}
        {loading ? (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(14,15,18,0.6)', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.me} />
            <Text style={{ color: colors.text, fontWeight: '600' }}>Analyse en cours…</Text>
          </View>
        ) : null}
      </View>

      {meal ? (
        <>
          <View style={[styles.card, { gap: 12, paddingVertical: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Stat value={`${meal.protein} g`} label="protéines" color={colors.me} />
              <Stat value={`${meal.kcal}`} label="kcal" />
              <Stat value={`${meal.carbs} g`} label="glucides" />
            </View>
            <View style={{ height: 1, backgroundColor: colors.line }} />
            {meal.items.map(([name, detail]) => (
              <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text }}>{name}</Text>
                <Text style={{ color: colors.muted }}>{detail}</Text>
              </View>
            ))}
            <Text style={{ color: colors.muted, fontSize: 12 }}>Démo : valeurs d'exemple, l'analyse IA réelle viendra ensuite.</Text>
          </View>
          <View style={{ backgroundColor: colors.winBg, borderRadius: 18, padding: 14 }}>
            <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
              Avec ce repas tu passes à <Text style={{ fontWeight: '800' }}>{after} g</Text> de protéines
              {after >= PROTEIN_GOAL ? ` : épreuve gagnée contre ${RIVAL_NAME}.` : ` (objectif ${PROTEIN_GOAL} g).`}
            </Text>
          </View>
          <PrimaryButton
            label="Ajouter au duel"
            onPress={() => {
              onAdd(meal);
              go('duel');
            }}
          />
        </>
      ) : (
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Prendre une photo" onPress={takePhoto} disabled={loading} />
          <SecondaryButton label="Choisir dans la galerie" onPress={pickPhoto} />
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, color = colors.text }) {
  return (
    <View>
      <Text style={{ fontSize: 26, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
    </View>
  );
}
