import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { creerSignalement } from '../../services/api';
import WilayaPickerModal from '../../components/WilayaPickerModal';

const DEGRE_COLORS = [Colors.primary, '#97C459', Colors.orange, '#E8703A', Colors.red];

type Coords = { latitude: number; longitude: number };

const createStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: C.primaryDark, paddingTop: 16, marginBottom: 20 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: C.primaryDark, marginBottom: 8 },
  labelHint: { fontWeight: '400', color: C.grey },

  photosSection: {
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    borderStyle: 'dashed', padding: 12,
  },
  photoAddPrimary: {
    width: 84, height: 84, borderRadius: 10, backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center', gap: 5,
  },
  photoAddTextPrimary: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  photoThumb: { position: 'relative' },
  photoImage: { width: 84, height: 84, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: -7, right: -7 },

  input: {
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.black,
    backgroundColor: C.surface,
  },
  textarea: { height: 100 },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.primaryLight, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: Colors.primary + '50',
  },
  locationIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
  },
  locationLabel: { fontSize: 13, fontWeight: '700', color: C.primaryDark },
  locationCoords: { fontSize: 11, color: C.primaryMedium, marginTop: 2 },
  mapPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surface, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  mapPillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  wilayaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wilayaRowActive: { borderColor: Colors.primary, backgroundColor: C.primaryLight },
  wilayaText: { flex: 1, fontSize: 14, color: C.grey },
  wilayaTextActive: { color: C.primaryDark },

  degreRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  degreSegment: { flex: 1, height: 12, borderRadius: 6 },
  degreFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  degreLabel: { fontSize: 13, fontWeight: '700' },
  critiqueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.red + '18', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  critiqueBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.red },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.greyBorder,
  },
  chipActive: { backgroundColor: C.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: C.grey, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  uploadHint: {
    textAlign: 'center', fontSize: 12, color: C.grey,
    marginTop: 10, lineHeight: 18,
  },

  mapModal: { flex: 1, backgroundColor: C.bg },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.greyBorder,
  },
  mapHeaderTitle: { fontSize: 15, fontWeight: '700', color: C.primaryDark },
  mapCancelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  mapCancelText: { fontSize: 14, fontWeight: '600', color: C.grey },
  mapConfirmBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.primary,
  },
  mapConfirmText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  mapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, backgroundColor: C.greyLight,
    borderTopWidth: 1, borderTopColor: C.greyBorder,
  },
  mapHintText: { flex: 1, fontSize: 12, color: C.grey, lineHeight: 18 },
});

