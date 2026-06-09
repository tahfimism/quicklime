import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Colors, Spacing } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db, auth } from '@/lib/firebase';

// Generates a random 6-character alphanumeric code for the invite
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create Workspace Screen.
 * Accepts a workspace name, generates a unique invite code,
 * and instantiates the new database structures in Firestore.
 */
export default function CreateWorkspace() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateWorkspace = async () => {
    const user = auth.currentUser;
    if (!name.trim() || !user || loading) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Instantiate the workspace document
      const workspaceRef = doc(collection(db, 'workspaces'));
      const workspaceId = workspaceRef.id;
      const inviteCode = generateInviteCode();

      batch.set(workspaceRef, {
        id: workspaceId,
        name: name.trim(),
        crUid: user.uid,
        inviteCode: inviteCode,
        fcmTopic: `workspace_${workspaceId}`,
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Add creator to the members collection as 'cr'
      const memberRef = doc(db, `workspaces/${workspaceId}/members`, user.uid);
      batch.set(memberRef, {
        uid: user.uid,
        displayName: user.displayName || 'Class Representative',
        email: user.email || '',
        photoUrl: user.photoURL || null,
        role: 'cr',
        joinedAt: serverTimestamp(),
        fcmToken: null,
        notificationsEnabled: true,
      });

      // 3. Update the global user document
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        workspaceId: workspaceId,
        role: 'cr',
        lastActiveAt: serverTimestamp(),
      });

      // Commit all operations atomically
      await batch.commit();
      
      // Navigation is automatically handled by the AuthGate in the root layout!
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <View style={styles.content}>
        {/* Back Link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Typography variant="labelMd" color={activeColors.primary}>
            ← Back
          </Typography>
        </TouchableOpacity>

        <View style={styles.formBlock}>
          <Typography variant="headlineLg">
            Name your workspace
          </Typography>
          
          <Typography variant="bodyMd" color={activeColors.secondary} style={styles.subtitle}>
            This is usually your class, department, or batch name.
          </Typography>

          <Input
            label="Workspace Name"
            placeholder="e.g. CSE Batch 25, Section A"
            value={name}
            onChangeText={setName}
            containerStyle={styles.inputContainer}
            autoFocus
          />

          <Typography variant="caption" color={activeColors.textTertiary} style={styles.hint}>
            Maximum 100 characters.
          </Typography>
        </View>

        <Button
          variant="primary"
          disabled={!name.trim()}
          loading={loading}
          onPress={handleCreateWorkspace}
          style={styles.submitBtn}
        >
          Create workspace
        </Button>
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
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.xs,
  },
  hint: {
    marginTop: Spacing.xs,
  },
  submitBtn: {
    width: '100%',
  },
});

