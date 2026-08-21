// ============================================================
// TrustLink — Vault Navigator
// ============================================================

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VaultScreen } from '@/screens/vault/VaultScreen';
import { DocumentDetailScreen } from '@/screens/vault/DocumentDetailScreen';
import { TYPOGRAPHY } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Document } from '@/types';

export type VaultStackParamList = {
  VaultRoot: { folderId: string | null; folderName: string };
  DocumentDetail: { document: Document };
};

const Stack = createStackNavigator<VaultStackParamList>();

export function VaultNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="VaultRoot"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: TYPOGRAPHY.md,
          fontWeight: TYPOGRAPHY.bold,
          color: colors.textPrimary,
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="VaultRoot" 
        component={VaultScreen} 
        initialParams={{ folderId: null, folderName: 'My Vault' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DocumentDetail" 
        component={DocumentDetailScreen} 
        options={{ 
          title: 'Document Details',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
