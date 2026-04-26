import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getClassement } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import WilayaPickerModal from '../../components/WilayaPickerModal';

const PERIODES: { label: string; value: string }[] = [
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Global', value: 'global' },
];
const MEDAL_COLORS = ['#F59E0B', '#9CA3AF', '#B45309'];

interface RankUser {
  id: number;
  nom: string;
  prenom: string;
  photo_profil?: string;
  points_total: number;
  niveau: number;
  wilaya?: string;
  rang: number;
}

function RankAvatar({ item, isMe }: { item: RankUser; isMe: boolean }) {
  const initials = `${item.prenom?.[0] ?? ''}${item.nom?.[0] ?? ''}`.toUpperCase();
  if (item.photo_profil) {
    return <Image source={{ uri: item.photo_profil }} style={styles.avatarImg} />;
  }
  return (
    <View style={[styles.avatar, isMe && styles.avatarMe]}>
      <Text style={[styles.avatarText, isMe && { color: Colors.white }]}>{initials}</Text>
    </View>
  );
}

export default function ClassementScreen() {
  const { user } = useAuth();
  const [classement, setClassement] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('global');
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);

  const chargerClassement = (period: string, w: string | null) => {
    setLoading(true);
    getClassement(w ?? undefined, period)
      .then((res) => setClassement(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerClassement(periode, wilaya);
  }, [periode, wilaya]);

  const myRank = classement.find((u) => u.id === user?.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Pills période + wilaya */}
      <View style={styles.periodeRow}>
        {PERIODES.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.periodePill, periode === p.value && styles.periodePillActive]}
            onPress={() => setPeriode(p.value)}
          >
            <Text style={[styles.periodeText, periode === p.value && styles.periodeTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.wilayaBtn, wilaya && styles.wilayaBtnActive]}
        onPress={() => setShowWilayaPicker(true)}
      >
        <Ionicons name="location-outline" size={14} color={wilaya ? Colors.primary : Colors.grey} />
        <Text style={[styles.wilayaBtnText, wilaya && styles.wilayaBtnTextActive]} numberOfLines={1}>
          {wilaya ?? 'Toutes les wilayas'}
        </Text>
        {wilaya
          ? <Ionicons name="close-circle" size={15} color={Colors.primary} onPress={() => setWilaya(null)} />
          : <Ionicons name="chevron-down" size={14} color={Colors.grey} />
        }
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={classement}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            myRank && myRank.rang > 10 ? (
              <View style={[styles.rankItem, styles.myRankItem]}>
                <Text style={styles.rankPos}>#{myRank.rang}</Text>
                <RankAvatar item={myRank} isMe />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankName}>{myRank.prenom} {myRank.nom}</Text>
                  <Text style={styles.rankSub}>Niv. {myRank.niveau} · {myRank.wilaya || 'Algérie'}</Text>
                </View>
                <Text style={styles.rankPts}>{myRank.points_total} pts</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isMe = item.id === user?.id;
            const isTop3 = index < 3;
            return (
              <View style={[styles.rankItem, isMe && styles.myRankItem]}>
                {isTop3 ? (
                  <Ionicons name="medal" size={24} color={MEDAL_COLORS[index]} />
                ) : (
                  <Text style={styles.rankPos}>#{item.rang || index + 1}</Text>
                )}
                <RankAvatar item={item} isMe={isMe} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankName}>{item.prenom} {item.nom}</Text>
                  <Text style={styles.rankSub}>Niv. {item.niveau} · {item.wilaya || 'Algérie'}</Text>
                </View>
                <Text style={[styles.rankPts, isTop3 && { color: Colors.primary }]}>
                  {item.points_total} pts
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={Colors.greyBorder} />
              <Text style={styles.emptyText}>
                {wilaya ? `Aucun résultat pour ${wilaya}` : 'Aucun classement disponible'}
              </Text>
            </View>
          }
        />
      )}

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
  container: { flex: 1, backgroundColor: Colors.white },
  periodeRow: {
    flexDirection: 'row', padding: 16, gap: 8, paddingTop: 24,
  },
  periodePill: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.greyBorder, alignItems: 'center',
  },
  periodePillActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  periodeText: { fontSize: 12, color: Colors.grey, fontWeight: '600' },
  periodeTextActive: { color: Colors.primary },
  wilayaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.greyBorder, backgroundColor: Colors.white,
  },
  wilayaBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  wilayaBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.grey },
  wilayaBtnTextActive: { color: Colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 60 },
  list: { padding: 16, gap: 8 },
  rankItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.greyBorder,
  },
  myRankItem: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  rankPos: { width: 28, fontSize: 14, fontWeight: '700', color: Colors.grey, textAlign: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.greyLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarMe: { backgroundColor: Colors.primary },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  rankName: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  rankSub: { fontSize: 12, color: Colors.grey, marginTop: 2 },
  rankPts: { fontSize: 14, fontWeight: '700', color: Colors.grey },
  emptyText: { fontSize: 14, color: Colors.grey },
});
