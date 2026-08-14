// ============================================================
// TrustLink — Main Navigator (Bottom Tab Navigation)
// ============================================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { VaultNavigator } from './VaultNavigator';
import { ShareScreen } from '@/screens/share/ShareScreen';
import { ActivityScreen } from '@/screens/activity/ActivityScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
          paddingTop: SPACING.xs,
          height: Platform.OS === 'ios' ? 84 : 64,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: TYPOGRAPHY.medium,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Vault"
        component={VaultNavigator}
        options={{
          tabBarLabel: 'Vault',
          tabBarIcon: ({ color, size }) => (
            <Feather name="folder" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Share"
        component={ShareScreen}
        options={{
          tabBarLabel: 'Sharing',
          tabBarIcon: ({ color, size }) => (
            <Feather name="share-2" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Audit Trail',
          tabBarIcon: ({ color, size }) => (
            <Feather name="activity" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Security',
          tabBarIcon: ({ color, size }) => (
            <Feather name="shield" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
