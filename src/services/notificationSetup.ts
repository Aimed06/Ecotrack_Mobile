import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { savePushToken } from './api';

// expo-notifications ne fonctionne pas dans Expo Go depuis SDK 53
const isExpoGo = Constants.appOwnership === 'expo';

export const registerForPushNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web' || isExpoGo) return;

  try {
    const Notifications = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const push_token = tokenData.data;
    if (push_token) {
      await savePushToken(push_token);
    }
  } catch {
    // Notifications non disponibles
  }
};

// =============================================================================
// NOTIFICATIONS LOCALES PLANIFIÉES — Fonctionne dans un build EAS (pas Expo Go)
// Pour activer : décommenter les fonctions ci-dessous et builder avec :
//   npx eas build --profile development --platform android
// =============================================================================

// /**
//  * Planifie un rappel local 24h avant un événement.
//  * À appeler juste après inscrireEvenement() dans EvenementDetailScreen.
//  *
//  * Exemple d'utilisation :
//  *   import { scheduleEventReminder } from '../../services/notificationSetup';
//  *   await scheduleEventReminder({ id: evenement.id, titre: evenement.titre, date_debut: evenement.date_debut });
//  */
// export const scheduleEventReminder = async (evenement: {
//   id: number;
//   titre: string;
//   date_debut: string;
// }): Promise<void> => {
//   try {
//     const Notifications = await import('expo-notifications');
//
//     const triggerDate = new Date(evenement.date_debut);
//     triggerDate.setHours(triggerDate.getHours() - 24); // 24h avant le début
//
//     // Ne pas planifier si l'événement est dans moins de 24h
//     if (triggerDate <= new Date()) return;
//
//     await Notifications.scheduleNotificationAsync({
//       identifier: `evenement_${evenement.id}`, // identifiant unique → permet d'annuler
//       content: {
//         title: '🌿 Rappel événement demain',
//         body: `"${evenement.titre}" a lieu demain. Préparez-vous !`,
//         data: { type: 'evenement', id: evenement.id }, // utilisé dans App.tsx pour naviguer
//       },
//       trigger: { date: triggerDate, type: 'date' } as any,
//     });
//   } catch {}
// };

// /**
//  * Annule le rappel planifié pour un événement.
//  * Utile si l'utilisateur se désinscrit de l'événement.
//  *
//  * Exemple d'utilisation :
//  *   await cancelEventReminder(evenement.id);
//  */
// export const cancelEventReminder = async (evenementId: number): Promise<void> => {
//   try {
//     const Notifications = await import('expo-notifications');
//     await Notifications.cancelScheduledNotificationAsync(`evenement_${evenementId}`);
//   } catch {}
// };
