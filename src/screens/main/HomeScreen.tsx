import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { getEvenements } from '../../services/api';
import { Evenement } from '../../types';

const createStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginBottom: 20 },
  greeting: { fontSize: 14, color: C.grey },
  userName: { fontSize: 22, fontWeight: '800', color: C.primaryDark },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  pointsCard: {
    backgroundColor: C.primaryLight, borderRadius: 16,
    padding: 20, marginBottom: 24,
  },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { fontSize: 13, color: C.primaryMedium, marginBottom: 4 },
  pointsValue: { fontSize: 36, fontWeight: '800', color: C.primaryDark },
  pointsDelta: { fontSize: 12, color: C.primaryMedium, marginTop: 2 },
  pills: { gap: 8 },
  pillGreen: {
    backgroundColor: Colors.primaryAccent, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  pillAmber: {
    backgroundColor: Colors.orangeLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: C.primaryDark },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.primaryDark, marginBottom: 12 },
  voirTout: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: {
    width: '47%', backgroundColor: C.surface, borderRadius: 14,
    padding: 16, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: C.greyBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: C.primaryDark, textAlign: 'center' },
  evenementCard: {
    width: 190, backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.greyBorder, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  evenementPhoto: { width: '100%', height: 110 },
  evenementPhotoPlaceholder: {
    width: '100%', height: 110,
    backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  evenementInfo: { padding: 10, gap: 5 },
  evenementTitre: { fontSize: 13, fontWeight: '700', color: C.primaryDark, lineHeight: 18 },
  evenementAssoc: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  evenementDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  evenementDate: { fontSize: 11, color: C.grey },
  evenementDateSep: { fontSize: 11, color: C.grey },
  emptyText: { color: C.grey, fontSize: 13, padding: 20 },
  assocBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    marginHorizontal: 20, marginTop: 28, marginBottom: 10,
    backgroundColor: C.primaryLight, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.primaryAccent,
  },
  assocBannerIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  assocBannerBody: { flex: 1, gap: 6 },
  assocBannerTitle: { fontSize: 14, fontWeight: '800', color: C.primaryDark },
  assocBannerSub: { fontSize: 12, color: C.primaryMedium, lineHeight: 18 },
  assocBannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: C.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.primaryAccent,
  },
  assocBannerBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const C = useThemeColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { t } = useI18n();
  const navigation = useNavigation<any>();
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);

  const ACTION_CARDS = useMemo(() => [
    { label: t('home.reportWaste'),   icon: 'warning' as const,   color: Colors.orange,  screen: 'Signalement' },
    { label: t('home.scanQR'),        icon: 'qr-code' as const,   color: Colors.blue,    screen: 'QRScanner' },
    { label: t('home.collectPoints'), icon: 'location' as const,  color: Colors.primary, screen: 'Carte' },
    { label: t('home.myRanking'),     icon: 'trophy' as const,    color: Colors.purple,  screen: 'Classement' },
  ], [t]);

  useFocusEffect(useCallback(() => {
    refreshUser();
    getEvenements(1)
      .then((res) => setEvenements(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  const initials = user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase() : 'EC';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{t('home.greeting')}</Text>
              <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
            </View>
            {user?.photo_profil ? (
              <Image source={{ uri: user.photo_profil }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.pointsCard}>
            <View style={styles.pointsRow}>
              <View>
                <Text style={styles.pointsLabel}>{t('home.totalPoints')}</Text>
                <Text style={styles.pointsValue}>{user?.points_total ?? 0}</Text>
                <Text style={styles.pointsDelta}>{t('home.pointsWeek', { n: user?.points_semaine ?? 0 })}</Text>
              </View>
              <View style={styles.pills}>
                <View style={styles.pillGreen}>
                  <Text style={styles.pillText}>{t('home.level', { n: user?.niveau ?? 1 })}</Text>
                </View>
                <View style={styles.pillAmber}>
                  <Text style={styles.pillText}>{t('home.badges')}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {ACTION_CARDS.map((action) => (
              <TouchableOpacity
                key={action.screen}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.upcomingEvents')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Evenements')}>
              <Text style={styles.voirTout}>{t('home.seeAll' as any) || t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            data={evenements}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.evenementCard}
                onPress={() => navigation.navigate('Evenements', {
                  screen: 'EvenementsList',
                  params: { openId: item.id },
                })}
              >
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.evenementPhoto} />
                ) : (
                  <View style={styles.evenementPhotoPlaceholder}>
                    <Ionicons name="leaf" size={32} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.evenementInfo}>
                  <Text style={styles.evenementTitre} numberOfLines={2}>{item.titre}</Text>
                  {item.association?.nom ? (
                    <Text style={styles.evenementAssoc} numberOfLines={1}>{item.association.nom}</Text>
                  ) : null}
                  <View style={styles.evenementDateRow}>
                    <Ionicons name="calendar-outline" size={12} color={C.grey} />
                    <Text style={styles.evenementDate}>
                      {new Date(item.date_debut).toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' })}
                    </Text>
                    {item.wilaya ? (
                      <>
                        <Text style={styles.evenementDateSep}>·</Text>
                        <Text style={styles.evenementDate}>{item.wilaya}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('home.noEvents')}</Text>
            }
          />
        )}

        <View style={styles.assocBanner}>
          <View style={styles.assocBannerIcon}>
            <Ionicons name="business" size={28} color={Colors.primary} />
          </View>
          <View style={styles.assocBannerBody}>
            <Text style={styles.assocBannerTitle}>{t('home.assocBannerTitle')}</Text>
            <Text style={styles.assocBannerSub}>{t('home.assocBannerText')}</Text>
            <TouchableOpacity
              style={styles.assocBannerBtn}
              onPress={() => navigation.navigate('AssocRegister')}
            >
              <Text style={styles.assocBannerBtnText}>{t('home.assocBannerBtn')}</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
