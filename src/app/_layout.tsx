import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot, useRouter, useSegments, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import {
  GeistMono_400Regular,
} from '@expo-google-fonts/geist-mono';
import { useAuth } from '@/hooks/useAuth';

// Keep the splash screen visible while we fetch assets
SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const inAppGroup = segments[0] === '(app)';

    if (!user) {
      // If not authenticated, redirect to welcome
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else {
      // Authenticated but user profile from Firestore is still initializing
      if (!profile) return;

      if (!profile.workspaceId) {
        // Authenticated but no workspace joined yet
        if (!inOnboardingGroup) {
          router.replace('/onboarding');
        }
      } else {
        // Authenticated and workspace joined -> main app
        if (!inAppGroup) {
          router.replace('/(app)/today');
        }
      }
    }
  }, [user, profile, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    GeistMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate />
    </ThemeProvider>
  );
}
