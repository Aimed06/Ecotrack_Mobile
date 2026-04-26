import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform,
  Modal, Image, Alert,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  getSignalements, getPointsCollecte,
  confirmerSignalement, ajouterPhotoResolution,
} from '../../services/api';
import { Signalement, PointCollecte } from '../../types';
import WILAYAS from '../../constants/wilayas';
import WilayaPickerModal from '../../components/WilayaPickerModal';
import TYPES_DECHET from '../../constants/typesDechet';

const FILTERS = ['Tout', 'Pollution', 'Collecte'];

const DEGRE_LABELS: Record<number, string> = {
  1: 'Très léger', 2: 'Léger', 3: 'Modéré', 4: 'Grave', 5: 'Critique',
};

const POLLUTION_COLOR: Record<number, string> = {
  1: Colors.primary,
  2: '#97C459',
  3: Colors.orange,
  4: '#E8703A',
  5: Colors.red,
};

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  publie: 'Publié',
  resolu: 'Résolu ✓',
  rejete: 'Rejeté',
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#F59E0B',
  publie: Colors.primary,
  resolu: '#3B82F6',
  rejete: Colors.red,
};

const ALGERIE_REGION: Region = {
  latitude: 28.0,
  longitude: 2.5,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [activeFilter, setActiveFilter] = useState('Tout');
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [points, setPoints] = useState<PointCollecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [degreFilter, setDegreFilter] = useState<number[]>([]);

  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toggleType  = (v: string) =>
    setTypeFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleDegre = (d: number) =>
    setDegreFilter(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  useEffect(() => {
    Promise.all([getSignalements(1, 100, 'publie'), getPointsCollecte(1, 100)])
      .then(([sRes, pRes]) => {
        setSignalements(sRes.data.data || []);
        setPoints(pRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
    } catch {}
    finally { setLocating(false); }
  };

  const selectWilaya = (nom: string | null) => {
    setWilaya(nom);
    if (!nom) {
      mapRef.current?.animateToRegion(ALGERIE_REGION, 600);
      return;
    }
    const w = WILAYAS.find((x) => x.nom === nom);
    if (!w) return;
    const delta = w.lat > 33 ? 0.7 : 2.5;
    mapRef.current?.animateToRegion({ latitude: w.lat, longitude: w.lng, latitudeDelta: delta, longitudeDelta: delta }, 700);
  };

  const handleConfirmer = async () => {
    if (!selectedSignalement) return;
    setConfirming(true);
    try {
      const res = await confirmerSignalement(selectedSignalement.id);
      const newCount = res.data.data.confirmations_count;
      setSelectedSignalement(prev => prev ? { ...prev, confirmations_count: newCount } : prev);
      setSignalements(prev =>
        prev.map(s => s.id === selectedSignalement.id ? { ...s, confirmations_count: newCount } : s)
      );
      Alert.alert('Merci !', 'Votre confirmation a été prise en compte.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Impossible de confirmer.';
      Alert.alert('Info', msg);
    } finally {
      setConfirming(false);
    }
  };

  const pickAndUploadPhoto = async (useCamera: boolean) => {
    if (!selectedSignalement) return;
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la galerie est nécessaire.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    }
    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, type: 'image/jpeg', name: 'resolution.jpg' } as any);
      const res = await ajouterPhotoResolution(selectedSignalement.id, formData);
      const newPhotos = res.data.data.photos_resolution;
      setSelectedSignalement(prev => prev ? { ...prev, photos_resolution: newPhotos } : prev);
      Alert.alert('Photo envoyée ✓', 'L\'admin examinera votre photo avant de marquer ce signalement comme résolu.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Impossible d\'envoyer la photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoResolution = () => {
    Alert.alert(
      'Ajouter une photo',
      'Comment souhaitez-vous ajouter la photo ?',
      [
        { text: '📷 Prendre une photo', onPress: () => pickAndUploadPhoto(true) },
        { text: '🖼 Choisir dans la galerie', onPress: () => pickAndUploadPhoto(false) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const showSignalements = activeFilter === 'Tout' || activeFilter === 'Pollution';
  const showCollecte = activeFilter === 'Tout' || activeFilter === 'Collecte';

  const activePoints = points.filter((p) => p.statut === 'actif');
  const filteredSignalements = signalements.filter((s) => {
    if (wilaya && s.wilaya !== wilaya) return false;
    if (degreFilter.length > 0 && !degreFilter.includes(s.degre_pollution)) return false;
    return true;
  });
  const filteredPoints = activePoints.filter((p) => {
    if (wilaya && p.wilaya !== wilaya) return false;
    if (typeFilter.length > 0 && !typeFilter.some(t => Array.isArray(p.type_dechet) && p.type_dechet.includes(t))) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, activeFilter === f && styles.pillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.pillText, activeFilter === f && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showSignalements && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChips}>
            {[1,2,3,4,5].map(d => {
              const active = degreFilter.includes(d);
              const color  = POLLUTION_COLOR[d];
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.typeChip, active && { borderColor: color, backgroundColor: color + '20' }]}
                  onPress={() => toggleDegre(d)}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={[styles.typeChipText, active && { color }]}>
                    {d} — {DEGRE_LABELS[d]}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {degreFilter.length > 0 && (
              <TouchableOpacity style={styles.typeChipClear} onPress={() => setDegreFilter([])}>
                <Text style={styles.typeChipClearText}>✕ Tout</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {showCollecte && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChips}>
            {TYPES_DECHET.map(t => {
              const active = typeFilter.includes(t.value);
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, active && { borderColor: t.color, backgroundColor: t.color + '18' }]}
                  onPress={() => toggleType(t.value)}
                >
                  <Text style={[styles.typeChipText, active && { color: t.color }]}>
                    {t.icon} {t.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {typeFilter.length > 0 && (
              <TouchableOpacity style={styles.typeChipClear} onPress={() => setTypeFilter([])}>
                <Text style={styles.typeChipClearText}>✕ Tout</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        <View style={styles.counters}>
          {showSignalements && (
            <View style={[styles.counter, { backgroundColor: Colors.orange + '20' }]}>
              <View style={[styles.counterDot, { backgroundColor: Colors.orange }]} />
              <Text style={[styles.counterText, { color: Colors.orange }]}>{filteredSignalements.length}</Text>
            </View>
          )}
          {showCollecte && (
            <View style={[styles.counter, { backgroundColor: Colors.blue + '20' }]}>
              <View style={[styles.counterDot, { backgroundColor: Colors.blue }]} />
              <Text style={[styles.counterText, { color: Colors.blue }]}>{filteredPoints.length}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.wilayaBtn, wilaya && styles.wilayaBtnActive]}
            onPress={() => setShowWilayaPicker(true)}
          >
            <Ionicons name="location-outline" size={14} color={wilaya ? Colors.primary : Colors.grey} />
            <Text style={[styles.wilayaBtnText, wilaya && styles.wilayaBtnTextActive]} numberOfLines={1}>
              {wilaya ?? 'Wilaya'}
            </Text>
            {wilaya && (
              <TouchableOpacity onPress={() => selectWilaya(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={15} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Carte */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={ALGERIE_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Markers signalements — ouvrent le modal au tap */}
          {showSignalements && filteredSignalements.map((s) => (
            <Marker
              key={`s-${s.id}`}
              coordinate={{ latitude: parseFloat(s.latitude as any), longitude: parseFloat(s.longitude as any) }}
              onPress={() => setSelectedSignalement(s)}
            >
              <View style={[styles.markerSignalement, { backgroundColor: POLLUTION_COLOR[s.degre_pollution] }]}>
                <Ionicons name="warning" size={12} color="#fff" />
              </View>
            </Marker>
          ))}

          {/* Markers points de collecte — gardent le Callout */}
          {showCollecte && filteredPoints.map((p) => (
            <Marker
              key={`p-${p.id}`}
              coordinate={{ latitude: parseFloat(p.latitude as any), longitude: parseFloat(p.longitude as any) }}
            >
              <View style={styles.markerCollecte}>
                <Ionicons name="refresh-circle" size={12} color="#fff" />
              </View>
              <Callout tooltip style={styles.callout}>
                <View style={styles.calloutInner}>
                  <View style={styles.calloutHeader}>
                    <View style={[styles.calloutDot, { backgroundColor: Colors.blue }]} />
                    <Text style={styles.calloutTitle} numberOfLines={2}>{p.nom}</Text>
                  </View>
                  {p.wilaya && <Text style={styles.calloutSub}>{p.wilaya}</Text>}
                  {p.adresse && <Text style={styles.calloutSub}>{p.adresse}</Text>}
                  {p.type_dechet?.length > 0 && (
                    <Text style={[styles.calloutBadge, { color: Colors.blue }]}>
                      {p.type_dechet.join(' · ')}
                    </Text>
                  )}
                  {p.horaires && <Text style={styles.calloutDesc}>{p.horaires}</Text>}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Bouton ma position */}
      {!loading && (
        <TouchableOpacity style={styles.locateBtn} onPress={goToMyLocation} disabled={locating}>
          {locating
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Ionicons name="locate" size={22} color={Colors.primary} />
          }
        </TouchableOpacity>
      )}

      {/* Légende */}
      {!loading && (
        <View style={styles.legend}>
          <LegendItem color={Colors.red} label="Critique (4-5)" />
          <LegendItem color={Colors.orange} label="Modéré (2-3)" />
          <LegendItem color={Colors.primary} label="Léger (1)" />
          <LegendItem color={Colors.blue} label="Point de collecte" />
        </View>
      )}

      {/* Modal détail signalement */}
      <Modal
        visible={!!selectedSignalement}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSignalement(null)}
      >
        {selectedSignalement && (
          <View style={modal.overlay}>
            <View style={modal.card}>
              {/* Header coloré */}
              <View style={[modal.header, { backgroundColor: POLLUTION_COLOR[selectedSignalement.degre_pollution] }]}>
                <View style={{ flex: 1 }}>
                  <Text style={modal.headerDegre}>
                    Degré {selectedSignalement.degre_pollution}/5 — {DEGRE_LABELS[selectedSignalement.degre_pollution]}
                  </Text>
                  <Text style={modal.headerTitre} numberOfLines={2}>{selectedSignalement.titre}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedSignalement(null)} style={modal.closeBtn}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
                {/* Meta */}
                <View style={modal.metaRow}>
                  {selectedSignalement.wilaya ? (
                    <View style={modal.metaChip}>
                      <Ionicons name="location-outline" size={13} color={Colors.grey} />
                      <Text style={modal.metaText}>
                        {selectedSignalement.wilaya}{selectedSignalement.commune ? `, ${selectedSignalement.commune}` : ''}
                      </Text>
                    </View>
                  ) : null}
                  <View style={modal.metaChip}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.grey} />
                    <Text style={modal.metaText}>
                      {new Date(selectedSignalement.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View style={[modal.statutBadge, { backgroundColor: STATUT_COLORS[selectedSignalement.statut] + '20' }]}>
                    <Text style={[modal.statutText, { color: STATUT_COLORS[selectedSignalement.statut] }]}>
                      {STATUT_LABELS[selectedSignalement.statut]}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {selectedSignalement.description ? (
                  <Text style={modal.desc}>{selectedSignalement.description}</Text>
                ) : null}

                {/* Photos originales */}
                {selectedSignalement.photos?.length > 0 && (
                  <>
                    <Text style={modal.sectionLabel}>Photos du signalement</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modal.photosRow}>
                      {selectedSignalement.photos.map((url, i) => (
                        <Image key={i} source={{ uri: url }} style={modal.photo} />
                      ))}
                    </ScrollView>
                  </>
                )}

                {/* Photos résolution */}
                {selectedSignalement.photos_resolution && selectedSignalement.photos_resolution.length > 0 && (
                  <>
                    <Text style={[modal.sectionLabel, { color: Colors.primary }]}>
                      📷 Photos après nettoyage ({selectedSignalement.photos_resolution.length})
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modal.photosRow}>
                      {selectedSignalement.photos_resolution.map((url, i) => (
                        <Image key={i} source={{ uri: url }} style={modal.photo} />
                      ))}
                    </ScrollView>
                    <Text style={modal.resolutionNote}>
                      En attente de validation par l'admin
                    </Text>
                  </>
                )}

                {/* Confirmations */}
                <View style={modal.confirmRow}>
                  <Ionicons name="people-outline" size={18} color={Colors.grey} />
                  <Text style={modal.confirmCount}>
                    {selectedSignalement.confirmations_count ?? 0} citoyen{(selectedSignalement.confirmations_count ?? 0) !== 1 ? 's' : ''} ont confirmé ce signalement
                  </Text>
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={modal.actions}>
                <TouchableOpacity
                  style={modal.btnConfirm}
                  onPress={handleConfirmer}
                  disabled={confirming}
                >
                  {confirming
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <>
                        <Ionicons name="thumbs-up-outline" size={16} color="#fff" />
                        <Text style={modal.btnConfirmText}>+1 Confirmer</Text>
                      </>
                    )
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={modal.btnPhoto}
                  onPress={handlePhotoResolution}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : (
                      <>
                        <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                        <Text style={modal.btnPhotoText}>Photo après nettoyage</Text>
                      </>
                    )
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <WilayaPickerModal
        visible={showWilayaPicker}
        selected={wilaya}
        onSelect={selectWilaya}
        onClose={() => setShowWilayaPicker(false)}
      />
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  filtersBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 56 : 56,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1, borderBottomColor: Colors.greyBorder,
  },
  filters: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.greyBorder,
  },
  pillActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  pillText: { fontSize: 13, color: Colors.grey, fontWeight: '600' },
  pillTextActive: { color: Colors.primary },
  counters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  counterDot: { width: 8, height: 8, borderRadius: 4 },
  counterText: { fontSize: 12, fontWeight: '700' },
  wilayaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1.5, borderColor: Colors.greyBorder, backgroundColor: Colors.white,
    maxWidth: 140,
  },
  wilayaBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  wilayaBtnText: { fontSize: 12, fontWeight: '600', color: Colors.grey, flex: 1 },
  wilayaBtnTextActive: { color: Colors.primary },
  typeChips:     { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  typeChip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.greyBorder, backgroundColor: Colors.white },
  typeChipText:  { fontSize: 12, fontWeight: '600', color: Colors.grey },
  typeChipClear: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.greyLight },
  typeChipClearText: { fontSize: 12, fontWeight: '700', color: Colors.grey },

  map: { flex: 1, marginTop: Platform.OS === 'ios' ? 126 : 110 },

  loadingBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
    marginTop: Platform.OS === 'ios' ? 126 : 110,
  },
  loadingText: { fontSize: 13, color: Colors.grey },

  markerSignalement: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
  },
  markerCollecte: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.blue,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
  },

  callout: { width: 200 },
  calloutInner: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
    gap: 4,
  },
  calloutHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  calloutDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3, flexShrink: 0 },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark, flex: 1 },
  calloutSub: { fontSize: 11, color: Colors.grey },
  calloutBadge: { fontSize: 11, fontWeight: '700' },
  calloutDesc: { fontSize: 11, color: Colors.grey, lineHeight: 16 },

  locateBtn: {
    position: 'absolute', right: 16, bottom: 130,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    borderWidth: 1, borderColor: Colors.greyBorder,
  },

  legend: {
    position: 'absolute', left: 16, bottom: 24,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12,
    padding: 12, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 1, borderColor: Colors.greyBorder,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: Colors.black },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 18, gap: 12,
  },
  headerDegre: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 4,
  },
  headerTitre: {
    fontSize: 18, fontWeight: '700', color: '#fff',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  body: { paddingHorizontal: 20, paddingTop: 16 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.greyLight, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  metaText: { fontSize: 12, color: Colors.grey, fontWeight: '500' },
  statutBadge: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  statutText: { fontSize: 12, fontWeight: '700' },

  desc: {
    fontSize: 14, color: Colors.black, lineHeight: 22,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.grey,
    marginBottom: 10, marginTop: 4,
  },
  photosRow: { marginBottom: 12 },
  photo: {
    width: 120, height: 90, borderRadius: 10,
    marginRight: 8, backgroundColor: Colors.greyLight,
  },
  resolutionNote: {
    fontSize: 12, color: Colors.orange, fontWeight: '600',
    marginBottom: 12, marginTop: -4,
  },

  confirmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, marginBottom: 8,
    borderTopWidth: 1, borderTopColor: Colors.greyBorder,
  },
  confirmCount: { fontSize: 13, color: Colors.grey, fontWeight: '500', flex: 1 },

  actions: {
    flexDirection: 'row', gap: 10,
    padding: 16,
    borderTopWidth: 1, borderTopColor: Colors.greyBorder,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  btnConfirm: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  btnConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  btnPhoto: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  btnPhotoText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
