import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRoutine } from '@/hooks/useRoutine';
import { Slot } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Helper to generate uuid v4 client-side
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Helper to validate HH:mm format
 */
function isValidTime(time: string) {
  const reg = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  return reg.test(time);
}

/**
 * Routine Edit Screen (CR Only).
 * Allows modifying existing slots, removing slots, adding new slots,
 * and performing client-side validation against overlaps.
 */
export default function RoutineEditScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const dayOfWeek = parseInt(params.day as string || '1') as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const { routines, updateRoutine } = useRoutine();
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Add Slot Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [modalError, setModalError] = useState('');

  // Load existing slots into local state on mount/routines load
  useEffect(() => {
    const activeRoutine = routines[dayOfWeek];
    if (activeRoutine?.slots) {
      setSlots([...activeRoutine.slots]);
    } else {
      setSlots([]);
    }
  }, [routines, dayOfWeek]);

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter((s) => s.slotId !== slotId));
    setErrorMsg('');
  };

  const handleOpenAddModal = () => {
    setCourseName('');
    setCourseCode('');
    setTeacherName('');
    setRoom('');
    setStartTime('');
    setEndTime('');
    setModalError('');
    setModalVisible(true);
  };

  const handleAddSlot = () => {
    if (!courseName.trim() || !courseCode.trim() || !teacherName.trim() || !startTime.trim() || !endTime.trim()) {
      setModalError('Please fill out all required fields.');
      return;
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      setModalError('Times must be in 24h format (e.g. 09:00, 14:30).');
      return;
    }

    if (startTime >= endTime) {
      setModalError('Start time must be before end time.');
      return;
    }

    const newSlot: Slot = {
      slotId: uuidv4(),
      courseName: courseName.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      teacherName: teacherName.trim(),
      room: room.trim() || null,
      startTime,
      endTime,
    };

    // Check overlap with existing slots in local state
    const tempSlots = [...slots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let hasOverlap = false;
    for (let i = 0; i < tempSlots.length - 1; i++) {
      if (tempSlots[i].endTime > tempSlots[i + 1].startTime) {
        hasOverlap = true;
        break;
      }
    }

    if (hasOverlap) {
      setModalError('Time conflict: This slot overlaps with another scheduled class.');
      return;
    }

    setSlots(tempSlots);
    setModalVisible(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      await updateRoutine(dayOfWeek, slots);
      router.back();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update class schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Custom Modal Nav Bar */}
      <View style={[styles.navBar, { borderBottomColor: activeColors.line }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Typography variant="labelMd" color={activeColors.secondary}>
            Cancel
          </Typography>
        </TouchableOpacity>
        
        <Typography variant="sectionHeader" style={styles.navTitle}>
          Edit {DAY_LABELS[dayOfWeek]}
        </Typography>

        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.navBtn}>
          <Typography variant="labelMd" color={activeColors.primary} style={{ fontWeight: '600' }}>
            {saving ? 'Saving...' : 'Save'}
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <Typography variant="caption" color={activeColors.destructive} style={styles.errorBanner}>
            {errorMsg}
          </Typography>
        ) : null}

        {slots.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: activeColors.line }]}>
            <Typography variant="bodyMd" color={activeColors.textTertiary}>
              No classes scheduled yet.
            </Typography>
          </View>
        ) : (
          <View style={styles.slotsList}>
            {slots.map((slot) => (
              <View
                key={slot.slotId}
                style={[styles.slotRow, { borderColor: activeColors.line, backgroundColor: activeColors.surface }]}
              >
                <View style={styles.slotTimeColumn}>
                  <Typography variant="dataMono" style={{ fontWeight: '500' }}>
                    {slot.startTime}
                  </Typography>
                  <Typography variant="caption" color={activeColors.textTertiary}>
                    {slot.endTime}
                  </Typography>
                </View>

                <View style={styles.slotDetailsColumn}>
                  <Typography variant="courseName" numberOfLines={1}>
                    {slot.courseName}
                  </Typography>
                  <Typography variant="caption" color={activeColors.secondary}>
                    {slot.courseCode} • {slot.teacherName} {slot.room ? `• Room ${slot.room}` : ''}
                  </Typography>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteSlot(slot.slotId)}
                >
                  <MaterialIcons name="delete-outline" size={22} color={activeColors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Button
          variant="secondary"
          onPress={handleOpenAddModal}
          style={styles.addBtn}
        >
          + Add slot
        </Button>
      </ScrollView>

      {/* Add Slot Modal Overlay */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: activeColors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: activeColors.line }]}>
              <Typography variant="sectionHeader">Add Routine Slot</Typography>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={activeColors.onBackground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {modalError ? (
                <Typography variant="caption" color={activeColors.destructive} style={styles.modalErrorMsg}>
                  {modalError}
                </Typography>
              ) : null}

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
              />

              <Input
                label="Teacher Name *"
                placeholder="e.g. Dr. John Doe"
                value={teacherName}
                onChangeText={setTeacherName}
              />

              <Input
                label="Room Number"
                placeholder="e.g. 402, Hall A (Optional)"
                value={room}
                onChangeText={setRoom}
              />

              <View style={styles.timeFieldsRow}>
                <Input
                  label="Start Time (HH:mm) *"
                  placeholder="09:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  containerStyle={{ flex: 1, marginRight: Spacing.sm }}
                />

                <Input
                  label="End Time (HH:mm) *"
                  placeholder="10:30"
                  value={endTime}
                  onChangeText={setEndTime}
                  containerStyle={{ flex: 1, marginLeft: Spacing.sm }}
                />
              </View>

              <Button
                variant="primary"
                onPress={handleAddSlot}
                style={{ marginTop: Spacing.lg }}
              >
                Add Slot
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.marginH,
  },
  navBtn: {
    paddingVertical: Spacing.xs,
  },
  navTitle: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.marginH,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  errorBanner: {
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  emptyContainer: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  slotsList: {
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  slotTimeColumn: {
    width: 64,
  },
  slotDetailsColumn: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
  addBtn: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    height: '80%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  modalHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginH,
    borderBottomWidth: 1,
  },
  modalContent: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.marginH,
  },
  modalErrorMsg: {
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  timeFieldsRow: {
    flexDirection: 'row',
    width: '100%',
  },
});

