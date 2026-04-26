import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getProfil } from '../../services/api';
import { Badge, MainStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList>;
};

const BADGE_COLORS = ['#F59E0B', '#14B8A6', '#10B981', '#EC4899', '#8B5CF6', '#3B82F6'];

export default function ProfilScreen({ navigation }: Props) {
  const { user, signOut, refreshUser } = useAuth();
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
          signalements: data?.signalements_count || 0,
          evenements: data?.participations_count || 0,
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
        {/* Header profil */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfil')} style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
            <Text style={styles.editBtnText}>Modifier</Text>
          </TouchableOpacity>

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
          <Text style={styles.since}>Membre depuis 2025</Text>
        </View>

        {/* Pill niveau */}
        <View style={styles.niveauPill}>
          <Ionicons name="leaf" size={14} color={Colors.primary} />
          <Text style={styles.niveauText}>Niveau {user?.niveau ?? 1} · Éco-acteur</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCol label="Points" value={user?.points_total ?? 0} />
          <View style={styles.statDivider} />
          <StatCol label="Signalements" value={stats.signalements} />
          <View style={styles.statDivider} />
          <StatCol label="Événements" value={stats.evenements} />
        </View>

        {/* Barre de progression niveau */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` as any }]} />
          </View>
          <Text style={styles.progressHint}>
            Encore {pointsVersProchanNiveau} points pour le Niveau {(user?.niveau ?? 1) + 1}
          </Text>
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges</Text>
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
              // Badges verrouillés placeholder
              Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.badgeItem}>
                  <View style={styles.badgeCircleLocked}>
                    <Ionicons name="lock-closed" size={18} color={Colors.grey} />
                  </View>
                  <Text style={styles.badgeNameLocked}>Inconnu</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnecter', style: 'destructive', onPress: signOut },
          ])}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCol({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-end', marginBottom: 12,
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
  name: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark },
  wilaya: { fontSize: 13, color: Colors.grey, marginTop: 4 },
  since: { fontSize: 12, color: Colors.grey, marginTop: 2 },
  niveauPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', backgroundColor: Colors.primaryLight,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  niveauText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.greyLight, borderRadius: 16, padding: 16, marginBottom: 20,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: Colors.greyBorder },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark },
  statLabel: { fontSize: 12, color: Colors.grey, marginTop: 2 },
  progressSection: { marginBottom: 28 },
  progressBar: {
    height: 6, backgroundColor: Colors.greyBorder, borderRadius: 3, marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  progressHint: { fontSize: 12, color: Colors.grey, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark, marginBottom: 16 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  badgeItem: { width: '20%', alignItems: 'center', gap: 6 },
  badgeCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeCircleLocked: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.greyBorder, justifyContent: 'center', alignItems: 'center',
    opacity: 0.4,
  },
  badgeName: { fontSize: 10, color: Colors.primaryDark, fontWeight: '600', textAlign: 'center' },
  badgeNameLocked: { fontSize: 10, color: Colors.grey, textAlign: 'center' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.red,
    paddingVertical: 14,
  },
  logoutText: { color: Colors.red, fontSize: 15, fontWeight: '700' },
});
