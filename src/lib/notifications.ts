import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Check if we are running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure how notifications are handled when the app is open
try {
  if (!isExpoGo || Platform.OS !== 'android') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

export async function registerForPushNotificationsAsync() {
  console.log('[PUSH] registerForPushNotificationsAsync called');
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('[PUSH] Push notifications are not supported in Expo Go on Android. Use a development build.');
    return null;
  }

  let token;

  if (Platform.OS === 'web') {
    console.log('[PUSH] Web platform detected, skipping token registration');
    return null;
  }

  console.log('[PUSH] Device.isDevice:', Device.isDevice);
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[PUSH] Existing status:', existingStatus);
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      console.log('[PUSH] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[PUSH] New status:', finalStatus);
    }
    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permission not granted, returning null');
      return null;
    }
    
    // Add a small delay to ensure native systems have processed the permission change
    if (existingStatus !== 'granted' && finalStatus === 'granted') {
      console.log('[PUSH] Permission just granted, waiting a bit before fetching token...');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    try {
        console.log('[PUSH] Fetching token for platform:', Platform.OS);
        // Use getExpoPushTokenAsync for all platforms to get a consistent token
        // that works with our send-notification edge function which handles both Expo and FCM.
        console.log('[PUSH] Calling getExpoPushTokenAsync...');
        const expoToken = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        console.log('[PUSH] Raw expo token response:', JSON.stringify(expoToken));
        token = expoToken.data;
        
        console.log('[PUSH] Token retrieved:', token);
    } catch (e) {
        console.error('[PUSH] Error getting push token from provider:', e);
        
        // Fallback for Android if getExpoPushTokenAsync fails
        if (Platform.OS === 'android') {
            try {
                console.log('[PUSH] Falling back to getDevicePushTokenAsync for Android...');
                const deviceToken = await Notifications.getDevicePushTokenAsync();
                token = deviceToken.data;
                console.log('[PUSH] Fallback token retrieved:', token);
            } catch (fallbackError) {
                console.error('[PUSH] Fallback failed too:', fallbackError);
            }
        }
    }
  } else {
    console.log('[PUSH] Not a physical device, skipping token registration');
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('[PUSH] Notification channel set for Android');
    } catch (e) {
      console.error('[PUSH] Error setting notification channel:', e);
    }
  }

  return token;
}

export async function updateProfilePushToken(userId: string, token: string) {
  console.log('[PUSH] Updating profile push token for user:', userId, 'Token:', token);
  const { error } = await supabase
    .from('profiles')
    .update({ fcm_token: token })
    .eq('id', userId);

  if (error) {
    console.error('[PUSH] Error updating push token in profile:', error);
  } else {
    console.log('[PUSH] Push token updated successfully in profile');
  }
}

export async function ensurePushTokenUpdated(userId: string) {
  console.log('[PUSH] ensurePushTokenUpdated called for user:', userId);
  try {
    // 1. Check if we already have a token in the database
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[PUSH] Error fetching profile:', fetchError);
      return;
    }

    console.log('[PUSH] Current token in profile:', profile?.fcm_token);

    // 2. If token is missing, or even if it exists (to ensure it's fresh), 
    // try to register and update
    const token = await registerForPushNotificationsAsync();
    console.log('[PUSH] Resulting token from registration:', token);
    
    if (token && token !== profile?.fcm_token) {
      console.log('[PUSH] Token mismatch or missing, updating database...');
      await updateProfilePushToken(userId, token);
    } else if (token) {
      console.log('[PUSH] Token is already up to date in database');
    } else {
      console.log('[PUSH] No token obtained to update');
    }
  } catch (err) {
    console.error('[PUSH] Failed to ensure push token is updated:', err);
  }
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
  try {
    const { data: response, error } = await supabase.functions.invoke('send-notification', {
      body: { userId, title, body, data }
    });
    
    if (error) throw error;

    // Check if the edge function reported success but no token was found
    if (response && response.success === false && response.message === 'No FCM token found') {
        console.warn(`Notification not sent: No FCM token found for user ${userId}`);
        // We could potentially trigger a retry or flag the user's profile here
    }
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}
