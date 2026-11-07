import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

// Clé publique du magasin de test RevenueCat (projet PiqueMiroir).
// Les clés publiques (test_, appl_, goog_) peuvent être dans l'app ; la clé secrète, jamais.
// Avant la mise en ligne : remplacer par les clés appl_ / goog_ dans une version compilée.
const REVENUECAT_TEST_KEY = 'test_rjYJXpImvnuPuUNTvlWhzuzBNpg';
export const ENTITLEMENT = 'piquemiroir_pro';

// Limite de la version gratuite.
export const FREE_PHOTOS_PER_DAY = 2;

let configured = false;
function configureOnce() {
  if (configured) return;
  Purchases.configure({ apiKey: REVENUECAT_TEST_KEY });
  configured = true;
}

const isActive = (info) => !!info?.entitlements?.active?.[ENTITLEMENT];

export const PremiumContext = createContext({
  ready: false,
  isPro: false,
  offering: null,
  error: null,
  purchase: async () => false,
  restore: async () => false,
});

export function usePremium() {
  return useContext(PremiumContext);
}

export function usePremiumState() {
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    const onUpdate = (info) => alive && setIsPro(isActive(info));
    (async () => {
      try {
        configureOnce();
        Purchases.addCustomerInfoUpdateListener(onUpdate);
        const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
        if (!alive) return;
        setIsPro(isActive(info));
        setOffering(offerings.current);
      } catch (e) {
        if (alive) setError(e?.message || 'Abonnements indisponibles');
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
      try {
        Purchases.removeCustomerInfoUpdateListener(onUpdate);
      } catch {
        // rien
      }
    };
  }, []);

  // Renvoie true si l'achat a abouti, false si annulé ; lève une erreur sinon.
  const purchase = useCallback(async (pkg) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const ok = isActive(customerInfo);
      setIsPro(ok);
      return ok;
    } catch (e) {
      if (e?.userCancelled) return false;
      throw e;
    }
  }, []);

  const restore = useCallback(async () => {
    const info = await Purchases.restorePurchases();
    const ok = isActive(info);
    setIsPro(ok);
    return ok;
  }, []);

  return { ready, isPro, offering, error, purchase, restore };
}
