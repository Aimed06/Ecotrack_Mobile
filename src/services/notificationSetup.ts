import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { savePushToken } from './api';

export const registerForPushNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

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
