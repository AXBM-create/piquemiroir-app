# PiqueMiroir — prototype Expo

App de remise en forme où tu affrontes **Nova**, un rival IA, chaque jour : séance d'exercices en vidéo, protéines (photo des repas) et pas.

Prototype de test (Expo SDK 58), sans serveur : les données restent sur le téléphone le temps de la session.

## Tester dans Expo Go

1. Installe **Expo Go** sur ton téléphone (App Store ou Google Play).
2. Sur un ordinateur avec [Node.js](https://nodejs.org) (version 20 ou plus) :

   ```bash
   git clone https://github.com/<ton-compte>/piquemiroir-app.git
   cd piquemiroir-app
   npm install
   npx expo start
   ```

3. Scanne le QR code affiché :
   - **iPhone** : avec l'appareil photo, puis « Ouvrir dans Expo Go ».
   - **Android** : depuis l'app Expo Go, bouton « Scan QR code ».

Le téléphone et l'ordinateur doivent être sur le même Wi-Fi. Sinon, lance `npx expo start --tunnel`.

## Ce qui fonctionne

| Écran | Ce que tu peux tester |
| --- | --- |
| Duel du jour | Score de la semaine, 3 épreuves du jour (séance, protéines, pas), message de Nova |
| Photo du repas | Appareil photo ou galerie ; l'analyse nutritionnelle est **simulée** (valeurs d'exemple) |
| Programmes | Programme « Brûle-graisse maison » avec aperçu vidéo |
| Séance | 5 exercices vidéo ; bouton « +1 répétition » ou chrono « Je lâche » (gainage) ; Nova vise ton meilleur score + 7 % |
| Résultat | Gagné / perdu / égalité par exercice, effet sur la journée |
| Bilan | Carte de la semaine et partage |
| Profil | Paywall (paiement désactivé dans le prototype) |

## Règles de score

- **Exercice** : plus de répétitions (ou plus longtemps tenu) que Nova = gagné.
- **Séance** : celui qui gagne le plus d'exercices gagne l'épreuve « Séance ».
- **Journée** : 3 épreuves (séance, protéines ≥ 120 g, pas > 8 000) ; 2 sur 3 = journée gagnée.
- **Semaine** : nombre de journées gagnées par chacun.

## Pas encore branché

- Analyse IA réelle des photos de repas
- Comptage des répétitions par la caméra
- Lecture des pas (Santé / Google Fit) — un lien « Test : simuler +1 000 pas » le remplace
- Comptes, sauvegarde et paiement
