// ============================================================
// TrustLink — Main Navigator (Bottom Tab Navigation)
// Streamlined 4-Tab Navigation (Dashboard, Vault, Audit Trail, Security)
// ============================================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants';

import { useTheme } from '@/context/ThemeContext';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { VaultNavigator } from './VaultNavigator';
import { ActivityScreen } from '@/screens/activity/ActivityScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
          paddingTop: SPACING.xs,
          height: Platform.OS === 'ios' ? 84 : 64,
          elevation: 6,
          shadowColor: 'rgba(15, 23, 42, 0.08)',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 1,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: TYPOGRAPHY.semibold,
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
