import React from 'react';
import { View, useColorScheme, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * App Tabs Layout.
 * Hosts the 4 core tabs (Today, Schedule, Tasks/Events, Settings).
 * Renders a custom bottom navigation bar matching the 64px height and dot-indicator design.
 */
export default function AppLayout() {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColors.primary,
        tabBarInactiveTintColor: activeColors.onSurfaceVariant,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: activeColors.surface,
            borderTopColor: activeColors.line,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Today Tab */}
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="today" size={24} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: activeColors.primary }]} />}
            </View>
          ),
        }}
      />

      {/* 2. Routine (Schedule) Tab */}
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="calendar-view-day" size={24} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: activeColors.primary }]} />}
            </View>
          ),
        }}
      />

      {/* 3. Events (Tasks) Tab */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="event-note" size={24} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: activeColors.primary }]} />}
            </View>
          ),
        }}
      />

      {/* 4. Settings Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="settings" size={24} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: activeColors.primary }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tabBarLabel: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  tabBarItem: {
    height: 48,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: -6,
  },
});
