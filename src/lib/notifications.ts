import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Platform-safe registration for push notifications.
 * Web environment is bypassed gracefully, while mobile environments request
 * permissions and register the Expo Push Token with Firebase Cloud Functions.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Push notifications are bypassed on Web for the MVP.');
    return null;
  }

  try {
    // Request notification permission from OS (required on iOS)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions denied by user.');
      return null;
    }

    // Get the Expo Push Token (which wraps native FCM/APNS tokens)
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (!token) {
      console.warn('Could not retrieve Expo Push Token.');
      return null;
    }

    // Send token to Firebase Cloud Function
    const updateToken = httpsCallable<{ fcmToken: string }, void>(functions, 'updateFcmToken');
    await updateToken({ fcmToken: token });

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}
