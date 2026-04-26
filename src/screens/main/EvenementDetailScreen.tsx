import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { getEvenement, inscrireEvenement } from '../../services/api';
import { Evenement, EvenementsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<EvenementsStackParamList, 'EvenementDetail'>;
  route: RouteProp<EvenementsStackParamList, 'EvenementDetail'>;
};

export default function EvenementDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [inscriLoading, setInscriLoading] = useState(false);

  useEffect(() => {
    getEvenement(id)
      .then((res) => setEvenement(res.data.data || null))
      .catch(() => Alert.alert('Erreur', 'Événement introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInscrire = async () => {
    setInscriLoading(true);
    try {
      await inscrireEvenement(id);
      Alert.alert('Inscrit !', 'Votre inscription a été enregistrée.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || err.response?.data?.message || 'Impossible de s\'inscrire');
    } finally {
      setInscriLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!evenement) return null;

  const inscrits = evenement.participations?.length ?? 0;
  const presents = evenement.participations?.filter((p: any) => p.statut === 'present').length ?? 0;
  const ratio = evenement.nb_places_max ? presents / evenement.nb_places_max : 0;
  const dateDebut = new Date(evenement.date_debut);
  const dateFin = new Date(evenement.date_fin);
  const now = Date.now();
  const dansJours = Math.ceil((dateDebut.getTime() - now) / 86400000);
  const estTermine = dateFin.getTime() < now;
  const estEnCours = dateDebut.getTime() <= now && dateFin.getTime() >= now;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header image */}
        <View style={styles.headerImage}>
          <Ionicons name="calendar" size={48} color={Colors.primary} />
          <View style={styles.ptsBadge}>
            <Text style={styles.ptsText}>+{evenement.points_participation} pts</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Titre + association */}
          <Text style={styles.titre}>{evenement.titre}</Text>
          <View style={styles.assocRow}>
            <View style={styles.assocAvatar}>
              <Text style={styles.assocInitial}>{evenement.association?.nom?.[0] ?? 'A'}</Text>
            </View>
            <Text style={styles.assocNom}>{evenement.association?.nom ?? 'Association'}</Text>
            {evenement.valide_par_admin && (
              <View style={styles.verifBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.verifText}>Vérifiée</Text>
              </View>
            )}
          </View>

          {/* Infos card */}
          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline" primary={dateDebut.toLocaleDateString('fr-DZ', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })} secondary={`${dateDebut.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })} – ${dateFin.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}`} />
            {dansJours > 0 && (
              <Text style={styles.dansJours}>Dans {dansJours} jour{dansJours > 1 ? 's' : ''}</Text>
            )}

            {evenement.wilaya && (
              <InfoRow icon="location-outline" primary={evenement.adresse || evenement.wilaya} secondary={evenement.wilaya} />
            )}

            <InfoRow icon="people-outline" primary={`${inscrits} personne${inscrits > 1 ? 's' : ''} intéressée${inscrits > 1 ? 's' : ''}`} />
            {evenement.nb_places_max && (
              <View>
                <InfoRow icon="checkmark-circle-outline" primary={`${presents} / ${evenement.nb_places_max} places confirmées sur place`} />
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(ratio * 100, 100)}%` as any }]} />
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {evenement.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{evenement.description}</Text>
            </View>
          )}

          {/* Info QR */}
          <View style={styles.qrInfoBox}>
            <Ionicons name="information-circle" size={18} color={Colors.blue} />
            <Text style={styles.qrInfoText}>
              Scannez le QR code sur place pour valider votre présence et recevoir vos points.
            </Text>
          </View>

          {/* Boutons */}
          {estTermine ? (
            <View style={styles.termineBadge}>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.grey} />
              <Text style={styles.termineText}>Cet événement est terminé</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              {!estEnCours && (
                <TouchableOpacity
                  style={[styles.btnPrimary, inscriLoading && { opacity: 0.7 }]}
                  onPress={handleInscrire}
                  disabled={inscriLoading}
                >
                  {inscriLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Je participe</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('QRScanner', { evenementId: id, titre: evenement.titre })}
              >
                <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
                <Text style={styles.btnSecondaryText}>{estEnCours ? 'Valider ma présence' : 'Scanner QR'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, primary, secondary }: { icon: any; primary: string; secondary?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.grey} />
      <View>
        <Text style={styles.infoRowPrimary}>{primary}</Text>
        {secondary && <Text style={styles.infoRowSecondary}>{secondary}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImage: {
    height: 160, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', position: 'relative'
  },
  ptsBadge: {
    position: 'absolute', bottom: 12, left: 16,
    backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  ptsText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  content: { padding: 20 },
  titre: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark, marginBottom: 12 },
  assocRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  assocAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryMedium, justifyContent: 'center', alignItems: 'center',
  },
  assocInitial: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  assocNom: { fontSize: 13, color: Colors.grey, flex: 1 },
  verifBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 14,
    padding: 16, gap: 12, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.greyBorder,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoRowPrimary: { fontSize: 13, color: Colors.black, fontWeight: '600' },
  infoRowSecondary: { fontSize: 12, color: Colors.grey, marginTop: 2 },
  dansJours: { fontSize: 12, color: Colors.orange, fontWeight: '600', marginLeft: 28 },
  progressBar: { height: 4, backgroundColor: Colors.greyBorder, borderRadius: 2, marginLeft: 28 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primaryDark, marginBottom: 8 },
  description: { fontSize: 14, color: Colors.grey, lineHeight: 22 },
  qrInfoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: Colors.blueLight,
    borderRadius: 12, padding: 14, marginBottom: 24,
    borderLeftWidth: 3, borderLeftColor: Colors.blue,
  },
  qrInfoText: { flex: 1, fontSize: 13, color: Colors.black, lineHeight: 20 },
  termineBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.greyBorder,
  },
  termineText: { fontSize: 14, color: Colors.grey, fontWeight: '600' },
  actions: { gap: 12 },
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 14,
  },
  btnSecondaryText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
});
