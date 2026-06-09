import React from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Alert, Clipboard, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Settings Screen.
 * Displays user profile details, workspace configurations (invite code, copying, and regeneration),
 * in-app notification preferences, member navigation, and sign-out controls.
 */
export default function SettingsScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { profile } = useAuth();
  const { workspace } = useWorkspace();

  const isCR = profile?.role === 'cr';

  const handleCopyInviteCode = () => {
    if (workspace?.inviteCode) {
      Clipboard.setString(workspace.inviteCode);
      Alert.alert('Copied', `Invite code "${workspace.inviteCode}" copied to clipboard.`);
    }
  };

  const handleRegenerateInviteCode = () => {
    if (!workspace?.id) return;
    
    // Generate new code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newCode = '';
    for (let i = 0; i < 6; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    Alert.alert(
      'Regenerate Invite Code',
      'Are you sure you want to regenerate the invite code? The old code will stop working immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'workspaces', workspace.id);
              await updateDoc(docRef, {
                inviteCode: newCode,
                updatedAt: serverTimestamp(),
              });
              Alert.alert('Success', `New invite code is "${newCode}"`);
            } catch (err) {
              console.error('Failed to regenerate invite code:', err);
              Alert.alert('Error', 'Failed to regenerate invite code.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Quicklime?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              // Redirect happens automatically via AuthGate!
            } catch (err) {
              console.error('Error signing out:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: activeColors.line }]}>
        <Typography variant="displayWordmark" color={activeColors.primary} style={styles.brandName}>
          Quicklime
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Typography variant="headlineLg">Settings</Typography>
        </View>

        {/* Section: Workspace Details */}
        <View style={styles.section}>
          <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.sectionHeader}>
            Workspace
          </Typography>

          <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.line }]}>
            <View style={styles.row}>
              <View>
                <Typography variant="labelMd" color={activeColors.secondary}>Name</Typography>
                <Typography variant="courseName" style={styles.valText}>
                  {workspace?.name || 'Loading...'}
                </Typography>
              </View>
            </View>

            {/* Inset Divider */}
            <View style={[styles.rowDivider, { backgroundColor: activeColors.line }]} />

            <TouchableOpacity style={styles.row} onPress={handleCopyInviteCode}>
              <View>
                <Typography variant="labelMd" color={activeColors.secondary}>Invite Code</Typography>
                <Typography variant="headlineLgMobile" color={activeColors.primary} style={[styles.valText, { fontFamily: 'GeistMono_400Regular' }]}>
                  {workspace?.inviteCode || '------'}
                </Typography>
              </View>
              <MaterialIcons name="content-copy" size={20} color={activeColors.secondary} />
            </TouchableOpacity>

            {isCR && (
              <>
                <View style={[styles.rowDivider, { backgroundColor: activeColors.line }]} />
                <TouchableOpacity style={styles.row} onPress={handleRegenerateInviteCode}>
                  <Typography variant="bodyMd" color={activeColors.destructive}>
                    Regenerate Invite Code
                  </Typography>
                  <MaterialIcons name="refresh" size={20} color={activeColors.destructive} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Section: Members List (CR Only) */}
        {isCR && (
          <View style={styles.section}>
            <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.sectionHeader}>
              Members Management
            </Typography>

            <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.line }]}>
              <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/members')}>
                <View>
                  <Typography variant="courseName">View Workspace Members</Typography>
                  <Typography variant="caption" color={activeColors.secondary}>
                    {workspace?.memberCount || 1} registered students
                  </Typography>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={activeColors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Section: Notification Settings */}
        <View style={styles.section}>
          <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.sectionHeader}>
            Preferences
          </Typography>

          <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.line }]}>
            <View style={styles.row}>
              <View>
                <Typography variant="courseName">Push Notifications</Typography>
                <Typography variant="caption" color={activeColors.secondary}>
                  Receive routine & event reminders
                </Typography>
              </View>
              <Switch
                value={profile?.notificationsEnabled !== false}
                onValueChange={async (val) => {
                  if (!profile) return;
                  const docRef = doc(db, 'users', profile.uid);
                  await updateDoc(docRef, { notificationsEnabled: val });
                }}
                trackColor={{ false: activeColors.line, true: activeColors.primaryContainer }}
                thumbColor={activeColors.background}
              />
            </View>
          </View>
        </View>

        {/* Section: Account Profile Details */}
        <View style={styles.section}>
          <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.sectionHeader}>
            Account
          </Typography>

          <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.line }]}>
            <View style={styles.row}>
              <View>
                <Typography variant="courseName">{profile?.displayName || 'Student'}</Typography>
                <Typography variant="caption" color={activeColors.secondary}>{profile?.email || ''}</Typography>
              </View>
              <View style={[styles.avatarPlaceholder, { backgroundColor: activeColors.line }]}>
                <Typography variant="sectionHeader" color={activeColors.secondary}>
                  {(profile?.displayName || 'S').slice(0, 1).toUpperCase()}
                </Typography>
              </View>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: activeColors.line }]} />

            <TouchableOpacity style={styles.row} onPress={handleSignOut}>
              <Typography variant="bodyMd" color={activeColors.destructive} style={{ fontWeight: '600' }}>
                Sign Out
              </Typography>
              <MaterialIcons name="exit-to-app" size={20} color={activeColors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.marginH,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  titleBlock: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  valText: {
    marginTop: 2,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

