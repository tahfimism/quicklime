import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EventCard } from '@/components/EventCard';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { EventType } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

const FILTER_TYPES: { label: string; value: EventType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Tests', value: 'test' },
  { label: 'Extra Class', value: 'extra_class' },
  { label: 'Assignments', value: 'assignment' },
  { label: 'Notices', value: 'notice' },
];

const EVENT_TYPES: EventType[] = ['test', 'extra_class', 'assignment', 'notice'];
const EVENT_TYPE_LABELS = { test: 'Test', extra_class: 'Class', assignment: 'Task', notice: 'Notice' };

/**
 * Helper to validate date format YYYY-MM-DD
 */
function isValidDate(dateStr: string) {
  const reg = /^\d{4}-\d{2}-\d{2}$/;
  if (!reg.test(dateStr)) return false;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  return true;
}

/**
 * Helper to validate time HH:mm
 */
function isValidTime(timeStr: string) {
  const reg = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  return reg.test(timeStr);
}

/**
 * Group events by date for rendering section headers.
 */
function groupEventsByDate(eventsList: any[]) {
  const groups: Record<string, any[]> = {};
  eventsList.forEach((event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
  });
  return Object.keys(groups)
    .sort()
    .map((date) => ({
      date,
      data: groups[date],
    }));
}

/**
 * Events Screen.
 * Lists all classes' events grouped chronologically.
 * Supports type filters, and provides event creation for CRs.
 */
