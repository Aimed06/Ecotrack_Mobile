# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm start          # démarre Expo (choisir plateforme ensuite)
npm run android    # ouvre l'app sur émulateur/appareil Android
npm run ios        # nécessite macOS
npm run web        # version web de l'app mobile (utile pour debug)

# Installer un package natif : toujours passer par expo install
npx expo install <package>   # choisit automatiquement la version compatible SDK 54
```

Pas de script de lint ou de test configuré. TypeScript strict est activé — les erreurs remontent via les diagnostics IDE.

## Stack

- **Expo SDK ~54.0.33** · React Native 0.81.5 · React 19.1.0 · TypeScript strict
- **New Architecture activée** (`newArchEnabled: true` dans `app.json`)
- React Navigation (Bottom Tabs + Native Stack) · Axios · expo-secure-store · expo-camera · expo-location · expo-image-picker · react-native-maps · @expo/vector-icons (Ionicons)

## Architecture

### Entrée

`index.ts` → `App.tsx` → `AuthProvider` wraps `AppNavigator`.

### Arbre de navigation

```
AppNavigator (NativeStack)
├── Auth → AuthNavigator (NativeStack)
│   ├── PhoneInput
│   └── OTPVerification
└── Main → MainStackNavigator (NativeStack)   ← enveloppe tabs + écrans modaux
    ├── MainTabs → MainNavigator (BottomTab)
    │   ├── Accueil     → HomeScreen
    │   ├── Carte       → MapScreen
    │   ├── Evenements  → EvenementsNavigator (NativeStack)
    │   │   ├── EvenementsList
    │   │   ├── EvenementDetail
    │   │   └── QRScanner
    │   ├── Classement  → ClassementScreen
    │   └── Profil      → ProfilScreen
    ├── Signalement → SignalementScreen   ← accès depuis HomeScreen (quick action)
    └── QRScanner   → QRScannerScreen    ← accès depuis HomeScreen (titre optionnel)
```

`QRScannerScreen` est présent dans deux stacks : dans `EvenementsNavigator` (params obligatoires) et dans `MainStackNavigator` (params optionnels). Il gère les deux cas via `route.params ?? {}`.

### Auth context (`src/contexts/AuthContext.tsx`)

Source unique de vérité pour l'utilisateur connecté. Persiste `token` + `user` dans `expo-secure-store`. Hook `useAuth()` expose :

```ts
user: Utilisateur | null
token: string | null
isLoading: boolean
signIn(token, user)   // stocke + bascule vers MainNavigator
signOut()             // vide le stockage + bascule vers AuthNavigator
refreshUser()         // GET /utilisateurs/profil → met à jour points_total, niveau, etc.
```

Appeler `refreshUser()` dans `useFocusEffect` sur les écrans qui affichent `points_total` ou `niveau` (HomeScreen, ProfilScreen) pour avoir des données fraîches.

### API (`src/services/api.ts`)

Instance Axios unique. `BASE_URL = http://10.253.167.234:5000/api` — changer l'IP si le backend tourne sur une autre machine (`localhost` ne fonctionne pas depuis un appareil physique ou un émulateur Android). L'IP change selon le réseau Wi-Fi ; vérifier avec `ipconfig` si le mobile répond "impossible de joindre le serveur".

Un intercepteur injecte automatiquement `Authorization: Bearer <token>` sur chaque requête.

Format de réponse backend :
- Succès : `{ success: true, data: [...] }` — `data` est toujours un tableau direct, jamais imbriqué sous un sous-champ (`data.signalements`, `data.evenements`, etc. n'existent pas).
- Erreur : `{ success: false, error: '...' }` — le champ s'appelle `error`, pas `message`. Dans les `catch`, toujours vérifier `err.response?.data?.error || err.response?.data?.message`.

Fonctions disponibles : `requestOTP`, `registerCitoyen`, `loginCitoyen` · `getSignalements`, `getSignalement`, `creerSignalement` · `getEvenements`, `getEvenement`, `inscrireEvenement`, `scannerQR` · `getPointsCollecte` · `getProfil`, `getClassement`.

### Carte (`MapScreen`)

Utilise `react-native-maps` (MapView). Markers colorés par degré de pollution (1=vert → 5=rouge) pour les signalements, bleu pour les points de collecte actifs. Callout au tap sur chaque marker.

**Important — coordonnées DECIMAL :** MySQL retourne les colonnes `DECIMAL` sous forme de strings en Node.js. Il faut donc appeler `parseFloat(s.latitude as any)` avant de passer les coordonnées au composant `<Marker>`, sinon react-native-maps crash avec "Error while updating property coordinate of view managed by AriMapMarker".

Pour un **build de production (EAS Build)**, remplacer `REMPLACER_PAR_VOTRE_CLE_GOOGLE_MAPS` dans `app.json` par une vraie clé Google Maps API. Expo Go fonctionne sans clé.

### Formulaire signalement (`SignalementScreen`)

Soumis en `multipart/form-data`. Photos via `expo-image-picker` (max 5, JPEG 0.8). Coordonnées GPS auto-fetchées via `expo-location` au montage.

## Conventions

- **Nommage français** pour tout le domaine métier (aligné backend) : `signalement`, `evenement`, `utilisateur`, `wilaya`, etc.
- **Jamais de couleur en dur** — toujours `Colors.*` depuis `src/constants/colors.ts`. Couleur principale : `#1D9E75` (green).
- `StyleSheet.create` en bas de chaque fichier écran, pas de styles inline.
- Erreurs utilisateur via `Alert.alert`.
- Types API dans `src/types/index.ts` (modèles + param lists de navigation).

## Points à terminer

Aucun — l'application est complète.
