import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { addDays, dayKey, fromKey } from './dates';

// Lecture des pas du téléphone.
// - iPhone : on demande au système le total de la journée (et des 6 jours précédents),
//   donc les pas comptent même quand l'app est fermée.
// - Android : le système ne donne que les pas pendant que l'app est ouverte ;
//   on les ajoute au total déjà enregistré pour la journée.
//
// status : 'checking' | 'ok' | 'denied' | 'unavailable'
export function useStepCounter({ todayKey, startedOn, getSavedSteps, onSteps }) {
  const [status, setStatus] = useState('checking');
  const cb = useRef({ getSavedSteps, onSteps });
  cb.current = { getSavedSteps, onSteps };

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let watch = null;
    let appSub = null;

    const readIos = async () => {
      // Jusqu'à 7 jours d'historique côté iPhone : on remplit aussi les jours passés.
      for (let i = 6; i >= 0; i--) {
        const key = addDays(todayKey, -i);
        if (key < startedOn) continue;
        const start = fromKey(key);
        const end = i === 0 ? new Date() : fromKey(addDays(key, 1));
        try {
          const r = await Pedometer.getStepCountAsync(start, end);
          if (!cancelled && r) cb.current.onSteps(key, r.steps);
        } catch {
          // jour sans données : on ignore
        }
      }
    };

    (async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) {
          if (!cancelled) setStatus('unavailable');
          return;
        }
        const perm = await Pedometer.requestPermissionsAsync();
        if (!perm.granted) {
          if (!cancelled) setStatus('denied');
          return;
        }
        if (cancelled) return;
        setStatus('ok');

        if (Platform.OS === 'ios') {
          await readIos();
          timer = setInterval(readIos, 30 * 1000);
          appSub = AppState.addEventListener('change', (s) => s === 'active' && readIos());
        } else {
          const base = cb.current.getSavedSteps(todayKey);
          watch = Pedometer.watchStepCount((r) => {
            if (dayKey() === todayKey) cb.current.onSteps(todayKey, base + r.steps);
          });
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (watch) watch.remove();
      if (appSub) appSub.remove();
    };
  }, [todayKey, startedOn]);

  return status;
}
