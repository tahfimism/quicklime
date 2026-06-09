import React from 'react';
import { Stack } from 'expo-router';

/**
 * Onboarding Layout Stack.
 * Hosts screens for joining and creating workspaces.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
