import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, Platform } from 'react-native';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Colors, Spacing } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { signInWithGoogle } from '@/lib/authHelper';
import { db } from '@/lib/firebase';

/**
 * Welcome / Login Screen.
 * Renders brand wordmark and Google Sign-in trigger.
 * Handles client-side user document fallback creation.
 */
export default function WelcomeScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        // Fallback: If onUserCreate function trigger is not deployed,
        // create the user document in Firestore directly from the client.
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (!docSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            displayName: user.displayName || 'Student',
            email: user.email || '',
            photoUrl: user.photoURL || null,
            workspaceId: null,
            role: 'student',
            fcmToken: null,
            createdAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <View style={styles.content}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <Typography variant="displayWordmark" color={activeColors.primary}>
            Quicklime
          </Typography>
          <Typography variant="bodyMd" color={activeColors.secondary} style={styles.tagline}>
            Your class. Organized.
          </Typography>
        </View>

        {/* Auth CTA Container */}
        <View style={styles.ctaContainer}>
          <Button
            variant="secondary"
            loading={loading}
            onPress={handleGoogleSignIn}
            style={styles.googleButton}
          >
            Continue with Google
          </Button>

          <Button
            variant="text"
            onPress={() => console.log('Sign in with email tapped')}
            style={styles.emailLink}
          >
            Sign in with Email
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
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 350,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  tagline: {
    marginTop: Spacing.sm,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  googleButton: {
    width: '100%',
  },
  emailLink: {
    marginTop: Spacing.xs,
  },
});
