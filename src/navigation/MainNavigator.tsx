import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import EvenementsNavigator from './EvenementsNavigator';
import ClassementScreen from '../screens/main/ClassementScreen';
import ProfilScreen from '../screens/main/ProfilScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Accueil:    { active: 'home',     inactive: 'home-outline' },
  Carte:      { active: 'map',      inactive: 'map-outline' },
  Evenements: { active: 'calendar', inactive: 'calendar-outline' },
  Classement: { active: 'trophy',   inactive: 'trophy-outline' },
  Profil:     { active: 'person',   inactive: 'person-outline' },
};

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  const C = useThemeColors();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: C.grey,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: C.greyBorder,
          paddingTop: 4,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
          backgroundColor: C.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil"    component={HomeScreen}          options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Carte"      component={MapScreen}           options={{ title: t('tabs.map') }} />
      <Tab.Screen name="Evenements" component={EvenementsNavigator} options={{ title: t('tabs.events') }} />
      <Tab.Screen name="Classement" component={ClassementScreen}    options={{ title: t('tabs.ranking') }} />
      <Tab.Screen name="Profil"     component={ProfilScreen}        options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}
