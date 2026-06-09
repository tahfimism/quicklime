import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { ClassRow } from '@/components/ClassRow';
import { useRoutine } from '@/hooks/useRoutine';
import { useAuth } from '@/hooks/useAuth';

const DAYS = [
  { label: 'Mon', index: 1 },
  { label: 'Tue', index: 2 },
  { label: 'Wed', index: 3 },
  { label: 'Thu', index: 4 },
  { label: 'Fri', index: 5 },
  { label: 'Sat', index: 6 },
  { label: 'Sun', index: 0 },
];

/**
 * Routine Schedule Screen.
 * Renders weekly routine selector (Mon-Sun) and displays
 * daily routine lists. Shows an edit button to CRs.
 */
export default function RoutineScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  
  const { profile } = useAuth();
  const { routines, loading } = useRoutine();
  
  // Set default selected day to current day of week
  const todayDayIndex = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  const [selectedDay, setSelectedDay] = useState<number>(todayDayIndex);

  const activeRoutine = routines[selectedDay];
  const activeSlots = activeRoutine?.slots || [];
  
  const isCR = profile?.role === 'cr';

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: activeColors.line }]}>
        <Typography variant="displayWordmark" color={activeColors.primary} style={styles.brandName}>
          Quicklime
        </Typography>
        
        {isCR && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => router.push({
              pathname: '/(app)/routine-edit',
              params: { day: selectedDay }
            })}
          >
            <Typography variant="labelMd" color={activeColors.primary} style={styles.editText}>
              Edit
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Typography variant="headlineLg">
            Routine
          </Typography>
        </View>

        {/* Horizontal Day Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.daySelectorContainer}
          contentContainerStyle={styles.daySelectorContent}
        >
          {DAYS.map((day) => {
            const isActive = selectedDay === day.index;
            return (
              <TouchableOpacity
                key={day.index}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(day.index)}
                style={[
                  styles.dayButton,
                  isActive
                    ? { backgroundColor: activeColors.primary }
                    : { backgroundColor: activeColors.surface, borderColor: activeColors.line, borderWidth: 1 }
                ]}
              >
                <Typography
                  variant="sectionHeader"
                  color={isActive ? activeColors.background : activeColors.secondary}
                >
                  {day.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Schedule List */}
        <View style={styles.scheduleList}>
          {loading ? (
            <Typography variant="bodyMd" color={activeColors.textTertiary} style={styles.emptyText}>
              Loading routine...
            </Typography>
          ) : activeSlots.length === 0 ? (
            <View style={[styles.emptyContainer, { borderColor: activeColors.line }]}>
              <Typography variant="bodyMd" color={activeColors.textTertiary}>
                No classes scheduled for this day
              </Typography>
            </View>
          ) : (
            activeSlots.map((slot, index) => (
              <View key={slot.slotId}>
                <ClassRow slot={slot} />
                {index < activeSlots.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: activeColors.line }]} />
                )}
              </View>
            ))
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    position: 'relative',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    right: Spacing.marginH,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editText: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  titleBlock: {
    paddingHorizontal: Spacing.marginH,
    marginBottom: Spacing.lg,
  },
  daySelectorContainer: {
    marginBottom: Spacing.xl,
  },
  daySelectorContent: {
    paddingHorizontal: Spacing.marginH,
    gap: Spacing.sm,
  },
  dayButton: {
    height: 44,
    minWidth: 54,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleList: {
    paddingHorizontal: Spacing.marginH,
  },
  emptyContainer: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  divider: {
    height: 1,
    marginLeft: 64 + Spacing.md, // Align divider to slide details column
  },
});

