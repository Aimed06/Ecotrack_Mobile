import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EvenementsStackParamList } from '../types';
import EvenementsScreen from '../screens/main/EvenementsScreen';
import EvenementDetailScreen from '../screens/main/EvenementDetailScreen';
import QRScannerScreen from '../screens/main/QRScannerScreen';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<EvenementsStackParamList>();

export default function EvenementsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: { fontWeight: '700' },
      

      }}
    >
      <Stack.Screen name="EvenementsList" component={EvenementsScreen} options={{ title: 'Événements' }} />
      <Stack.Screen name="EvenementDetail" component={EvenementDetailScreen} options={{ title: 'Détail' }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
