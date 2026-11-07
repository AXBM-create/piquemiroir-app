import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { useProfile } from '../profile';
import { PrimaryButton, SecondaryButton, styles, Title } from '../components';
import { API_URL } from '../config';

const CONFIDENCE = { faible: 'Estimation approximative', moyenne: 'Estimation correcte', elevee: 'Estimation fiable' };

async function analyseMeal(base64, mimeType) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const r = await fetch(`${API_URL}/api/analyze-meal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType: mimeType || 'image/jpeg' }),
      signal: controller.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Erreur ${r.status}`);
    return data.meal;
  } finally {
    clearTimeout(timer);
  }
}

export default function PhotoScreen({ go, protein, onAdd }) {
  const profile = useProfile();
  const RIVAL_NAME = profile.rivalName;
  const PROTEIN_GOAL = profile.goals.protein;

  const [uri, setUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meal, setMeal] = useState(null);
  const [error, setError] = useState(null);
  const [adjust, setAdjust] = useState(0); // correction manuelle des protéines
  const [lastAsset, setLastAsset] = useState(null);

  const analyse = async (asset) => {
    setUri(asset.uri);
    setLastAsset(asset);
    setMeal(null);
    setError(null);
    setAdjust(0);
    if (!asset.base64) {
      setError("Impossible de lire la photo. Réessaie.");
      return;
    }
    setLoading(true);
    try {
      const m = await analyseMeal(asset.base64, asset.mimeType);
      if (!m.isMeal) setError("Je ne vois pas de repas sur cette photo. Essaie avec ton assiette bien cadrée.");
      else setMeal(m);
    } catch (e) {
      setError(e.name === 'AbortError' ? "L'analyse a pris trop de temps. Vérifie ta connexion et réessaie." : `L'analyse n'a pas marché : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pickerOptions = { mediaTypes: ['images'], quality: 0.4, base64: true };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Appareil photo', "Autorise l'appareil photo pour analyser tes repas, ou choisis une photo dans ta galerie.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync(pickerOptions);
    if (!res.canceled && res.assets?.length) analyse(res.assets[0]);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!res.canceled && res.assets?.length) analyse(res.assets[0]);
  };

  const mealProtein = meal ? Math.max(0, meal.protein + adjust) : 0;
  const after = protein + mealProtein;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <SecondaryButton label="← Retour" onPress={() => go('duel')} style={{ alignSelf: 'flex-start', height: 44 }} />
      <Title kicker="Preuve par photo">{meal ? meal.title : 'Ton repas'}</Title>

      <View style={{ height: 260, borderRadius: 24, backgroundColor: colors.card, borderWidth: uri ? 0 : 1.5, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel="Photo du repas" /> : <Text style={{ color: colors.muted }}>Prends ton assiette en photo, vue de dessus</Text>}
        {loading ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14,15,18,0.6)', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.me} />
            <Text style={{ color: colors.text, fontWeight: '600' }}>L'IA analyse ton repas…</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ color: colors.rival, fontSize: 14, lineHeight: 20 }}>{error}</Text>
          {lastAsset ? <SecondaryButton label="Réessayer l'analyse" onPress={() => analyse(lastAsset)} style={{ height: 44 }} /> : null}
        </View>
      ) : null}

      {meal ? (
        <>
          <View style={[styles.card, { gap: 12, paddingVertical: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Stat value={`${mealProtein} g`} label="protéines" color={colors.me} />
              <Stat value={`${meal.kcal}`} label="kcal" />
              <Stat value={`${meal.carbs} g`} label="glucides" />
              <Stat value={`${meal.fat} g`} label="lipides" />
            </View>
            <View style={{ height: 1, backgroundColor: colors.line }} />
            {meal.items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ color: colors.text, flex: 1 }}>{it.name}</Text>
                <Text style={{ color: colors.muted }}>
                  {it.grams} g · {it.protein} g prot.
                </Text>
              </View>
            ))}
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
              {CONFIDENCE[meal.confidence]}
              {meal.note ? ` · ${meal.note}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: colors.soft, fontSize: 13, flex: 1 }}>Corriger les protéines</Text>
              <Step label="−5" onPress={() => setAdjust((a) => Math.max(-meal.protein, a - 5))} />
              <Step label="+5" onPress={() => setAdjust((a) => a + 5)} />
            </View>
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
              onAdd({ title: meal.title, protein: mealProtein, kcal: meal.kcal });
              go('duel');
            }}
          />
          <SecondaryButton label="Reprendre une photo" onPress={takePhoto} />
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
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
    </View>
  );
}

function Step({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} grammes`} onPress={onPress} style={{ width: 52, height: 40, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
