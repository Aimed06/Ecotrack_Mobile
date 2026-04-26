import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { Colors } from '../constants/colors';
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import EvenementsNavigator from './EvenementsNavigator';
import ClassementScreen from '../screens/main/ClassementScreen';
import ProfilScreen from '../screens/main/ProfilScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Accueil: { active: 'home', inactive: 'home-outline' },
  Carte: { active: 'map', inactive: 'map-outline' },
  Evenements: { active: 'calendar', inactive: 'calendar-outline' },
  Classement: { active: 'trophy', inactive: 'trophy-outline' },
  Profil: { active: 'person', inactive: 'person-outline' },
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grey,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.greyBorder,
          paddingBottom: 24,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Carte" component={MapScreen} />
      <Tab.Screen name="Evenements" component={EvenementsNavigator} options={{ title: 'Événements' }} />
      <Tab.Screen name="Classement" component={ClassementScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}
