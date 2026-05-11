import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { I18nProvider } from './src/contexts/I18nContext';
import AppNavigator from './src/navigation/AppNavigator';

// expo-notifications ne fonctionne pas dans Expo Go depuis SDK 53
const isExpoGo = Constants.appOwnership === 'expo';

// =============================================================================
// NAVIGATION DEPUIS UNE NOTIFICATION — Fonctionne dans un build EAS (pas Expo Go)
// =============================================================================
// Pour naviguer vers le bon écran quand l'utilisateur tape sur une notification,
// il faut un navigationRef accessible en dehors des composants React.
//
// ÉTAPE 1 — Créer le ref dans AppNavigator.tsx :
//
//   import { createNavigationContainerRef } from '@react-navigation/native';
//   export const navigationRef = createNavigationContainerRef<RootStackParamList>();
//
//   // Puis passer le ref au NavigationContainer :
//   <NavigationContainer ref={navigationRef}>
//     ...
//   </NavigationContainer>
//
// ÉTAPE 2 — Utiliser le ref dans App.tsx (voir le listener commenté ci-dessous).
// =============================================================================

function AppWithTheme() {
  const { isDark } = useTheme();
  const listenerRef = useRef<{ remove: () => void } | undefined>(undefined);

  // Listener actif : affiche les notifications reçues en foreground (build EAS uniquement)
  useEffect(() => {
    if (isExpoGo) return;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        listenerRef.current = Notifications.addNotificationReceivedListener(_n => {});
      } catch {}
    })();

    return () => { listenerRef.current?.remove(); };
  }, []);

  // ===========================================================================
  // LISTENER DE TAP SUR NOTIFICATION — Décommenter dans un build EAS
  // Navigue vers l'écran correspondant quand l'utilisateur tape sur une notif.
  //
  // Les données envoyées par le backend dans la notification doivent contenir :
  //   - type: 'evenement'    → ouvre EvenementDetail (id requis)
  //   - type: 'signalement'  → ouvre la carte ou le détail du signalement
  //   - type: 'confirmation' → notification locale silencieuse, pas de navigation
  //
  // Exemple de payload backend (Expo Push API) :
  //   {
  //     to: "<expo-push-token>",
  //     title: "Votre signalement a été résolu",
  //     body: "Un admin a marqué votre signalement comme résolu.",
  //     data: { type: "signalement", id: 42, statut: "resolu" }
  //   }
  // ===========================================================================
  //
  // useEffect(() => {
  //   let responseListener: { remove: () => void } | undefined;
  //
  //   (async () => {
  //     try {
  //       const Notifications = await import('expo-notifications');
  //       const { navigationRef } = await import('./src/navigation/AppNavigator');
  //
  //       responseListener = Notifications.addNotificationResponseReceivedListener(response => {
  //         const data = response.notification.request.content.data as {
  //           type?: string;
  //           id?: number;
  //           statut?: string;
  //         };
  //
  //         if (!navigationRef.isReady()) return;
  //
  //         if (data.type === 'evenement' && data.id) {
  //           // Ouvre le détail de l'événement
  //           navigationRef.navigate('Main', {
  //             screen: 'MainTabs',
  //             params: {
  //               screen: 'Evenements',
  //               params: { screen: 'EvenementsList', params: { openId: data.id } },
  //             },
  //           } as any);
  //         }
  //
  //         if (data.type === 'signalement') {
  //           // Ouvre la carte pour voir le signalement
  //           navigationRef.navigate('Main', {
  //             screen: 'MainTabs',
  //             params: { screen: 'Carte' },
  //           } as any);
  //         }
  //       });
  //     } catch {}
  //   })();
  //
  //   return () => { responseListener?.remove(); };
  // }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppWithTheme />
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