export default function EventsScreen() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  
  const { profile } = useAuth();
  const { events, loading, addEvent } = useEvents();

  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  // Add Event Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [eventType, setEventType] = useState<EventType>('notice');
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCR = profile?.role === 'cr';

  // Filter events based on active category and memoize grouping
  const groupedEvents = useMemo(() => {
    const filteredEvents = activeFilter === 'all'
      ? events
      : events.filter((e) => e.type === activeFilter);
    return groupEventsByDate(filteredEvents);
  }, [events, activeFilter]);

  const handleOpenAddModal = () => {
    setEventType('notice');
    setTitle('');
    setCourseCode('');
    setTeacherName('');
    // Set default date as today's date YYYY-MM-DD
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    setDate(`${today.getFullYear()}-${mm}-${dd}`);
    setStartTime('');
    setEndTime('');
    setDescription('');
    setSubmitError('');
    setModalVisible(true);
  };

  const handleAddEvent = async () => {
    if (!title.trim() || !courseCode.trim() || !date.trim()) {
      setSubmitError('Title, Course Code, and Date are required.');
      return;
    }

    if (!isValidDate(date)) {
      setSubmitError('Date must be in YYYY-MM-DD format (e.g. 2026-06-15).');
      return;
    }

    if (startTime.trim() && !isValidTime(startTime)) {
      setSubmitError('Start time must be in HH:mm format (e.g. 09:30).');
      return;
    }

    if (endTime.trim() && !isValidTime(endTime)) {
      setSubmitError('End time must be in HH:mm format (e.g. 11:00).');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    
    try {
      await addEvent({
        title: title.trim(),
        type: eventType,
        courseCode: courseCode.trim().toUpperCase(),
        teacherName: teacherName.trim() || null,
        date,
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
        description: description.trim() || null,
        attachments: [],
      });
      setModalVisible(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: activeColors.line }]}>
        <Typography variant="displayWordmark" color={activeColors.primary} style={styles.brandName}>
          Quicklime
        </Typography>
        
        {isCR && (
          <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
            <MaterialIcons name="add" size={26} color={activeColors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Title */}
        <View style={styles.titleBlock}>
          <Typography variant="headlineLg">Events</Typography>
        </View>

        {/* Filter Chips Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TYPES.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter.value)}
                style={[
                  styles.filterChip,
                  isActive
                    ? { backgroundColor: activeColors.accentMuted }
                    : { backgroundColor: activeColors.surface, borderColor: activeColors.line, borderWidth: 1 }
                ]}
              >
                <Typography
                  variant="caption"
                  color={isActive ? activeColors.primary : activeColors.secondary}
                  style={[styles.filterChipText, isActive && { fontWeight: '600' }]}
                >
                  {filter.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chronological List of Events */}
        {loading ? (
          <Typography variant="bodyMd" color={activeColors.textTertiary} style={styles.emptyText}>
            Loading events...
          </Typography>
        ) : groupedEvents.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: activeColors.line }]}>
            <Typography variant="bodyMd" color={activeColors.textTertiary}>
              No events scheduled
            </Typography>
          </View>
        ) : (
          groupedEvents.map((group) => (
            <View key={group.date} style={styles.groupSection}>
              {/* Date Header Section */}
              <Typography variant="sectionHeader" color={activeColors.secondary} style={styles.groupHeader}>
                {group.date}
              </Typography>
              {group.data.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/(app)/event-detail/${event.id}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Event Modal Overlay */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: activeColors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: activeColors.line }]}>
              <Typography variant="sectionHeader">Add Workspace Event</Typography>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={submitting}>
                <MaterialIcons name="close" size={24} color={activeColors.onBackground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {submitError ? (
                <Typography variant="caption" color={activeColors.destructive} style={styles.modalErrorMsg}>
                  {submitError}
                </Typography>
              ) : null}

              {/* Event Type segmented selector */}
              <Typography variant="labelMd" style={{ marginBottom: Spacing.sm }}>Event Type *</Typography>
              <View style={styles.segmentedControl}>
                {EVENT_TYPES.map((type) => {
                  const isActive = eventType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setEventType(type)}
                      style={[
                        styles.segmentButton,
                        isActive && { backgroundColor: activeColors.primaryContainer }
                      ]}
                    >
                      <Typography
                        variant="caption"
                        color={isActive ? activeColors.background : activeColors.secondary}
                        style={{ fontWeight: '500' }}
                      >
                        {EVENT_TYPE_LABELS[type]}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Input
                label="Event Title *"
                placeholder="e.g. Mid-Term Exam"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Course Code *"
                placeholder="e.g. CS-310"
                value={courseCode}
                onChangeText={setCourseCode}
              />

              <Input
                label="Teacher Name"
                placeholder="e.g. Mr. Rahman (Optional)"
                value={teacherName}
                onChangeText={setTeacherName}
              />

              <Input
                label="Date (YYYY-MM-DD) *"
                placeholder="2026-06-15"
                value={date}
                onChangeText={setDate}
              />

              <View style={styles.timeRow}>
                <Input
                  label="Start Time (HH:mm)"
                  placeholder="09:00 (Optional)"
                  value={startTime}
                  onChangeText={setStartTime}
                  containerStyle={{ flex: 1, marginRight: Spacing.sm }}
                />

                <Input
                  label="End Time (HH:mm)"
                  placeholder="10:30 (Optional)"
                  value={endTime}
                  onChangeText={setEndTime}
                  containerStyle={{ flex: 1, marginLeft: Spacing.sm }}
                />
              </View>

              <Input
                label="Description"
                placeholder="Event details, instructions..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                inputStyle={{ height: 80, paddingTop: Spacing.sm }}
              />

              <Button
                variant="primary"
                onPress={handleAddEvent}
                loading={submitting}
                style={{ marginTop: Spacing.md }}
              >
                Add Event
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
  addButton: {
    position: 'absolute',
    right: Spacing.marginH,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    marginBottom: Spacing.md,
  },
  filterContainer: {
    marginBottom: Spacing.xl,
  },
  filterContent: {
    paddingHorizontal: Spacing.marginH,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    textTransform: 'uppercase',
  },
  groupSection: {
    paddingHorizontal: Spacing.marginH,
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    marginBottom: Spacing.md,
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
    marginHorizontal: Spacing.marginH,
    maxWidth: '90%',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    height: '90%',
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
  segmentedControl: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: Radii.default,
    padding: 2,
    marginBottom: Spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.default - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    width: '100%',
  },
});

