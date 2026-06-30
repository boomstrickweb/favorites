import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
export { ErrorBoundary } from 'expo-router';
import { useColorScheme, View, Text, TouchableOpacity, Platform, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { registerForPushNotificationsAsync, updateProfilePushToken, ensurePushTokenUpdated } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[PUSH] Auth state changed:', event, 'User ID:', session?.user?.id);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Check if user has 2FA enabled but hasn't verified yet
        const { data: profile } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('id', session.user.id)
          .single();
        
        // If 2FA is enabled, we might be in the middle of a sign-in flow
        // The signin.tsx component handles the redirection/blocking.
        // But if the user reloads the app and we have a session, 
        // and we aren't on the signin page, we should ideally challenge them.
        // For now, we rely on the signin.tsx flow.
        
        try {
          await ensurePushTokenUpdated(session.user.id);
        } catch (e) {
          console.error('Failed to register for push notifications:', e);
        }
      }
      if (event === 'SIGNED_OUT') {
        // Handle sign out if needed
      } else if (event === 'TOKEN_REFRESHED') {
        // console.log('Token refreshed', session);
      }
    });

    // Handle notifications when the app is in foreground or background
    let notificationListener: Notifications.Subscription | undefined;
    let responseListener: Notifications.Subscription | undefined;

    // Refresh token when app comes to foreground
    const appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      console.log('[PUSH] App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[PUSH] App foregrounded, session user:', session?.user?.id);
        if (session?.user) {
          ensurePushTokenUpdated(session.user.id).catch(err => console.error('[PUSH] foreground refresh error:', err));
        }
      }
    });

    if (!isExpoGo || Platform.OS !== 'android') {
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        // console.log('Notification received:', notification);
      });

      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.type === 'chat' && data?.chatId) {
          router.push({
            pathname: '/chatscreen',
            params: { chatId: data.chatId }
          });
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      appStateListener.remove();
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, []);
  
  const theme = colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="signin" />
          <Stack.Screen name="confirm" />
          <Stack.Screen name="blockedaccounts" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