export default function SignalementScreen() {
  const C = useThemeColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { t } = useI18n();

  const DEGRES = useMemo(() => [
    { value: 1, label: t('report.deg1'), color: Colors.primary },
    { value: 2, label: t('report.deg2'), color: '#97C459' },
    { value: 3, label: t('report.deg3'), color: Colors.orange },
    { value: 4, label: t('report.deg4'), color: '#E8703A' },
    { value: 5, label: t('report.deg5'), color: Colors.red },
  ], [t]);

  const TYPES_DECHET = useMemo(() => [
    t('report.wastePlastic'), t('report.wasteOrganic'), t('report.wasteGlass'),
    t('report.wasteMetal'), t('report.wasteDangerous'), t('report.wasteOther'),
  ], [t]);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [degre, setDegre] = useState(1);
  const [typesSelected, setTypesSelected] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<Coords | null>(null);
  const [wilaya, setWilaya] = useState('');
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<Coords | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(coords);
        setTempLocation(coords);
      }
    })();
  }, []);

  const pickImage = async () => {
    if (photos.length >= 5) return Alert.alert(t('report.limitTitle'), t('report.limitMsg'));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotos([...photos, result.assets[0].uri]);
  };

  const toggleType = (type: string) =>
    setTypesSelected(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const openMap = () => { setTempLocation(location); setShowMapModal(true); };
  const confirmLocation = () => { if (tempLocation) setLocation(tempLocation); setShowMapModal(false); };

  const handleSubmit = async () => {
    if (photos.length === 0) return Alert.alert(t('common.error'), t('report.errorPhoto'));
    if (!titre.trim()) return Alert.alert(t('common.error'), t('report.errorTitle2'));
    if (!wilaya) return Alert.alert(t('common.error'), t('report.errorWilaya'));
    if (!location) return Alert.alert(t('common.error'), t('report.errorLocation'));

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('description', description);
      formData.append('degre_pollution', degre.toString());
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('wilaya', wilaya);
      photos.forEach((uri, i) => {
        const filename = uri.split('/').pop() || `photo_${i}.jpg`;
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mime = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
        formData.append('photos', { uri, type: mime, name: filename.includes('.') ? filename : `${filename}.jpg` } as any);
      });
      await creerSignalement(formData);
      Alert.alert(t('common.success'), t('report.successMsg'), [
        { text: 'OK', onPress: () => { setTitre(''); setDescription(''); setPhotos([]); setDegre(1); setWilaya(''); } },
      ]);

      // =========================================================================
      // NOTIFICATION LOCALE DE CONFIRMATION — Décommenter dans un build EAS
      //
      // Envoie une notification immédiate confirmant l'envoi du signalement.
      // Notification locale uniquement (pas de serveur), trigger: null = immédiat.
      //
      // Les notifications de changement de statut (signalement résolu, validé...)
      // sont elles envoyées par le BACKEND via l'API Expo Push :
      //   POST https://exp.host/--/api/v2/push/send
      //   { to: pushToken, title: "...", body: "...", data: { type: "signalement", id: X } }
      //
      // Pour activer la confirmation locale : décommenter les lignes ci-dessous.
      // =========================================================================
      //
      // try {
      //   const Notifications = await import('expo-notifications');
      //   await Notifications.scheduleNotificationAsync({
      //     content: {
      //       title: '✅ Signalement envoyé',
      //       body: 'Votre signalement a bien été reçu. Vous serez notifié si son statut change.',
      //       data: { type: 'confirmation' },
      //     },
      //     trigger: null, // null = notification immédiate
      //   });
      // } catch {}

    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || err.response?.data?.message || err.message || 'Impossible d\'envoyer le signalement');
    } finally {
      setLoading(false);
    }
  };

  const degreInfo = DEGRES[degre - 1];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>{t('report.title')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t('report.photosLabel')} <Text style={styles.labelHint}>{t('report.photosMax')}</Text>
            </Text>
            <View style={styles.photosSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <TouchableOpacity style={styles.photoAddPrimary} onPress={pickImage}>
                  <Ionicons name="images-outline" size={26} color={Colors.primary} />
                  <Text style={styles.photoAddTextPrimary}>{t('report.addPhoto')}</Text>
                </TouchableOpacity>
                {photos.map((uri, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity style={styles.photoRemove}
                      onPress={() => setPhotos(photos.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close-circle" size={22} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('report.titleLabel')}</Text>
            <TextInput style={styles.input} placeholder={t('report.titlePlaceholder')}
              value={titre} onChangeText={setTitre} maxLength={200} placeholderTextColor={C.grey} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('report.descriptionLabel')}</Text>
            <TextInput style={[styles.input, styles.textarea]} placeholder={t('report.descPlaceholder')}
              value={description} onChangeText={setDescription} multiline numberOfLines={4}
              textAlignVertical="top" placeholderTextColor={C.grey} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('report.locationLabel')}</Text>
            <TouchableOpacity style={styles.locationCard} onPress={openMap} activeOpacity={0.8}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>
                  {location ? t('report.locationSelected') : t('report.locationWaiting')}
                </Text>
                <Text style={styles.locationCoords}>
                  {location
                    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                    : t('report.locationActivate')}
                </Text>
              </View>
              {!location
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <View style={styles.mapPill}>
                    <Ionicons name="map-outline" size={13} color={Colors.primary} />
                    <Text style={styles.mapPillText}>{t('report.modifyLocation')}</Text>
                  </View>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('report.wilayaLabel')}</Text>
            <TouchableOpacity
              style={[styles.input, styles.wilayaRow, wilaya ? styles.wilayaRowActive : null]}
              onPress={() => setShowWilayaPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={16} color={wilaya ? Colors.primary : C.grey} />
              <Text style={[styles.wilayaText, wilaya ? styles.wilayaTextActive : null]} numberOfLines={1}>
                {wilaya || t('report.wilayaPlaceholder')}
              </Text>
              {wilaya
                ? <Ionicons name="close-circle" size={17} color={Colors.primary}
                    onPress={() => setWilaya('')} />
                : <Ionicons name="chevron-down" size={16} color={C.grey} />
              }
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('report.pollutionLabel')}</Text>
            <View style={styles.degreRow}>
              {DEGRES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.degreSegment, { backgroundColor: degre >= d.value ? d.color : C.greyBorder }]}
                  onPress={() => setDegre(d.value)}
                />
              ))}
            </View>
            <View style={styles.degreFooter}>
              <Text style={[styles.degreLabel, { color: degreInfo.color }]}>
                {degre}/5 · {degreInfo.label}
              </Text>
              {degre === 5 && (
                <View style={styles.critiqueBadge}>
                  <Ionicons name="warning" size={11} color={Colors.red} />
                  <Text style={styles.critiqueBadgeText}>{t('report.criticalBadge')}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('report.wasteTypeLabel')}</Text>
            <View style={styles.chipsRow}>
              {TYPES_DECHET.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, typesSelected.includes(type) && styles.chipActive]}
                  onPress={() => toggleType(type)}
                >
                  <Text style={[styles.chipText, typesSelected.includes(type) && styles.chipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit} disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={Colors.white} />
                <Text style={styles.submitText}>{t('report.submitting')}</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>{t('report.submitBtn')}</Text>
            )}
          </TouchableOpacity>
          {loading && (
            <Text style={styles.uploadHint}>{t('report.uploadHint')}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View style={styles.mapModal}>
          <SafeAreaView edges={['top']}>
            <View style={styles.mapHeader}>
              <TouchableOpacity style={styles.mapCancelBtn} onPress={() => setShowMapModal(false)}>
                <Text style={styles.mapCancelText}>{t('report.mapCancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.mapHeaderTitle}>{t('report.mapChooseTitle')}</Text>
              <TouchableOpacity style={styles.mapConfirmBtn} onPress={confirmLocation}>
                <Text style={styles.mapConfirmText}>{t('report.mapConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: tempLocation?.latitude ?? 36.7538,
              longitude: tempLocation?.longitude ?? 3.0588,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            onPress={(e: MapPressEvent) => setTempLocation(e.nativeEvent.coordinate)}
          >
            {tempLocation && (
              <Marker
                coordinate={tempLocation}
                draggable
                onDragEnd={e => setTempLocation(e.nativeEvent.coordinate)}
                pinColor={Colors.red}
              />
            )}
          </MapView>

          <View style={styles.mapHint}>
            <Ionicons name="information-circle-outline" size={15} color={C.grey} />
            <Text style={styles.mapHintText}>{t('report.mapHint')}</Text>
          </View>
        </View>
      </Modal>

      <WilayaPickerModal
        visible={showWilayaPicker}
        selected={wilaya}
        onSelect={(nom) => setWilaya(nom ?? '')}
        onClose={() => setShowWilayaPicker(false)}
      />
    </SafeAreaView>
  );
}
