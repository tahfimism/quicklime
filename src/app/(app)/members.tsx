import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Member } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Members List Screen (CR Accessible).
 * Displays a list of all students who have joined the workspace.
 */
export default function MembersScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.workspaceId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const membersColRef = collection(db, 'workspaces', profile.workspaceId, 'members');
    const q = query(membersColRef, orderBy('joinedAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Member[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as Member);
        });
        setMembers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching members list:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [profile?.workspaceId]);

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.headerBar, { borderBottomColor: activeColors.line }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={activeColors.onBackground} />
        </TouchableOpacity>
        
        <Typography variant="sectionHeader" style={styles.headerTitle}>
          Workspace Members
        </Typography>

        <View style={{ width: 44 }} /> {/* Balance Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Typography variant="headlineLg">Class Members</Typography>
          <Typography variant="caption" color={activeColors.secondary} style={styles.subtitle}>
            {members.length} students enrolled in this workspace.
          </Typography>
        </View>

        {loading ? (
          <ActivityIndicator color={activeColors.primary} size="large" style={styles.spinner} />
        ) : members.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: activeColors.line }]}>
            <Typography variant="bodyMd" color={activeColors.textTertiary}>
              No members found in this workspace.
            </Typography>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.line }]}>
            {members.map((member, index) => {
              const isCR = member.role === 'cr';
              return (
                <View key={member.uid}>
                  <View style={styles.memberRow}>
                    <View style={styles.memberInfo}>
                      <Typography variant="courseName" style={{ fontWeight: '500' }}>
                        {member.displayName}
                      </Typography>
                      <Typography variant="caption" color={activeColors.secondary}>
                        {member.email}
                      </Typography>
                    </View>

                    {/* Role badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isCR
                            ? activeColors.accentMuted
                            : activeColors.secondaryContainer,
                        },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        color={isCR ? activeColors.primary : activeColors.onSecondaryContainer}
                        style={styles.badgeText}
                      >
                        {isCR ? 'CR' : 'Student'}
                      </Typography>
                    </View>
                  </View>
                  
                  {index < members.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: activeColors.line }]} />
                  )}
                </View>
              );
            })}
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.marginH,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
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
  subtitle: {
    marginTop: 4,
  },
  spinner: {
    marginTop: Spacing.xl,
  },
  emptyContainer: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  memberInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
  },
});

