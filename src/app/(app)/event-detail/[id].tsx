import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Event Detail Screen.
 * Presents a focused view of a class event with its course metadata,
 * time window, description body, and attachment links.
 * Grants deletion privileges exclusively to CRs.
 */
export default function EventDetailScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const eventId = params.id as string;
  const { profile } = useAuth();
  const { events, deleteEvent } = useEvents();

  const [deleting, setDeleting] = useState(false);

  const event = events.find((e) => e.id === eventId);
  const isCR = profile?.role === 'cr';

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: activeColors.background, justifyContent: 'center' }]}>
        <Typography variant="bodyMd" color={activeColors.textTertiary} style={{ textAlign: 'center' }}>
          Event not found
        </Typography>
      </View>
    );
  }

  // Type badge styling definitions
  const badgeColors = {
    test: { label: 'Test', bg: activeColors.errorContainer, text: activeColors.onErrorContainer },
    assignment: { label: 'Assignment', bg: activeColors.secondaryContainer, text: activeColors.onSecondaryContainer },
    notice: { label: 'Notice', bg: activeColors.tertiaryContainer, text: activeColors.onTertiaryContainer },
    extra_class: { label: 'Extra Class', bg: activeColors.accentMuted, text: activeColors.primary },
  }[event.type] || { label: 'Notice', bg: activeColors.tertiaryContainer, text: activeColors.onTertiaryContainer };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to permanently delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteEvent(eventId);
              router.back();
            } catch (err) {
              console.error('Error deleting event:', err);
              Alert.alert('Error', 'Failed to delete event.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Top Header Navigation */}
      <View style={[styles.headerBar, { borderBottomColor: activeColors.line }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={activeColors.onBackground} />
        </TouchableOpacity>
        
        <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
          <Typography variant="caption" style={[styles.badgeText, { color: badgeColors.text }]}>
            {badgeColors.label}
          </Typography>
        </View>

        {/* Spacer balance */}
        <View style={{ width: 44 }} />

      </View>

      <View style={styles.content}>
        {/* Title */}
        <Typography variant="eventTitle" style={styles.title}>
          {event.title}
        </Typography>

        {/* Date and Time info block */}
        <View style={styles.timeBlock}>
          <MaterialIcons name="access-time" size={18} color={activeColors.secondary} style={styles.metaIcon} />
          <Typography variant="dataMono" color={activeColors.secondary}>
            {event.date} {event.startTime ? `· ${event.startTime}` : ''}
            {event.endTime ? ` - ${event.endTime}` : ''}
          </Typography>
        </View>

        {/* Course details */}
        <View style={styles.courseBlock}>
          <MaterialIcons name="class" size={18} color={activeColors.secondary} style={styles.metaIcon} />
          <Typography variant="bodyMd" color={activeColors.secondary}>
            {event.courseCode ? `${event.courseCode} • ` : ''}
            {event.teacherName ? event.teacherName : 'Class event'}
          </Typography>
        </View>

        {/* Horizontal Divider */}
        <View style={[styles.divider, { backgroundColor: activeColors.line }]} />

        {/* Description Body */}
        {event.description ? (
          <ScrollView style={styles.descScroll}>
            <Typography variant="bodyMd" style={styles.description}>
              {event.description}
            </Typography>
          </ScrollView>
        ) : (
          <Typography variant="bodyMd" color={activeColors.textTertiary} style={styles.noDesc}>
            No description provided.
          </Typography>
        )}

        {/* Destructive delete option at the bottom */}
        {isCR && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Typography variant="bodyMd" color={activeColors.destructive} style={styles.deleteText}>
              {deleting ? 'Deleting...' : 'Delete Event'}
            </Typography>
          </TouchableOpacity>
        )}
      </View>
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
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.marginH,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  courseBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  metaIcon: {
    marginRight: Spacing.sm,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  descScroll: {
    flex: 1,
  },
  description: {
    lineHeight: 22,
  },
  noDesc: {
    flex: 1,
    fontStyle: 'italic',
  },
  deleteButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  deleteText: {
    fontWeight: '600',
  },
});

