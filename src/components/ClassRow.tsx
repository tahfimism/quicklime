import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from './ui/Typography';
import { Slot } from '@/types';

interface ClassRowProps {
  slot: Slot;
  isCurrent?: boolean;
  isPast?: boolean;
}

/**
 * ClassRow list component conforming to Swiss Editorial guidelines.
 * Features time indicator, left-side alignment line, details area, and room code.
 * Highlights current class with elevation, accent border, and a "Now" tag.
 */
export function ClassRow({ slot, isCurrent = false, isPast = false }: ClassRowProps) {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Current class sits inside an elevated card
  if (isCurrent) {
    return (
      <View
        style={[
          styles.currentCard,
          {
            backgroundColor: activeColors.surface,
            borderColor: activeColors.line,
          },
        ]}
      >
        {/* Left vertical indicator line */}
        <View style={[styles.indicatorLine, { backgroundColor: activeColors.primary }]} />
        
        <View style={styles.contentWrapper}>
          <View style={styles.timeColumn}>
            <Typography variant="dataMono" color={activeColors.primary} style={styles.timeText}>
              {slot.startTime}
            </Typography>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.titleRow}>
              <Typography variant="courseName" numberOfLines={1}>
                {slot.courseName}
              </Typography>
              <View
                style={[
                  styles.nowTag,
                  { backgroundColor: activeColors.accentMuted },
                ]}
              >
                <Typography
                  variant="caption"
                  color={activeColors.primary}
                  style={styles.nowTagText}
                >
                  Now
                </Typography>
              </View>
            </View>
            <Typography variant="bodyMd" color={activeColors.secondary} style={styles.detailsText}>
              {slot.teacherName} {slot.room ? `• Room ${slot.room}` : ''}
            </Typography>
          </View>
        </View>
      </View>
    );
  }

  // Normal past/upcoming row layout
  return (
    <View style={[styles.row, isPast && styles.pastRow]}>
      <View style={styles.timeColumn}>
        <Typography variant="dataMono" style={styles.timeText}>
          {slot.startTime}
        </Typography>
      </View>
      
      {/* Decorative vertical separator */}
      <View style={[styles.separator, { backgroundColor: activeColors.line }]} />

      <View style={styles.infoColumn}>
        <View style={styles.titleRow}>
          <Typography variant="courseName" numberOfLines={1}>
            {slot.courseName}
          </Typography>
          {slot.room && (
            <Typography variant="caption" color={activeColors.textTertiary} style={styles.roomText}>
              Room {slot.room}
            </Typography>
          )}
        </View>
        <Typography variant="bodyMd" color={activeColors.secondary} style={styles.detailsText}>
          {slot.courseCode} • {slot.teacherName}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    width: '100%',
  },
  pastRow: {
    opacity: 0.6,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radii.default, // 8pt or 12pt corner radius
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: Spacing.xs,
  },
  indicatorLine: {
    position: 'absolute',
    left: 0,
    top: Spacing.md,
    bottom: Spacing.md,
    width: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeColumn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: '100%',
    marginHorizontal: Spacing.xs,
  },
  infoColumn: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  roomText: {
    marginRight: Spacing.sm,
  },
  detailsText: {
    marginTop: 2,
  },
  nowTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowTagText: {
    fontWeight: '600',
  },
});
export default ClassRow;
