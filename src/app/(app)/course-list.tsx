import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useRoutine } from '@/hooks/useRoutine';
import { CourseEntry, CourseOccurrence, Routine } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ─── Aggregation helper ───────────────────────────────────────────────────────

/**
 * Groups all slots across all 7 routine documents into CourseEntry objects,
 * keyed by courseCode. Pure client-side — no extra Firestore reads needed.
 */
function aggregateCourses(routines: Record<number, Routine>): CourseEntry[] {
  const map = new Map<string, CourseEntry>();

  for (let day = 0; day <= 6; day++) {
    const slots = routines[day]?.slots ?? [];
    for (const slot of slots) {
      const key = slot.courseCode;
      if (!map.has(key)) {
        map.set(key, {
          courseName: slot.courseName,
          courseCode: slot.courseCode,
          teacherName: slot.teacherName,
          room: slot.room,
          occurrences: [],
        });
      }
      const occ: CourseOccurrence = {
        slotId: slot.slotId,
        dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
      map.get(key)!.occurrences.push(occ);
    }
  }

  // Sort occurrences inside each course by dayOfWeek then startTime
  for (const entry of map.values()) {
    entry.occurrences.sort((a, b) =>
      a.dayOfWeek !== b.dayOfWeek
        ? a.dayOfWeek - b.dayOfWeek
        : a.startTime.localeCompare(b.startTime)
    );
  }

  // Sort courses alphabetically by name
  return [...map.values()].sort((a, b) =>
    a.courseName.localeCompare(b.courseName)
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CourseListScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { routines, loading } = useRoutine();

  const courses = useMemo(() => aggregateCourses(routines), [routines]);

  const goToEditCourse = (courseCode: string) => {
    router.push({ pathname: '/(app)/course-edit', params: { courseCode } });
  };

  const goToAddCourse = () => {
    router.push('/(app)/course-edit');
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* ── Nav bar ── */}
      <View style={[styles.navBar, { borderBottomColor: c.line }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBack}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color={c.onBackground} />
        </TouchableOpacity>

        <Typography variant="sectionHeader">Edit Schedule</Typography>

        {/* Spacer mirror */}
        <View style={styles.navBack} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <Typography
            variant="bodyMd"
            color={c.textTertiary}
            style={styles.loadingText}
          >
            Loading courses…
          </Typography>
        ) : courses.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: c.line }]}>
            <MaterialIcons
              name="menu-book"
              size={36}
              color={c.textTertiary}
              style={{ marginBottom: Spacing.sm }}
            />
            <Typography variant="bodyMd" color={c.textTertiary}>
              No courses yet.
            </Typography>
            <Typography
              variant="caption"
              color={c.textTertiary}
              style={{ marginTop: 4 }}
            >
              Tap "Add Course" to build your class schedule.
            </Typography>
          </View>
        ) : (
          <View style={styles.list}>
            {courses.map((course, idx) => (
              <CourseCard
                key={course.courseCode}
                course={course}
                colors={c}
                isLast={idx === courses.length - 1}
                onPress={() => goToEditCourse(course.courseCode)}
              />
            ))}
          </View>
        )}

        <Button
          variant={courses.length === 0 ? 'primary' : 'secondary'}
          onPress={goToAddCourse}
          style={styles.addBtn}
        >
          + Add Course
        </Button>
      </ScrollView>
    </View>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: CourseEntry;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  isLast: boolean;
  onPress: () => void;
}

function CourseCard({ course, colors: c, isLast, onPress }: CourseCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.line,
          marginBottom: isLast ? 0 : Spacing.sm,
        },
      ]}
      accessibilityLabel={`Edit ${course.courseName}`}
    >
      <View style={styles.cardMain}>
        {/* Course meta */}
        <View style={styles.cardMeta}>
          <Typography variant="courseName" numberOfLines={1}>
            {course.courseName}
          </Typography>
          <Typography
            variant="caption"
            color={c.secondary}
            style={{ marginTop: 2 }}
            numberOfLines={1}
          >
            {course.courseCode} · {course.teacherName}
            {course.room ? ` · Room ${course.room}` : ''}
          </Typography>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={20}
          color={c.textTertiary}
        />
      </View>

      {/* Day-time chips */}
      <View style={styles.chipRow}>
        {course.occurrences.map((occ) => (
          <View
            key={occ.slotId}
            style={[styles.chip, { backgroundColor: c.accentMuted }]}
          >
            <Typography
              variant="caption"
              color={c.primary}
              style={styles.chipText}
            >
              {DAY_SHORT[occ.dayOfWeek]} {occ.startTime}–{occ.endTime}
            </Typography>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.marginH,
  },
  navBack: { width: 40, alignItems: 'flex-start' },
  scroll: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.marginH,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  loadingText: { textAlign: 'center', marginTop: Spacing.xl },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  list: { marginBottom: Spacing.lg },
  card: {
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMeta: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  chipText: { fontWeight: '600' },
  addBtn: { width: '100%' },
});
