import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRoutine } from '@/hooks/useRoutine';
import { Slot } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

// ─── Local edit-row type ──────────────────────────────────────────────────────

/**
 * One editable row in the weekly schedule list.
 * existingSlotId is present when editing a pre-existing occurrence.
 */
interface EditRow {
  rowId: string;         // stable React key
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  existingSlotId?: string;   // undefined → this is a new row being added
  originalStart?: string;    // snapshot for dirty detection
  originalEnd?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function isValidTime(t: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(t);
}

function hasOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
) {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

function findConflict(candidate: Slot, pool: Slot[]): string | null {
  for (const s of pool) {
    if (s.slotId === candidate.slotId) continue;
    if (hasOverlap(candidate, s)) return s.courseName;
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CourseEditScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  const editingCode = (params.courseCode as string | undefined) ?? null;
  const isEditMode = !!editingCode;

  const { routines, updateRoutine } = useRoutine();

  // ── Form fields ────────────────────────────────────────────────────────────
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [room, setRoom] = useState('');

  // ── Schedule rows ──────────────────────────────────────────────────────────
  const [rows, setRows] = useState<EditRow[]>([]);
  // IDs of existing occurrences that the user deleted during this session
  const [removedSlotIds, setRemovedSlotIds] = useState<Set<string>>(new Set());

  // ── UI state ───────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // ── Load existing data when in edit mode ───────────────────────────────────
  useEffect(() => {
    if (!editingCode) {
      // New course — start with a blank row defaulting to Monday
      setRows([{ rowId: uuid(), dayOfWeek: 1, startTime: '', endTime: '' }]);
      return;
    }

    // Gather all existing occurrences of this courseCode across all days
    let meta: { courseName: string; courseCode: string; teacherName: string; room: string | null } | null = null;
    const loadedRows: EditRow[] = [];

    for (let day = 0; day <= 6; day++) {
      const slots = routines[day]?.slots ?? [];
      for (const slot of slots) {
        if (slot.courseCode !== editingCode) continue;
        if (!meta) {
          meta = {
            courseName: slot.courseName,
            courseCode: slot.courseCode,
            teacherName: slot.teacherName,
            room: slot.room,
          };
        }
        loadedRows.push({
          rowId: uuid(),
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: slot.startTime,
          endTime: slot.endTime,
          existingSlotId: slot.slotId,
          originalStart: slot.startTime,
          originalEnd: slot.endTime,
        });
      }
    }

    if (meta) {
      setCourseName(meta.courseName);
      setCourseCode(meta.courseCode);
      setTeacherName(meta.teacherName);
      setRoom(meta.room ?? '');
    }

    // Sort rows by dayOfWeek then startTime for a clean display
    loadedRows.sort((a, b) =>
      a.dayOfWeek !== b.dayOfWeek
        ? a.dayOfWeek - b.dayOfWeek
        : a.startTime.localeCompare(b.startTime)
    );
    setRows(loadedRows.length > 0
      ? loadedRows
      : [{ rowId: uuid(), dayOfWeek: 1, startTime: '', endTime: '' }]
    );
    setRemovedSlotIds(new Set());
    setError('');
  // We only want to run this once when the screen mounts / editingCode changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCode]);

  // ── Row mutations ──────────────────────────────────────────────────────────
  const addRow = () => {
    const lastDay = rows[rows.length - 1]?.dayOfWeek ?? 1;
    const nextDay = ((lastDay + 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    setRows((prev) => [...prev, { rowId: uuid(), dayOfWeek: nextDay, startTime: '', endTime: '' }]);
    setError('');
  };

  const removeRow = (rowId: string) => {
    const row = rows.find((r) => r.rowId === rowId);
    if (!row) return;
    // If this was an existing occurrence, record it as removed
    if (row.existingSlotId) {
      setRemovedSlotIds((prev) => new Set([...prev, row.existingSlotId!]));
    }
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
    setError('');
  };

  const updateRow = useCallback(
    (rowId: string, patch: Partial<Pick<EditRow, 'dayOfWeek' | 'startTime' | 'endTime'>>) => {
      setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
      setError('');
    },
    []
  );

  const cycleDay = (rowId: string, current: number) => {
    const next = ((current + 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    updateRow(rowId, { dayOfWeek: next });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!courseName.trim()) { setError('Course name is required.'); return false; }
    if (!courseCode.trim())  { setError('Course code is required.'); return false; }
    if (!teacherName.trim()) { setError('Teacher name is required.'); return false; }
    if (rows.length === 0)   { setError('Add at least one class day.'); return false; }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const label = `${DAY_FULL[row.dayOfWeek]} row`;
      if (!isValidTime(row.startTime)) { setError(`${label}: start time must be HH:mm (e.g. 09:00).`); return false; }
      if (!isValidTime(row.endTime))   { setError(`${label}: end time must be HH:mm (e.g. 10:30).`); return false; }
      if (row.startTime >= row.endTime) { setError(`${label}: start must be before end.`); return false; }
    }

    // Check intra-form conflicts (same day, two rows overlap each other)
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[i].dayOfWeek === rows[j].dayOfWeek && hasOverlap(rows[i], rows[j])) {
          setError(
            `${DAY_FULL[rows[j].dayOfWeek]}: two rows in this form overlap (${rows[j].startTime}–${rows[j].endTime}).`
          );
          return false;
        }
      }
    }

    return true;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError('');

    try {
      const finalCode = courseCode.trim().toUpperCase();
      const finalName = courseName.trim();
      const finalTeacher = teacherName.trim();
      const finalRoom = room.trim() || null;

      // Build a map of affected days → their final slot arrays
      const affectedDays = new Set<number>();

      // Days of removed rows
      for (const slotId of removedSlotIds) {
        for (let day = 0; day <= 6; day++) {
          if (routines[day]?.slots?.some((s) => s.slotId === slotId)) {
            affectedDays.add(day);
          }
        }
      }

      // Days of current rows (new or modified)
      for (const row of rows) {
        affectedDays.add(row.dayOfWeek);
        // Also mark original day dirty if the user changed the day on an existing row
        if (row.existingSlotId) {
          for (let day = 0; day <= 6; day++) {
            if (routines[day]?.slots?.some((s) => s.slotId === row.existingSlotId)) {
              affectedDays.add(day);
            }
          }
        }
      }

      // For each affected day, build the new slot list
      for (const day of affectedDays) {
        // Start from the existing slots for this day
        let daySlots: Slot[] = (routines[day]?.slots ?? []).map((s) => ({ ...s }));

        // 1. Remove slots that were deleted or that are now moved to another day
        const rowExistingIds = new Set(rows.map((r) => r.existingSlotId).filter(Boolean));
        daySlots = daySlots.filter((s) => {
          if (removedSlotIds.has(s.slotId)) return false; // explicitly deleted
          // If this slot is "owned" by this courseCode and the user has a row for it
          // but on a different day now → remove it from the original day
          if (s.courseCode === finalCode && rowExistingIds.has(s.slotId)) {
            const correspondingRow = rows.find((r) => r.existingSlotId === s.slotId);
            if (correspondingRow && correspondingRow.dayOfWeek !== day) return false;
          }
          return true;
        });

        // 2. Upsert rows that belong to this day
        for (const row of rows) {
          if (row.dayOfWeek !== day) continue;
          const updatedSlot: Slot = {
            slotId: row.existingSlotId ?? uuid(),
            courseName: finalName,
            courseCode: finalCode,
            teacherName: finalTeacher,
            room: finalRoom,
            startTime: row.startTime,
            endTime: row.endTime,
          };

          if (row.existingSlotId) {
            // Update existing slot in-place
            const idx = daySlots.findIndex((s) => s.slotId === row.existingSlotId);
            if (idx !== -1) {
              daySlots[idx] = updatedSlot;
            } else {
              // Slot moved from another day → append here
              daySlots.push(updatedSlot);
            }
          } else {
            // Brand new slot
            daySlots.push(updatedSlot);
          }
        }

        // 3. Sort by startTime
        daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

        // 4. Conflict check on the final list for this day
        for (let i = 0; i < daySlots.length; i++) {
          for (let j = i + 1; j < daySlots.length; j++) {
            if (hasOverlap(daySlots[i], daySlots[j])) {
              setError(
                `${DAY_FULL[day as 0|1|2|3|4|5|6]}: "${daySlots[i].courseName}" and "${daySlots[j].courseName}" overlap (${daySlots[i].startTime}–${daySlots[i].endTime}).`
              );
              setSaving(false);
              return;
            }
          }
        }

        // 5. Write to Firestore
        await updateRoutine(day as 0 | 1 | 2 | 3 | 4 | 5 | 6, daySlots);
      }

      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete entire course ───────────────────────────────────────────────────
  const handleDeleteCourse = async () => {
    setSaving(true);
    setError('');
    try {
      const finalCode = editingCode!;
      for (let day = 0; day <= 6; day++) {
        const existing = routines[day]?.slots ?? [];
        const filtered = existing.filter((s) => s.courseCode !== finalCode);
        if (filtered.length !== existing.length) {
          await updateRoutine(day as 0 | 1 | 2 | 3 | 4 | 5 | 6, filtered);
        }
      }
      // Go back to the course list
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to delete course.');
    } finally {
      setSaving(false);
      setDeleteConfirmVisible(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* ── Nav bar ── */}
      <View style={[styles.navBar, { borderBottomColor: c.line }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Cancel">
          <Typography variant="labelMd" color={c.secondary}>Cancel</Typography>
        </TouchableOpacity>

        <Typography variant="sectionHeader">
          {isEditMode ? 'Edit Course' : 'Add Course'}
        </Typography>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.navBtn}
          accessibilityLabel="Save"
        >
          <Typography variant="labelMd" color={c.primary} style={{ fontWeight: '600' }}>
            {saving ? 'Saving…' : 'Save'}
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ── Error banner ── */}
        {error ? (
          <View style={[styles.banner, { backgroundColor: c.errorContainer }]}>
            <MaterialIcons name="error-outline" size={15} color={c.onErrorContainer} style={{ marginRight: 6 }} />
            <Typography variant="caption" color={c.onErrorContainer} style={{ flex: 1 }}>
              {error}
            </Typography>
          </View>
        ) : null}

        {/* ── Course meta ── */}
        <Input
          label="Course Name *"
          placeholder="e.g. Physics I"
          value={courseName}
          onChangeText={setCourseName}
        />
        <Input
          label="Course Code *"
          placeholder="e.g. PHY-101"
          value={courseCode}
          onChangeText={setCourseCode}
          // Lock the code in edit mode — changing it would break aggregation
          editable={!isEditMode}
          containerStyle={isEditMode ? { opacity: 0.6 } : undefined}
        />
        {isEditMode && (
          <Typography variant="caption" color={c.textTertiary} style={styles.lockedHint}>
            Course code cannot be changed (it identifies the course).
          </Typography>
        )}
        <Input
          label="Teacher Name *"
          placeholder="e.g. Dr. John Doe"
          value={teacherName}
          onChangeText={setTeacherName}
        />
        <Input
          label="Room"
          placeholder="e.g. 302 (optional)"
          value={room}
          onChangeText={setRoom}
        />

        {/* ── Weekly schedule ── */}
        <View style={styles.scheduleSection}>
          <View style={[styles.scheduleDivider, { borderTopColor: c.line }]} />
          <Typography variant="sectionHeader" color={c.secondary} style={styles.sectionLabel}>
            Weekly Schedule
          </Typography>

          {rows.map((row, idx) => (
            <ScheduleRow
              key={row.rowId}
              row={row}
              index={idx}
              canRemove={rows.length > 1}
              colors={c}
              onCycleDay={() => cycleDay(row.rowId, row.dayOfWeek)}
              onChangeStart={(v) => updateRow(row.rowId, { startTime: v })}
              onChangeEnd={(v) => updateRow(row.rowId, { endTime: v })}
              onRemove={() => removeRow(row.rowId)}
            />
          ))}

          <TouchableOpacity
            style={[styles.addRowBtn, { borderColor: c.line }]}
            onPress={addRow}
            accessibilityLabel="Add another day"
          >
            <MaterialIcons name="add" size={18} color={c.primary} />
            <Typography variant="labelMd" color={c.primary} style={{ marginLeft: 4 }}>
              Add another day
            </Typography>
          </TouchableOpacity>
        </View>

        {/* ── Delete course (edit mode only) ── */}
        {isEditMode && (
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: c.destructive }]}
            onPress={() => setDeleteConfirmVisible(true)}
            accessibilityLabel="Delete course"
          >
            <MaterialIcons name="delete-outline" size={18} color={c.destructive} />
            <Typography
              variant="labelMd"
              color={c.destructive}
              style={{ marginLeft: 6 }}
            >
              Delete Course
            </Typography>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Delete confirmation modal ── */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialog, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Typography variant="courseName" style={{ marginBottom: Spacing.sm }}>
              Delete Course?
            </Typography>
            <Typography variant="bodyMd" color={c.secondary} style={{ marginBottom: Spacing.lg }}>
              This will remove{' '}
              <Typography variant="bodyMd" style={{ fontWeight: '600' }}>
                {courseName}
              </Typography>{' '}
              from every day it appears in the schedule. This cannot be undone.
            </Typography>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, { borderColor: c.line }]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Typography variant="labelMd">Cancel</Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnDestructive, { backgroundColor: c.destructive }]}
                onPress={handleDeleteCourse}
                disabled={saving}
              >
                <Typography variant="labelMd" color="#fff">
                  {saving ? 'Deleting…' : 'Delete'}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Schedule Row ─────────────────────────────────────────────────────────────

interface ScheduleRowProps {
  row: EditRow;
  index: number;
  canRemove: boolean;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  onCycleDay: () => void;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onRemove: () => void;
}

function ScheduleRow({
  row,
  canRemove,
  colors: c,
  onCycleDay,
  onChangeStart,
  onChangeEnd,
  onRemove,
}: ScheduleRowProps) {
  const isModified =
    row.existingSlotId &&
    (row.startTime !== row.originalStart || row.endTime !== row.originalEnd);

  return (
    <View style={[rowStyles.container, { borderBottomColor: c.line }]}>
      {/* Day pill */}
      <TouchableOpacity
        style={[rowStyles.dayPill, { backgroundColor: c.accentMuted }]}
        onPress={onCycleDay}
        accessibilityLabel={`Day: ${DAY_FULL[row.dayOfWeek]}, tap to change`}
      >
        <Typography variant="labelMd" color={c.primary} style={{ fontWeight: '600' }}>
          {DAY_SHORT[row.dayOfWeek]}
        </Typography>
        <MaterialIcons name="unfold-more" size={13} color={c.primary} style={{ marginLeft: 2 }} />
      </TouchableOpacity>

      {/* Time fields */}
      <View style={rowStyles.times}>
        <Input
          label=""
          placeholder="09:00"
          value={row.startTime}
          onChangeText={onChangeStart}
          containerStyle={rowStyles.timeInput}
        />
        <Typography variant="caption" color={c.textTertiary} style={rowStyles.sep}>
          →
        </Typography>
        <Input
          label=""
          placeholder="10:30"
          value={row.endTime}
          onChangeText={onChangeEnd}
          containerStyle={rowStyles.timeInput}
        />
      </View>

      {/* Modified indicator */}
      {isModified && (
        <View style={[rowStyles.modDot, { backgroundColor: c.primary }]} />
      )}

      {/* Remove */}
      {canRemove ? (
        <TouchableOpacity onPress={onRemove} style={rowStyles.removeBtn} accessibilityLabel="Remove day">
          <MaterialIcons name="close" size={18} color={c.destructive} />
        </TouchableOpacity>
      ) : (
        <View style={rowStyles.removeBtn} />
      )}
    </View>
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
  navBtn: { minWidth: 60, paddingVertical: Spacing.xs },
  scroll: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.marginH,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 48,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radii.default,
    marginBottom: Spacing.md,
  },
  lockedHint: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Schedule section
  scheduleSection: { marginTop: Spacing.md },
  scheduleDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.lg },
  sectionLabel: { marginBottom: Spacing.md },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: Radii.default,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },

  // Delete button
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: Radii.default,
    marginTop: Spacing.xl,
  },

  // Delete confirm dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dialogBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radii.default,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnDestructive: {
    borderWidth: 0,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    minWidth: 58,
    justifyContent: 'center',
  },
  times: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timeInput: { flex: 1, marginBottom: 0 },
  sep: { marginHorizontal: 4 },
  modDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  removeBtn: { width: 28, alignItems: 'center' },
});
