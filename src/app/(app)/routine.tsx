import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { ClassRow } from '@/components/ClassRow';
import { WeekGrid } from '@/components/WeekGrid';
import { useRoutine } from '@/hooks/useRoutine';
import { useAuth } from '@/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';

// Week starts on Sunday (index 0)
const DAYS = [
  { label: 'Sun', index: 0 },
  { label: 'Mon', index: 1 },
  { label: 'Tue', index: 2 },
  { label: 'Wed', index: 3 },
  { label: 'Thu', index: 4 },
  { label: 'Fri', index: 5 },
  { label: 'Sat', index: 6 },
];

type ViewMode = 'list' | 'grid';

/**
 * Routine Schedule Screen.
 * Renders a weekly routine with two view modes:
 *   - List: day-selector chips + ordered slot list
 *   - Grid: scrollable time-grid calendar (all 7 days at once)
 */
export default function RoutineScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { profile } = useAuth();
  const { routines, loading } = useRoutine();

  // Default selected day = today (0 = Sunday)
  const todayDayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayDayIndex);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const activeSlots = routines[selectedDay]?.slots ?? [];
  const isCR = profile?.role === 'cr';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* ── Header bar ── */}
      <View style={[styles.headerBar, { borderBottomColor: c.line }]}>
        {/* Brand word-mark */}
        <Typography variant="displayWordmark" color={c.primary} style={styles.brandName}>
          Quicklime
        </Typography>

        {/* Right controls */}
        <View style={styles.headerRight}>
          {/* List / Grid toggle */}
          <View style={[styles.togglePill, { backgroundColor: c.surfaceContainerHigh }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === 'list' && { backgroundColor: c.background },
              ]}
              onPress={() => setViewMode('list')}
              accessibilityLabel="List view"
            >
              <MaterialIcons
                name="view-agenda"
                size={16}
                color={viewMode === 'list' ? c.primary : c.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === 'grid' && { backgroundColor: c.background },
              ]}
              onPress={() => setViewMode('grid')}
              accessibilityLabel="Week grid view"
            >
              <MaterialIcons
                name="grid-view"
                size={16}
                color={viewMode === 'grid' ? c.primary : c.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Edit button (CR only) */}
          {isCR && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/(app)/course-list')}
              accessibilityLabel="Edit schedule"
            >
              <Typography variant="labelMd" color={c.primary} style={{ fontWeight: '600' }}>
                Edit
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Grid view ── */}
      {viewMode === 'grid' ? (
        <View style={styles.gridWrapper}>
          {loading ? (
            <View style={styles.centerMsg}>
              <Typography variant="bodyMd" color={c.textTertiary}>Loading…</Typography>
            </View>
          ) : (
            <WeekGrid routines={routines} colors={c} />
          )}
        </View>
      ) : (
        /* ── List view ── */
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Title */}
          <View style={styles.titleBlock}>
            <Typography variant="headlineLg">Routine</Typography>
          </View>

          {/* Day selector — Sun first */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daySelectorContainer}
            contentContainerStyle={styles.daySelectorContent}
          >
            {DAYS.map((day) => {
              const isActive  = selectedDay === day.index;
              const isToday   = day.index === todayDayIndex;
              return (
                <TouchableOpacity
                  key={day.index}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDay(day.index)}
                  style={[
                    styles.dayButton,
                    isActive
                      ? { backgroundColor: c.primary }
                      : { backgroundColor: c.surface, borderColor: c.line, borderWidth: 1 },
                  ]}
                  accessibilityLabel={day.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <Typography
                    variant="sectionHeader"
                    color={isActive ? c.background : c.secondary}
                  >
                    {day.label}
                  </Typography>
                  {/* Today indicator dot */}
                  {isToday && !isActive && (
                    <View style={[styles.todayDot, { backgroundColor: c.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Slot list */}
          <View style={styles.scheduleList}>
            {loading ? (
              <Typography variant="bodyMd" color={c.textTertiary} style={styles.emptyText}>
                Loading routine…
              </Typography>
            ) : activeSlots.length === 0 ? (
              <View style={[styles.emptyContainer, { borderColor: c.line }]}>
                <Typography variant="bodyMd" color={c.textTertiary}>
                  No classes scheduled for this day.
                </Typography>
              </View>
            ) : (
              activeSlots.map((slot, index) => (
                <View key={slot.slotId}>
                  <ClassRow slot={slot} />
                  {index < activeSlots.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: c.line }]} />
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerBar: {
    height: 52,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.marginH,
  },
  brandName: { fontSize: 22, fontWeight: '600' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // List / Grid toggle pill
  togglePill: {
    flexDirection: 'row',
    borderRadius: Radii.default,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 30,
    height: 26,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  // Grid mode
  gridWrapper: { flex: 1 },
  centerMsg: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // List mode scroll
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

  // Day selector
  daySelectorContainer: { marginBottom: Spacing.xl },
  daySelectorContent: { paddingHorizontal: Spacing.marginH, gap: Spacing.sm },
  dayButton: {
    height: 44,
    minWidth: 54,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },

  // Slot list
  scheduleList: { paddingHorizontal: Spacing.marginH },
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
  emptyText: { textAlign: 'center', marginVertical: Spacing.md },
  divider: {
    height: 1,
    marginLeft: 64 + Spacing.md,
  },
});
