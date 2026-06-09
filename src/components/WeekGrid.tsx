import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Routine, Slot } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

// ─── Layout constants ────────────────────────────────────────────────────────

const TIME_COL_W = 48;   // px — left time-label column
const DAY_COL_W  = 80;   // px — each day column
const HOUR_H     = 60;   // px — height of one hour
const PADDING_H  = 30;   // minutes of padding above/below the auto-range
const MIN_HOURS  = 4;    // show at least this many hours even if schedule is sparse

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Pastel block colours for courses (index cycles if there are more than 8 courses)
const BLOCK_PALETTES = [
  { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' }, // blue
  { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' }, // green
  { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }, // amber
  { bg: '#EDE9FE', border: '#C4B5FD', text: '#4C1D95' }, // violet
  { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D' }, // pink
  { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }, // red
  { bg: '#CCFBF1', border: '#5EEAD4', text: '#0F766E' }, // teal
  { bg: '#F0FDF4', border: '#86EFAC', text: '#166534' }, // lime
];

// Build a deterministic colour index from a string (courseCode)
function colourIndex(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) & 0xffff;
  return h % BLOCK_PALETTES.length;
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Convert "HH:mm" to total minutes since midnight */
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes to "H:mm" display label */
function toLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${display}${suffix}` : `${display}:${String(m).padStart(2, '0')}${suffix}`;
}

// ─── Range computation ───────────────────────────────────────────────────────

interface TimeRange { startMin: number; endMin: number; totalMin: number }

function computeRange(routines: Record<number, Routine>): TimeRange {
  let earliest = Infinity;
  let latest   = -Infinity;
  let hasAny   = false;

  for (let d = 0; d <= 6; d++) {
    for (const slot of routines[d]?.slots ?? []) {
      hasAny = true;
      earliest = Math.min(earliest, toMinutes(slot.startTime));
      latest   = Math.max(latest,   toMinutes(slot.endTime));
    }
  }

  if (!hasAny) {
    // Default fallback if no slots exist
    return { startMin: 8 * 60, endMin: 18 * 60, totalMin: 10 * 60 };
  }

  // Add padding and snap to hour boundaries
  const padStart = Math.floor((earliest - PADDING_H) / 60) * 60;
  const padEnd   = Math.ceil((latest + PADDING_H) / 60) * 60;

  // Enforce minimum span
  const span = Math.max(padEnd - padStart, MIN_HOURS * 60);
  const finalEnd = padStart + span;

  return { startMin: padStart, endMin: finalEnd, totalMin: span };
}

// ─── Detail popover ───────────────────────────────────────────────────────────

interface DetailCard {
  slot: Slot;
  dayOfWeek: number;
  paletteIdx: number;
}

// ─── WeekGrid component ───────────────────────────────────────────────────────

interface WeekGridProps {
  routines: Record<number, Routine>;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}

export function WeekGrid({ routines, colors: c }: WeekGridProps) {
  const { width: screenW } = useWindowDimensions();
  const vScrollRef = useRef<ScrollView>(null);
  const range = computeRange(routines);

  const [detail, setDetail] = useState<DetailCard | null>(null);

  // Build a stable courseCode → palette index map
  const courseColours = React.useMemo(() => {
    const map = new Map<string, number>();
    for (let d = 0; d <= 6; d++) {
      for (const slot of routines[d]?.slots ?? []) {
        if (!map.has(slot.courseCode)) {
          map.set(slot.courseCode, colourIndex(slot.courseCode));
        }
      }
    }
    return map;
  }, [routines]);

  // Auto-scroll vertically to first class on mount
  useEffect(() => {
    let earliest = Infinity;
    for (let d = 0; d <= 6; d++) {
      for (const s of routines[d]?.slots ?? []) {
        earliest = Math.min(earliest, toMinutes(s.startTime));
      }
    }
    if (earliest !== Infinity) {
      const offset = ((earliest - range.startMin - PADDING_H) / 60) * HOUR_H;
      setTimeout(() => vScrollRef.current?.scrollTo({ y: Math.max(0, offset), animated: true }), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Total grid height
  const gridH = (range.totalMin / 60) * HOUR_H;
  // Total grid width (time col + 7 day cols)
  const totalGridW = TIME_COL_W + DAY_COL_W * 7;
  // Minimum width: fill screen if wider
  const gridW = Math.max(totalGridW, screenW);

  // Hour labels
  const hours: number[] = [];
  for (let m = range.startMin; m <= range.endMin; m += 60) hours.push(m);

  const todayIdx = new Date().getDay(); // 0 = Sun

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Day header row — stays fixed above the scrollable grid */}
      <View style={[styles.headerRow, { borderBottomColor: c.line, backgroundColor: c.background }]}>
        {/* Time column spacer */}
        <View style={[styles.timeColSpacer, { borderRightColor: c.line }]} />
        {/* Day labels */}
        {DAY_SHORT.map((label, dayIdx) => {
          const isToday = dayIdx === todayIdx;
          return (
            <View
              key={dayIdx}
              style={[
                styles.dayHeader,
                isToday && { backgroundColor: c.accentMuted },
              ]}
            >
              <Typography
                variant="sectionHeader"
                color={isToday ? c.primary : c.secondary}
              >
                {label}
              </Typography>
              {isToday && (
                <View style={[styles.todayDot, { backgroundColor: c.primary }]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Vertical scroll — time axis */}
      <ScrollView
        ref={vScrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.vScroll}
      >
        {/* Horizontal scroll — day columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.gridContainer, { width: gridW, height: gridH }]}>

            {/* ── Time column ── */}
            <View style={[styles.timeCol, { borderRightColor: c.line }]}>
              {hours.map((m) => (
                <View key={m} style={[styles.hourLabelRow, { height: HOUR_H }]}>
                  <Typography variant="caption" color={c.textTertiary} style={styles.hourLabel}>
                    {toLabel(m)}
                  </Typography>
                </View>
              ))}
            </View>

            {/* ── Day columns ── */}
            {DAY_SHORT.map((_label, dayIdx) => {
              const isToday = dayIdx === todayIdx;
              const daySlots = routines[dayIdx]?.slots ?? [];

              return (
                <View
                  key={dayIdx}
                  style={[
                    styles.dayCol,
                    {
                      width: DAY_COL_W,
                      height: gridH,
                      borderRightColor: c.line,
                      backgroundColor: isToday
                        ? c.accentMuted + '40' // 25% alpha tint
                        : 'transparent',
                    },
                  ]}
                >
                  {/* Horizontal hour grid lines */}
                  {hours.map((m) => (
                    <View
                      key={m}
                      style={[
                        styles.hourLine,
                        {
                          top: ((m - range.startMin) / 60) * HOUR_H,
                          borderTopColor: c.line,
                        },
                      ]}
                    />
                  ))}

                  {/* Course blocks */}
                  {daySlots.map((slot) => {
                    const slotStart = toMinutes(slot.startTime);
                    const slotEnd   = toMinutes(slot.endTime);
                    const top    = ((slotStart - range.startMin) / 60) * HOUR_H;
                    const height = Math.max(((slotEnd - slotStart) / 60) * HOUR_H - 2, 24);
                    const pi     = courseColours.get(slot.courseCode) ?? 0;
                    const pal    = BLOCK_PALETTES[pi];

                    return (
                      <TouchableOpacity
                        key={slot.slotId}
                        activeOpacity={0.85}
                        onPress={() =>
                          setDetail(
                            detail?.slot.slotId === slot.slotId
                              ? null
                              : { slot, dayOfWeek: dayIdx, paletteIdx: pi }
                          )
                        }
                        style={[
                          styles.block,
                          {
                            top,
                            height,
                            backgroundColor: pal.bg,
                            borderLeftColor: pal.border,
                          },
                        ]}
                        accessibilityLabel={`${slot.courseName} ${slot.startTime}–${slot.endTime}`}
                      >
                        <Typography
                          variant="caption"
                          style={[styles.blockCode, { color: pal.text }]}
                          numberOfLines={1}
                        >
                          {slot.courseCode}
                        </Typography>
                        {height > 36 && (
                          <Typography
                            variant="caption"
                            style={[styles.blockTime, { color: pal.text + 'CC' }]}
                            numberOfLines={1}
                          >
                            {slot.startTime}–{slot.endTime}
                          </Typography>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      {/* ── Detail popover ── */}
      {detail && (
        <TouchableOpacity
          style={styles.detailBackdrop}
          activeOpacity={1}
          onPress={() => setDetail(null)}
        >
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: c.surface,
                borderColor: c.line,
                borderLeftColor: BLOCK_PALETTES[detail.paletteIdx].border,
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Typography variant="courseName">{detail.slot.courseName}</Typography>
                <Typography variant="caption" color={c.secondary}>
                  {detail.slot.courseCode} · {DAY_SHORT[detail.dayOfWeek]}
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setDetail(null)}>
                <MaterialIcons name="close" size={18} color={c.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="person-outline" size={14} color={c.secondary} />
              <Typography variant="caption" color={c.secondary} style={styles.detailText}>
                {detail.slot.teacherName}
              </Typography>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={14} color={c.secondary} />
              <Typography variant="caption" color={c.secondary} style={styles.detailText}>
                {detail.slot.startTime} – {detail.slot.endTime}
              </Typography>
            </View>
            {detail.slot.room && (
              <View style={styles.detailRow}>
                <MaterialIcons name="room" size={14} color={c.secondary} />
                <Typography variant="caption" color={c.secondary} style={styles.detailText}>
                  Room {detail.slot.room}
                </Typography>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Fixed day-header row
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeColSpacer: {
    width: TIME_COL_W,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    width: DAY_COL_W,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },

  // Scrollable content
  vScroll: { flex: 1 },
  gridContainer: { flexDirection: 'row', position: 'relative' },

  // Time column
  timeCol: {
    width: TIME_COL_W,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  hourLabelRow: { justifyContent: 'flex-start', paddingTop: 4, paddingRight: 6 },
  hourLabel: { textAlign: 'right' },

  // Day column
  dayCol: {
    position: 'relative',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // Course block
  block: {
    position: 'absolute',
    left: 3,
    right: 3,
    borderRadius: Radii.sm,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  blockCode: { fontWeight: '700', fontSize: 10, letterSpacing: 0.3 },
  blockTime: { fontSize: 9, marginTop: 1 },

  // Detail card
  detailBackdrop: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.marginH,
    paddingBottom: Spacing.lg,
  },
  detailCard: {
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: { marginLeft: 6 },
});
