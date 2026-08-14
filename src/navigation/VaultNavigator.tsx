// ============================================================
// TrustLink — Vault Navigator
// ============================================================

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VaultScreen } from '@/screens/vault/VaultScreen';
import { DocumentDetailScreen } from '@/screens/vault/DocumentDetailScreen';
import { COLORS, TYPOGRAPHY } from '@/constants';
import { Document, Folder } from '@/types';

export type VaultStackParamList = {
  VaultRoot: { folderId: string | null; folderName: string };
  DocumentDetail: { document: Document };
};

const Stack = createStackNavigator<VaultStackParamList>();

export function VaultNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="VaultRoot"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontSize: TYPOGRAPHY.md,
          fontWeight: TYPOGRAPHY.bold,
        },
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen 
        name="VaultRoot" 
        component={VaultScreen} 
        initialParams={{ folderId: null, folderName: 'My Vault' }}
        options={({ route }) => ({ title: route.params.folderName })}
      />
      <Stack.Screen 
        name="DocumentDetail" 
        component={DocumentDetailScreen} 
        options={{ title: 'Document Details' }}
      />
    </Stack.Navigator>
  );
}
