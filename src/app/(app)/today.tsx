import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { ClassRow } from '@/components/ClassRow';
import { EventCard } from '@/components/EventCard';
import { useRoutine } from '@/hooks/useRoutine';
import { useEvents } from '@/hooks/useEvents';

/**
 * Helper to get the current date formatting.
 * e.g., "Thursday, Oct 24"
 */
function getFormattedDate() {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return new Date().toLocaleDateString('en-US', options);
}

/**
 * Helper to get YYYY-MM-DD date string.
 */
function getTodayDateString() {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

/**
 * Today Screen.
 * Renders the dashboard showing today's class schedule and upcoming events.
 */
function CurrentTimeList({ todaySlots }: { todaySlots: any[] }) {
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Keep current time updated to refresh "Now" indicators
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      setCurrentTimeStr(`${hh}:${mm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {todaySlots.map((slot) => {
        const isPast = slot.endTime < currentTimeStr;
        const isCurrent = slot.startTime <= currentTimeStr && slot.endTime >= currentTimeStr;
        return (
          <ClassRow
            key={slot.slotId}
            slot={slot}
            isCurrent={isCurrent}
            isPast={isPast}
          />
        );
      })}
    </>
  );
}

export default function TodayScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { routines, loading: loadingRoutines } = useRoutine();
  const { events, loading: loadingEvents } = useEvents();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Real-time queries automatically sync, we just add a visual delay to feel native
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const todaySlots = useMemo(() => {
    const todayDayIndex = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
    const todayRoutine = routines[todayDayIndex];
    return todayRoutine?.slots || [];
  }, [routines]);

  // Filter events from today onwards, take top 3
  const upcomingEvents = useMemo(() => {
    const todayDateStr = getTodayDateString();
    return events
      .filter((event) => event.date >= todayDateStr)
      .slice(0, 3);
  }, [events]);

  const loading = loadingRoutines || loadingEvents;

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Custom Minimalist Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: activeColors.line }]}>
        <Typography variant="displayWordmark" color={activeColors.primary} style={styles.brandName}>
          Quicklime
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={activeColors.primary} />
        }
      >
        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Typography variant="labelMd" color={activeColors.secondary} style={styles.dateLabel}>
            {getFormattedDate()}
          </Typography>
          <Typography variant="headlineLg">
            Today
          </Typography>
        </View>

        {/* Classes Section */}
        <View style={styles.section}>
          <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.sectionTitle}>
            Classes
          </Typography>
          
          {loading ? (
            <Typography variant="bodyMd" color={activeColors.textTertiary} style={styles.emptyText}>
              Loading routine...
            </Typography>
          ) : todaySlots.length === 0 ? (
            <View style={[styles.emptyContainer, { borderColor: activeColors.line }]}>
              <Typography variant="bodyMd" color={activeColors.textTertiary}>
                No classes scheduled
              </Typography>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <CurrentTimeList todaySlots={todaySlots} />
            </View>
          )}
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.sectionTitle}>
            Upcoming
          </Typography>

          {loading ? (
            <Typography variant="bodyMd" color={activeColors.textTertiary} style={styles.emptyText}>
              Loading events...
            </Typography>
          ) : upcomingEvents.length === 0 ? (
            <View style={[styles.emptyContainer, { borderColor: activeColors.line }]}>
              <Typography variant="bodyMd" color={activeColors.textTertiary}>
                Nothing scheduled this week
              </Typography>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/(app)/event-detail/${event.id}`)}
                />
              ))}
            </View>
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
    marginBottom: Spacing.xxl,
  },
  dateLabel: {
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  listContainer: {
    width: '100%',
  },
  emptyContainer: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
});

