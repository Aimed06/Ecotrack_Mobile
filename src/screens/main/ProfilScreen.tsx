import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProfil } from '../../services/api';
import { Badge, MainStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList>;
};

const BADGE_COLORS = ['#F59E0B', '#14B8A6', '#10B981', '#EC4899', '#8B5CF6', '#3B82F6'];

const createStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 },
  themeToggle: { padding: 8, borderRadius: 20, backgroundColor: C.greyLight },
  langBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, backgroundColor: C.greyLight,
    borderWidth: 1, borderColor: C.greyBorder,
  },
  langBtnText: { fontSize: 12, fontWeight: '800', color: C.primaryDark, letterSpacing: 0.5 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary,
  },
  editBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  avatarImg: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: Colors.white, fontSize: 26, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: C.primaryDark },
  wilaya: { fontSize: 13, color: C.grey, marginTop: 4 },
  since: { fontSize: 12, color: C.grey, marginTop: 2 },
  niveauPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', backgroundColor: C.primaryLight,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  niveauText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: C.greyLight, borderRadius: 16, padding: 16, marginBottom: 20,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: C.greyBorder },
  statValue: { fontSize: 22, fontWeight: '800', color: C.primaryDark },
  statLabel: { fontSize: 12, color: C.grey, marginTop: 2 },
  progressSection: { marginBottom: 28 },
  progressBar: {
    height: 6, backgroundColor: C.greyBorder, borderRadius: 3, marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  progressHint: { fontSize: 12, color: C.grey, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.primaryDark, marginBottom: 16 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  badgeItem: { width: '20%', alignItems: 'center', gap: 6 },
  badgeCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeCircleLocked: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.greyBorder, justifyContent: 'center', alignItems: 'center',
    opacity: 0.4,
  },
  badgeName: { fontSize: 10, color: C.primaryDark, fontWeight: '600', textAlign: 'center' },
  badgeNameLocked: { fontSize: 10, color: C.grey, textAlign: 'center' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.red,
    paddingVertical: 14,
  },
  logoutText: { color: Colors.red, fontSize: 15, fontWeight: '700' },
});

export default function ProfilScreen({ navigation }: Props) {
  const { user, signOut, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const C = useThemeColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { t, lang, cycleLang } = useI18n();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({ signalements: 0, evenements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    getProfil()
      .then((res) => {
        const data = res.data.data;
        setBadges(data?.badges || []);
        setStats({
          signalements: data?.stats?.nb_signalements || 0,
          evenements: data?.stats?.nb_participations || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pointsVersProchanNiveau = 100 - ((user?.points_total ?? 0) % 100);
  const progressRatio = ((user?.points_total ?? 0) % 100) / 100;
  const initials = user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <Ionicons name={isDark ? 'sunny' : 'moon-outline'} size={20} color={C.grey} />
            </TouchableOpacity>
            <TouchableOpacity onPress={cycleLang} style={styles.langBtn}>
              <Text style={styles.langBtnText}>{lang.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfil')} style={styles.editBtn}>
              <Ionicons name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>{t('profile.editBtn')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('EditProfil')}>
            {user?.photo_profil ? (
              <Image source={{ uri: user.photo_profil }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
          {user?.wilaya && <Text style={styles.wilaya}>{user.wilaya}</Text>}
          <Text style={styles.since}>{t('profile.memberSince')}</Text>
        </View>

        <View style={styles.niveauPill}>
          <Ionicons name="leaf" size={14} color={Colors.primary} />
          <Text style={styles.niveauText}>{t('profile.levelLabel', { n: user?.niveau ?? 1 })}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{user?.points_total ?? 0}</Text>
            <Text style={styles.statLabel}>{t('profile.statsPoints')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.signalements}</Text>
            <Text style={styles.statLabel}>{t('profile.statsReports')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.evenements}</Text>
            <Text style={styles.statLabel}>{t('profile.statsEvents')}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` as any }]} />
          </View>
          <Text style={styles.progressHint}>
            {t('profile.progressHint', { n: pointsVersProchanNiveau, next: (user?.niveau ?? 1) + 1 })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t('profile.badges')}</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.badgesGrid}>
            {badges.length > 0 ? badges.map((badge, i) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: BADGE_COLORS[i % BADGE_COLORS.length] }]}>
                  <Ionicons name="ribbon" size={22} color={Colors.white} />
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>{badge.nom}</Text>
              </View>
            )) : (
              Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.badgeItem}>
                  <View style={styles.badgeCircleLocked}>
                    <Ionicons name="lock-closed" size={18} color={C.grey} />
                  </View>
                  <Text style={styles.badgeNameLocked}>{t('profile.unknownBadge')}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert(t('profile.logoutTitle'), t('profile.logoutMsg'), [
            { text: t('profile.logoutCancel'), style: 'cancel' },
            { text: t('profile.logoutConfirm'), style: 'destructive', onPress: signOut },
          ])}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutText}>{t('profile.logoutBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
