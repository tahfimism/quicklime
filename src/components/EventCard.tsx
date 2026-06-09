import React from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from './ui/Typography';
import { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

/**
 * EventCard list component conforming to Swiss Editorial guidelines.
 * Displays type badge, date/time metadata, title, and course code.
 * Styles type badges with semantic background fills (red for Test, green for Extra Class, etc.).
 */
export function EventCard({ event, onPress }: EventCardProps) {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Map event types to display labels and colors
  const typeMapping = {
    test: {
      label: 'Test',
      bgColor: activeColors.errorContainer,
      textColor: activeColors.onErrorContainer,
    },
    assignment: {
      label: 'Assignment',
      bgColor: activeColors.secondaryContainer,
      textColor: activeColors.onSecondaryContainer,
    },
    notice: {
      label: 'Notice',
      bgColor: activeColors.tertiaryContainer,
      textColor: activeColors.onTertiaryContainer,
    },
    extra_class: {
      label: 'Extra Class',
      bgColor: activeColors.accentMuted,
      textColor: activeColors.primary,
    },
  };

  const currentType = typeMapping[event.type] || typeMapping.notice;

  // Format date display (e.g. "YYYY-MM-DD" -> "YYYY/MM/DD")
  const dateDisplay = event.date;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: activeColors.surface,
          borderColor: activeColors.line,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: currentType.bgColor }]}>
          <Typography
            variant="caption"
            style={[styles.badgeText, { color: currentType.textColor }]}
          >
            {currentType.label}
          </Typography>
        </View>
        
        <Typography variant="dataMono" color={activeColors.secondary}>
          {event.startTime ? event.startTime : dateDisplay}
        </Typography>
      </View>

      <Typography variant="eventTitle" style={[styles.title, { color: activeColors.onSurface }]}>
        {event.title}
      </Typography>

      <View style={styles.bottomRow}>
        <Typography variant="bodyMd" color={activeColors.secondary} numberOfLines={1}>
          {event.courseCode ? event.courseCode : ''}
          {event.courseCode && event.teacherName ? ' • ' : ''}
          {event.teacherName ? event.teacherName : ''}
        </Typography>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: Radii.md, // 12pt corner radius
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.xs,
  },
});
export default EventCard;
