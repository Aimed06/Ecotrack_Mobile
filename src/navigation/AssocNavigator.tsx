import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AssocStackParamList } from '../types';
import AssocProfilScreen from '../screens/assoc/AssocProfilScreen';

const Stack = createNativeStackNavigator<AssocStackParamList>();

export default function AssocNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssocProfil" component={AssocProfilScreen} />
    </Stack.Navigator>
  );
}
