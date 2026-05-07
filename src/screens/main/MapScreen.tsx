import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform,
  Modal, Image, Alert,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useTheme, useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import {
  getSignalements, getPointsCollecte,
  confirmerSignalement, ajouterPhotoResolution,
} from '../../services/api';
import { Signalement, PointCollecte } from '../../types';
import WILAYAS from '../../constants/wilayas';
import WilayaPickerModal from '../../components/WilayaPickerModal';
import TYPES_DECHET from '../../constants/typesDechet';

const POLLUTION_COLOR: Record<number, string> = {
  1: Colors.primary,
  2: '#97C459',
  3: Colors.orange,
  4: '#E8703A',
  5: Colors.red,
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#F59E0B',
  publie: Colors.primary,
  resolu: '#3B82F6',
  rejete: Colors.red,
};

const getPointConfig = (type_dechet: string[] | null | undefined): { icon: string; color: string } => {
  if (!type_dechet || type_dechet.length === 0) return { icon: '♻️', color: '#8B5CF6' };
  const primary = TYPES_DECHET.find(t => t.value === type_dechet[0]);
  return primary ? { icon: primary.icon, color: primary.color } : { icon: '♻️', color: '#8B5CF6' };
};

const ALGERIE_REGION: Region = {
  latitude: 28.0,
  longitude: 2.5,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

const createStyles = (C: typeof Colors, isDark: boolean) => {
  const filtersBg = isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)';
  const legendBg  = isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    filtersBar: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      paddingTop: Platform.OS === 'ios' ? 56 : 56,
      paddingBottom: 10,
      backgroundColor: filtersBg,
      borderBottomWidth: 1, borderBottomColor: C.greyBorder,
    },
    filters: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
    pill: {
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5, borderColor: C.greyBorder, backgroundColor: C.surface,
    },
    pillActive: { backgroundColor: C.primaryLight, borderColor: Colors.primary },
    pillText: { fontSize: 13, color: C.grey, fontWeight: '600' },
    pillTextActive: { color: Colors.primary },
    counters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
    counter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    counterDot: { width: 8, height: 8, borderRadius: 4 },
    counterText: { fontSize: 12, fontWeight: '700' },
    wilayaBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto',
      borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1.5, borderColor: C.greyBorder, backgroundColor: C.surface,
      maxWidth: 140,
    },
    wilayaBtnActive: { borderColor: Colors.primary, backgroundColor: C.primaryLight },
    wilayaBtnText: { fontSize: 12, fontWeight: '600', color: C.grey, flex: 1 },
    wilayaBtnTextActive: { color: Colors.primary },
    typeChips:     { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
    typeChip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.greyBorder, backgroundColor: C.surface },
    typeChipText:  { fontSize: 12, fontWeight: '600', color: C.grey },
    typeChipClear: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.greyLight },
    typeChipClearText: { fontSize: 12, fontWeight: '700', color: C.grey },

    map: { flex: 1, marginTop: Platform.OS === 'ios' ? 126 : 110 },

    loadingBox: {
      flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
      marginTop: Platform.OS === 'ios' ? 126 : 110,
    },
    loadingText: { fontSize: 13, color: C.grey },

    markerSignalement: {
      width: 28, height: 28, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: '#fff',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
    },
    markerCollecte: {
      width: 32, height: 32, borderRadius: 16,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: '#fff',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
    },
    markerEmoji: { fontSize: 14, lineHeight: 16 },

    locateBtn: {
      position: 'absolute', right: 16, bottom: 130,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.surface,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
      borderWidth: 1, borderColor: C.greyBorder,
    },

    legend: {
      position: 'absolute', left: 16, bottom: 24,
      backgroundColor: legendBg, borderRadius: 12,
      padding: 12, gap: 6,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
      borderWidth: 1, borderColor: C.greyBorder,
    },
    legendSep: { height: 1, backgroundColor: C.greyBorder, marginVertical: 2 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    legendDotEmoji: { fontSize: 9 },
    legendLabel: { fontSize: 11, color: C.black },

    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    card: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: '85%', overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15, shadowRadius: 12, elevation: 20,
    },
    header: {
      flexDirection: 'row', alignItems: 'flex-start',
      paddingHorizontal: 20, paddingVertical: 18, gap: 12,
    },
    headerDegre: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
    headerTitre: { fontSize: 18, fontWeight: '700', color: '#fff' },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center', alignItems: 'center', marginTop: 2,
    },
    body: { paddingHorizontal: 20, paddingTop: 16 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    metaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: C.greyLight, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    metaText: { fontSize: 12, color: C.grey, fontWeight: '500' },
    statutBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    statutText: { fontSize: 12, fontWeight: '700' },
    desc: { fontSize: 14, color: C.black, lineHeight: 22, marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    infoText: { fontSize: 14, color: C.black, flex: 1, lineHeight: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: C.grey, marginBottom: 10, marginTop: 4 },
    photosRow: { marginBottom: 12 },
    photo: { width: 120, height: 90, borderRadius: 10, marginRight: 8, backgroundColor: C.greyLight },
    resolutionNote: { fontSize: 12, color: Colors.orange, fontWeight: '600', marginBottom: 12, marginTop: -4 },
    confirmRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 14, marginBottom: 8,
      borderTopWidth: 1, borderTopColor: C.greyBorder,
    },
    confirmCount: { fontSize: 13, color: C.grey, fontWeight: '500', flex: 1 },
    actions: {
      flexDirection: 'row', gap: 10, padding: 16,
      borderTopWidth: 1, borderTopColor: C.greyBorder,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    btnConfirm: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, height: 48, borderRadius: 14, backgroundColor: Colors.primary,
    },
    btnConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    btnPhoto: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, height: 48, borderRadius: 14,
      backgroundColor: C.primaryLight, borderWidth: 1.5, borderColor: Colors.primary,
    },
    btnPhotoText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  });
};

