import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { Colors } from '../constants/colors';
import MainNavigator from './MainNavigator';
import SignalementScreen from '../screens/main/SignalementScreen';
import ProposePointCollecteScreen from '../screens/main/ProposePointCollecteScreen';
import QRScannerScreen from '../screens/main/QRScannerScreen';
import EditProfilScreen from '../screens/main/EditProfilScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Signalement"
        component={SignalementScreen}
        options={{
          title: 'Signaler un déchet',
          headerBackTitle: 'Retour',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { fontWeight: '700', color: Colors.primaryDark },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="ProposePointCollecte"
        component={ProposePointCollecteScreen}
        options={{
          title: 'Proposer un point de collecte',
          headerBackTitle: 'Retour',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { fontWeight: '700', color: Colors.primaryDark },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen as any}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfil"
        component={EditProfilScreen}
        options={{
          title: 'Modifier le profil',
          headerBackTitle: 'Retour',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { fontWeight: '700', color: Colors.primaryDark },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
