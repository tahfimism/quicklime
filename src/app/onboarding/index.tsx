import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

/**
 * Onboarding Landing Screen.
 * Presents options to Create a Workspace or Join with an Invite Code.
 */
export default function OnboardingIndex() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <View style={styles.content}>
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Typography variant="headlineLg">
            Get started
          </Typography>
          <Typography variant="bodyMd" color={activeColors.secondary} style={styles.subtitle}>
            Create a new workspace or join one with an invite code.
          </Typography>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonBlock}>
          <Button
            variant="primary"
            onPress={() => router.push('/onboarding/create')}
            style={styles.btn}
          >
            Create a workspace
          </Button>

          <Button
            variant="secondary"
            onPress={() => router.push('/onboarding/join')}
            style={styles.btn}
          >
            Join with invite code
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.marginH,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
    height: 320,
  },
  headerBlock: {
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  buttonBlock: {
    width: '100%',
    gap: Spacing.md,
  },
  btn: {
    width: '100%',
  },
});

