import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EvenementsStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';
import EvenementsScreen from '../screens/main/EvenementsScreen';
import EvenementDetailScreen from '../screens/main/EvenementDetailScreen';
import QRScannerScreen from '../screens/main/QRScannerScreen';

const Stack = createNativeStackNavigator<EvenementsStackParamList>();

export default function EvenementsNavigator() {
  const C = useThemeColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: C.primaryDark },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="EvenementsList" component={EvenementsScreen} options={{ title: 'Événements' }} />
      <Stack.Screen name="EvenementDetail" component={EvenementDetailScreen} options={{ title: 'Détail' }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
