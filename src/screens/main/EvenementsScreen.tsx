import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { getEvenements } from '../../services/api';
import { Evenement, EvenementsStackParamList } from '../../types';
import WilayaPickerModal from '../../components/WilayaPickerModal';

type Props = { navigation: NativeStackNavigationProp<EvenementsStackParamList, 'EvenementsList'> };

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: Colors.orange },
  publie: { label: 'À venir', color: Colors.primary },
  annule: { label: 'Annulé', color: Colors.red },
  termine: { label: 'Terminé', color: Colors.grey },
};

export default function EvenementsScreen({ navigation }: Props) {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getEvenements(1, 100);
      setEvenements(res.data.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = wilaya ? evenements.filter((e) => e.wilaya === wilaya) : evenements;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtre wilaya */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.wilayaBtn, wilaya && styles.wilayaBtnActive]}
          onPress={() => setShowWilayaPicker(true)}
        >
          <Ionicons name="location-outline" size={15} color={wilaya ? Colors.primary : Colors.grey} />
          <Text style={[styles.wilayaBtnText, wilaya && styles.wilayaBtnTextActive]} numberOfLines={1}>
            {wilaya ?? 'Toutes les wilayas'}
          </Text>
          {wilaya
            ? <Ionicons name="close-circle" size={16} color={Colors.primary} onPress={() => setWilaya(null)} />
            : <Ionicons name="chevron-down" size={15} color={Colors.grey} />
          }
        </TouchableOpacity>
        {wilaya && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={[Colors.primary]}
          />
        }
        renderItem={({ item }) => {
          const statutInfo = STATUT_CONFIG[item.statut] || STATUT_CONFIG.publie;
          const inscrits = item.participations?.length ?? 0;
          const ratio = item.nb_places_max ? inscrits / item.nb_places_max : 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EvenementDetail', { id: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="calendar" size={24} color={Colors.primary} />
                </View>
                <View style={[styles.statutBadge, { backgroundColor: statutInfo.color + '20' }]}>
                  <Text style={[styles.statutText, { color: statutInfo.color }]}>{statutInfo.label}</Text>
                </View>
              </View>

              <Text style={styles.titre}>{item.titre}</Text>

              <View style={styles.assocRow}>
                <View style={styles.assocAvatar}>
                  <Text style={styles.assocInitial}>
                    {item.association?.nom?.[0] ?? 'A'}
                  </Text>
                </View>
                <Text style={styles.assocNom}>{item.association?.nom ?? 'Association'}</Text>
                {item.valide_par_admin && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                )}
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.grey} />
                <Text style={styles.infoText}>
                  {new Date(item.date_debut).toLocaleDateString('fr-DZ', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              </View>

              {item.wilaya && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.grey} />
                  <Text style={styles.infoText}>{item.wilaya}</Text>
                </View>
              )}

              {item.nb_places_max && (
                <View style={styles.placesSection}>
                  <View style={styles.placesMeta}>
                    <Ionicons name="people-outline" size={14} color={Colors.grey} />
                    <Text style={styles.infoText}>{inscrits} / {item.nb_places_max} volontaires</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(ratio * 100, 100)}%` as any }]} />
                  </View>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.ptsBadge}>
                  <Text style={styles.ptsText}>+{item.points_participation} pts</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.grey} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.greyBorder} />
            <Text style={styles.emptyText}>
              {wilaya ? `Aucun événement à ${wilaya}` : 'Aucun événement disponible'}
            </Text>
          </View>
        }
      />

      <WilayaPickerModal
        visible={showWilayaPicker}
        selected={wilaya}
        onSelect={(nom) => setWilaya(nom)}
        onClose={() => setShowWilayaPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.greyLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.greyBorder,
  },
  wilayaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.greyBorder, backgroundColor: Colors.white,
  },
  wilayaBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  wilayaBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.grey },
  wilayaBtnTextActive: { color: Colors.primary },
  countBadge: { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statutText: { fontSize: 12, fontWeight: '700' },
  titre: { fontSize: 15, fontWeight: '700', color: Colors.primaryDark, marginBottom: 10 },
  assocRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  assocAvatar: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primaryMedium, justifyContent: 'center', alignItems: 'center',
  },
  assocInitial: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  assocNom: { fontSize: 12, color: Colors.grey, flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 12, color: Colors.grey },
  placesSection: { marginTop: 8 },
  placesMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: Colors.greyBorder, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  ptsBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  ptsText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.grey },
});
