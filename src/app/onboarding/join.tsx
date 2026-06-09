import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { Colors, Spacing } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { InviteCodeInput } from '@/components/ui/Input';
import { auth, functions } from '@/lib/firebase';

/**
 * Join Workspace Screen.
 * Accepts a 6-character invite code, invokes the joinWorkspace Cloud Function,
 * and refreshes the user's token credentials.
 */
export default function JoinWorkspace() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleCodeChange = (newCode: string) => {
    // Standardize to uppercase, remove spaces, limit to 6
    const cleanCode = newCode.toUpperCase().replace(/\s/g, '').slice(0, 6);
    setCode(cleanCode);
    
    if (error) setError(false); // Clear error on edit

    if (cleanCode.length === 6) {
      submitInviteCode(cleanCode);
    }
  };

  const submitInviteCode = async (inviteCode: string) => {
    const user = auth.currentUser;
    if (!user || loading) return;

    setLoading(true);
    setError(false);
    
    try {
      const joinWorkspaceFn = httpsCallable(functions, 'joinWorkspace');
      await joinWorkspaceFn({ inviteCode });
      
      // Force refresh the auth ID token to fetch the new custom claims (role: 'student', workspaceId)
      await user.getIdToken(true);
      
      // AuthGate will automatically detect the updated workspaceId and redirect to /(app)/today!
    } catch (err) {
      console.error('Error joining workspace:', err);
      setError(true);
      setLoading(false);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <View style={styles.content}>
        {/* Back Link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={loading}>
          <Typography variant="labelMd" color={activeColors.primary}>
            ← Back
          </Typography>
        </TouchableOpacity>

        <View style={styles.formBlock}>
          <Typography variant="headlineLg">
            Enter invite code
          </Typography>
          
          <Typography variant="bodyMd" color={activeColors.secondary} style={styles.subtitle}>
            Ask your class representative for the 6-character code.
          </Typography>

          <InviteCodeInput
            value={code}
            onChangeText={handleCodeChange}
            error={error}
          />

          <View style={styles.statusContainer}>
            {loading && (
              <ActivityIndicator color={activeColors.primary} size="small" style={styles.spinner} />
            )}
            
            {error && (
              <Typography variant="caption" color={activeColors.destructive} style={styles.errorText}>
                Invalid invite code. Please try again.
              </Typography>
            )}
          </View>
        </View>
        
        {/* Empty placeholder for height alignment */}
        <View />
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
    height: 380,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  formBlock: {
    width: '100%',
    alignItems: 'flex-start',
  },
  subtitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statusContainer: {
    height: Spacing.xl,
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  spinner: {
    alignSelf: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

