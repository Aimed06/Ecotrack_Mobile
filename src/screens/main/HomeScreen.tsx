import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getEvenements } from '../../services/api';
import { Evenement } from '../../types';

const ACTION_CARDS = [
  { label: 'Signaler un déchet', icon: 'warning' as const, color: Colors.orange, screen: 'Signalement' },
  { label: 'Scanner QR événement', icon: 'qr-code' as const, color: Colors.blue, screen: 'QRScanner' },
  { label: 'Points de collecte', icon: 'location' as const, color: Colors.primary, screen: 'Carte' },
  { label: 'Mon classement', icon: 'trophy' as const, color: Colors.purple, screen: 'Classement' },
  { label: 'Proposer un point', icon: 'add-circle' as const, color: Colors.primaryMedium, screen: 'ProposePointCollecte' },
];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    refreshUser();
    getEvenements(1, 5)
      .then((res) => setEvenements(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  const initials = user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase() : 'EC';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
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

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View>
              <Text style={styles.pointsLabel}>Points total</Text>
              <Text style={styles.pointsValue}>{user?.points_total ?? 0}</Text>
              <Text style={styles.pointsDelta}>+{user?.points_semaine ?? 0} cette semaine</Text>
            </View>
            <View style={styles.pills}>
              <View style={styles.pillGreen}>
                <Text style={styles.pillText}>Niv. {user?.niveau ?? 1}</Text>
              </View>
              <View style={styles.pillAmber}>
                <Text style={styles.pillText}>Badges</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          {ACTION_CARDS.map((action) => (
            <TouchableOpacity
              key={action.label}
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

        {/* Événements proches */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Événements à venir</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Evenements')}>
            <Text style={styles.voirTout}>Voir tout</Text>
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
                  screen: 'EvenementDetail',
                  params: { id: item.id },
                })}
              >
                <View style={styles.evenementPhoto}>
                  <Ionicons name="calendar" size={28} color={Colors.primary} />
                </View>
                <View style={styles.evenementInfo}>
                  <Text style={styles.evenementTitre} numberOfLines={2}>{item.titre}</Text>
                  <Text style={styles.evenementAssoc}>{item.association?.nom}</Text>
                  <Text style={styles.evenementDate}>
                    {new Date(item.date_debut).toLocaleDateString('fr-DZ')}
                  </Text>
                  <View style={styles.ptsBadge}>
                    <Text style={styles.ptsBadgeText}>+{item.points_participation} pts</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun événement disponible</Text>
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginBottom: 20 },
  greeting: { fontSize: 14, color: Colors.grey },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  pointsCard: {
    backgroundColor: Colors.primaryLight, borderRadius: 16,
    padding: 20, marginBottom: 24,
  },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { fontSize: 13, color: Colors.primaryMedium, marginBottom: 4 },
  pointsValue: { fontSize: 36, fontWeight: '800', color: Colors.primaryDark },
  pointsDelta: { fontSize: 12, color: Colors.primaryMedium, marginTop: 2 },
  pills: { gap: 8 },
  pillGreen: {
    backgroundColor: Colors.primaryAccent, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  pillAmber: {
    backgroundColor: Colors.orangeLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark, marginBottom: 12 },
  voirTout: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 14,
    padding: 16, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.greyBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark, textAlign: 'center' },
  evenementCard: {
    width: 200, backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.greyBorder, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  evenementPhoto: {
    height: 80, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  evenementInfo: { padding: 12, gap: 4 },
  evenementTitre: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  evenementAssoc: { fontSize: 11, color: Colors.grey },
  evenementDate: { fontSize: 11, color: Colors.grey },
  ptsBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4,
  },
  ptsBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  emptyText: { color: Colors.grey, fontSize: 13, padding: 20 },
});