export default function MapScreen() {
  const C = useThemeColors();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const { t } = useI18n();

  const FILTERS = useMemo(() => [
    t('map.filterAll'), t('map.filterPollution'), t('map.filterCollect'),
  ], [t]);

  const DEGRE_LABELS = useMemo(() => ({
    1: t('report.deg1'), 2: t('report.deg2'), 3: t('report.deg3'),
    4: t('report.deg4'), 5: t('report.deg5'),
  } as Record<number, string>), [t]);

  const STATUT_LABELS = useMemo(() => ({
    en_attente: t('map.filterAll') === 'Tout' ? 'En attente' : t('events.statusPending'),
    publie:     t('events.statusUpcoming'),
    resolu:     'Résolu ✓',
    rejete:     t('events.statusCancelled') === 'Annulé' ? 'Rejeté' : t('events.statusCancelled'),
  } as Record<string, string>), [t]);

  const mapRef = useRef<MapView>(null);
  const [activeFilter, setActiveFilter] = useState(t('map.filterCollect'));
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [points, setPoints] = useState<PointCollecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [degreFilter, setDegreFilter] = useState<number[]>([]);

  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PointCollecte | null>(null);
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
      Alert.alert(t('map.confirmThankTitle'), t('map.confirmThankMsg'));
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Impossible de confirmer.';
      Alert.alert(t('common.info'), msg);
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
        Alert.alert(t('common.permissionDenied'), t('map.errorCamera'));
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionDenied'), t('map.errorGallery'));
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
      Alert.alert(t('map.photoSentTitle'), t('map.photoSentMsg'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || 'Impossible d\'envoyer la photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoResolution = () => {
    Alert.alert(
      t('map.addPhotoTitle'),
      t('map.addPhotoMsg'),
      [
        { text: t('map.takePhoto'), onPress: () => pickAndUploadPhoto(true) },
        { text: t('map.chooseGallery'), onPress: () => pickAndUploadPhoto(false) },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const filterAll = t('map.filterAll');
  const filterPollution = t('map.filterPollution');
  const filterCollect = t('map.filterCollect');

  const showSignalements = activeFilter === filterAll || activeFilter === filterPollution;
  const showCollecte = activeFilter === filterAll || activeFilter === filterCollect;

  const activePoints = points.filter((p) => p.statut === 'actif');
  const filteredSignalements = signalements.filter((s) => {
    if (wilaya && s.wilaya !== wilaya) return false;
    if (degreFilter.length > 0 && !degreFilter.includes(s.degre_pollution)) return false;
    return true;
  });
  const filteredPoints = activePoints.filter((p) => {
    if (wilaya && p.wilaya !== wilaya) return false;
    if (typeFilter.length > 0 && !typeFilter.some(tv => Array.isArray(p.type_dechet) && p.type_dechet.includes(tv))) return false;
    return true;
  });

  return (
    <View style={styles.container}>
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
                <Text style={styles.typeChipClearText}>✕ {filterAll}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {showCollecte && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChips}>
            {TYPES_DECHET.map(td => {
              const active = typeFilter.includes(td.value);
              return (
                <TouchableOpacity
                  key={td.value}
                  style={[styles.typeChip, active && { borderColor: td.color, backgroundColor: td.color + '18' }]}
                  onPress={() => toggleType(td.value)}
                >
                  <Text style={[styles.typeChipText, active && { color: td.color }]}>
                    {td.icon} {td.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {typeFilter.length > 0 && (
              <TouchableOpacity style={styles.typeChipClear} onPress={() => setTypeFilter([])}>
                <Text style={styles.typeChipClearText}>✕ {filterAll}</Text>
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
            <Ionicons name="location-outline" size={14} color={wilaya ? Colors.primary : C.grey} />
            <Text style={[styles.wilayaBtnText, wilaya && styles.wilayaBtnTextActive]} numberOfLines={1}>
              {wilaya ?? t('map.wilaya')}
            </Text>
            {wilaya && (
              <TouchableOpacity onPress={() => selectWilaya(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={15} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>{t('map.loading')}</Text>
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

          {showCollecte && filteredPoints.map((p) => {
            const cfg = getPointConfig(p.type_dechet);
            return (
              <Marker
                key={`p-${p.id}`}
                coordinate={{ latitude: parseFloat(p.latitude as any), longitude: parseFloat(p.longitude as any) }}
                onPress={() => setSelectedPoint(p)}
              >
                <View style={[styles.markerCollecte, { backgroundColor: cfg.color }]}>
                  <Text style={styles.markerEmoji}>{cfg.icon}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {!loading && (
        <TouchableOpacity style={styles.locateBtn} onPress={goToMyLocation} disabled={locating}>
          {locating
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Ionicons name="locate" size={22} color={Colors.primary} />
          }
        </TouchableOpacity>
      )}

      {!loading && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.red }]} />
            <Text style={styles.legendLabel}>{t('map.legendCritical')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.orange }]} />
            <Text style={styles.legendLabel}>{t('map.legendModerate')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendLabel}>{t('map.legendLight')}</Text>
          </View>
          <View style={styles.legendSep} />
          {TYPES_DECHET.map(td => (
            <View key={td.value} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: td.color }]}>
                <Text style={styles.legendDotEmoji}>{td.icon}</Text>
              </View>
              <Text style={styles.legendLabel}>{td.value}</Text>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={!!selectedSignalement}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSignalement(null)}
      >
        {selectedSignalement && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <View style={[styles.header, { backgroundColor: POLLUTION_COLOR[selectedSignalement.degre_pollution] }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerDegre}>
                    {t('map.degreeHeader', { n: selectedSignalement.degre_pollution, label: DEGRE_LABELS[selectedSignalement.degre_pollution] })}
                  </Text>
                  <Text style={styles.headerTitre} numberOfLines={2}>{selectedSignalement.titre}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedSignalement(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.metaRow}>
                  {selectedSignalement.wilaya ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="location-outline" size={13} color={C.grey} />
                      <Text style={styles.metaText}>
                        {selectedSignalement.wilaya}{selectedSignalement.commune ? `, ${selectedSignalement.commune}` : ''}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={13} color={C.grey} />
                    <Text style={styles.metaText}>
                      {new Date(selectedSignalement.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[selectedSignalement.statut] + '20' }]}>
                    <Text style={[styles.statutText, { color: STATUT_COLORS[selectedSignalement.statut] }]}>
                      {STATUT_LABELS[selectedSignalement.statut] || selectedSignalement.statut}
                    </Text>
                  </View>
                </View>

                {selectedSignalement.description ? (
                  <Text style={styles.desc}>{selectedSignalement.description}</Text>
                ) : null}

                {selectedSignalement.photos?.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>{t('map.photosSection')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
                      {selectedSignalement.photos.filter(Boolean).map((url, i) => (
                        <Image key={i} source={{ uri: url }} style={styles.photo} />
                      ))}
                    </ScrollView>
                  </>
                )}

                {selectedSignalement.photos_resolution?.filter((e: any) => e?.url).length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: Colors.primary }]}>
                      {t('map.photosAfter', { n: selectedSignalement.photos_resolution.filter((e: any) => e?.url).length })}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
                      {selectedSignalement.photos_resolution.filter((e: any) => e?.url).map((entry: any, i: number) => (
                        <Image key={i} source={{ uri: entry.url }} style={styles.photo} />
                      ))}
                    </ScrollView>
                    <Text style={styles.resolutionNote}>{t('map.pendingValidation')}</Text>
                  </>
                )}

                <View style={styles.confirmRow}>
                  <Ionicons name="people-outline" size={18} color={C.grey} />
                  <Text style={styles.confirmCount}>
                    {t('map.confirmCount', {
                      n: selectedSignalement.confirmations_count ?? 0,
                      citizen: (selectedSignalement.confirmations_count ?? 0) !== 1 ? t('map.citizenPlural') : t('map.citizenSingular'),
                    })}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirmer} disabled={confirming}>
                  {confirming
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <>
                        <Ionicons name="thumbs-up-outline" size={16} color="#fff" />
                        <Text style={styles.btnConfirmText}>{t('map.confirmBtn')}</Text>
                      </>
                    )
                  }
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPhoto} onPress={handlePhotoResolution} disabled={uploadingPhoto}>
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : (
                      <>
                        <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                        <Text style={styles.btnPhotoText}>{t('map.addPhotoBtn')}</Text>
                      </>
                    )
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={!!selectedPoint}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPoint(null)}
      >
        {selectedPoint && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <View style={[styles.header, { backgroundColor: Colors.blue }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerDegre}>{t('map.collectPoint')}</Text>
                  <Text style={styles.headerTitre} numberOfLines={2}>{selectedPoint.nom}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.metaRow}>
                  {selectedPoint.wilaya ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="location-outline" size={13} color={C.grey} />
                      <Text style={styles.metaText}>{selectedPoint.wilaya}</Text>
                    </View>
                  ) : null}
                  {selectedPoint.type_dechet?.length > 0 && (
                    <View style={[styles.metaChip, { backgroundColor: Colors.blue + '18' }]}>
                      <Text style={[styles.metaText, { color: Colors.blue, fontWeight: '700' }]}>
                        {selectedPoint.type_dechet.join(' · ')}
                      </Text>
                    </View>
                  )}
                </View>
                {selectedPoint.adresse ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="map-outline" size={16} color={C.grey} />
                    <Text style={styles.infoText}>{selectedPoint.adresse}</Text>
                  </View>
                ) : null}
                {selectedPoint.horaires ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={C.grey} />
                    <Text style={styles.infoText}>{selectedPoint.horaires}</Text>
                  </View>
                ) : null}
                {selectedPoint.description ? (
                  <Text style={[styles.desc, { marginTop: 12 }]}>{selectedPoint.description}</Text>
                ) : null}
              </ScrollView>
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
