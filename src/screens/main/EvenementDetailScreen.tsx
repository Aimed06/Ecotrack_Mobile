import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, Image, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { getEvenement, inscrireEvenement } from '../../services/api';
import { Evenement, EvenementsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<EvenementsStackParamList, 'EvenementDetail'>;
  route: RouteProp<EvenementsStackParamList, 'EvenementDetail'>;
};

const PHOTO_PAGE_W = Dimensions.get('window').width - 48;

const chunkPhotos = (photos: string[]): string[][] => {
  const pages: string[][] = [];
  for (let i = 0; i < photos.length; i += 3) pages.push(photos.slice(i, i + 3));
  return pages;
};

const createStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImage: { width: '100%', height: 220 },
  headerImagePlaceholder: {
    height: 180, backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 20 },
  titre: { fontSize: 20, fontWeight: '800', color: C.primaryDark, marginBottom: 12 },
  assocRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  assocAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryAccent, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  assocInitial: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  assocNom: { fontSize: 13, color: C.grey, flex: 1 },
  verifBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  infoCard: {
    backgroundColor: C.backgroundSecondary, borderRadius: 14,
    padding: 16, gap: 12, marginBottom: 20,
    borderWidth: 1, borderColor: C.greyBorder,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoRowPrimary: { fontSize: 13, color: C.black, fontWeight: '600' },
  infoRowSecondary: { fontSize: 12, color: C.grey, marginTop: 2 },
  dansJours: { fontSize: 12, color: Colors.orange, fontWeight: '600', marginLeft: 28 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.primaryDark, marginBottom: 8 },
  description: { fontSize: 14, color: C.grey, lineHeight: 22 },
  qrInfoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: C.blueLight,
    borderRadius: 12, padding: 14, marginBottom: 24,
    borderLeftWidth: 3, borderLeftColor: Colors.blue,
  },
  qrInfoText: { flex: 1, fontSize: 13, color: C.black, lineHeight: 20 },
  termineBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, backgroundColor: C.backgroundSecondary,
    borderRadius: 14, borderWidth: 1, borderColor: C.greyBorder,
  },
  termineText: { fontSize: 14, color: C.grey, fontWeight: '600' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12,
    alignItems: 'center', maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.greyBorder, borderRadius: 2, marginBottom: 20 },
  modalLogoWrap: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden', borderWidth: 2, borderColor: C.greyBorder, marginBottom: 12,
  },
  modalLogoImg: { width: '100%', height: '100%' },
  modalLogoFallback: {
    width: '100%', height: '100%', backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  modalLogoInitial: { fontSize: 30, fontWeight: '800', color: Colors.primary },
  modalNom: { fontSize: 18, fontWeight: '800', color: C.primaryDark, marginBottom: 20, textAlign: 'center' },
  modalSection: { marginBottom: 18, width: '100%' },
  modalSectionTitle: { fontSize: 11, fontWeight: '800', color: C.grey, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  modalSectionText: { fontSize: 14, color: C.black, lineHeight: 21 },
  modalContactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  modalCloseBtn: {
    marginTop: 12, backgroundColor: C.greyLight, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 40,
  },
  modalCloseBtnText: { fontSize: 14, fontWeight: '700', color: C.grey },
  photoPage: { width: PHOTO_PAGE_W, flexDirection: 'row', gap: 6 },
  photoThumbWrap: { flex: 1 },
  photoThumb: { aspectRatio: 1, borderRadius: 8 },
  photoDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.greyBorder },
  photoDotActive: { width: 16, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  viewerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  viewerImage: { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.75 },
  viewerClose: {
    position: 'absolute', top: 48, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
});

export default function EvenementDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const C = useThemeColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { t } = useI18n();

  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [inscriLoading, setInscriLoading] = useState(false);
  const [assocModal, setAssocModal] = useState<Evenement['association'] | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [currentPhotoPage, setCurrentPhotoPage] = useState(0);

  useEffect(() => {
    getEvenement(id)
      .then((res) => setEvenement(res.data.data || null))
      .catch(() => Alert.alert(t('common.error'), t('eventDetail.errorNotFound')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInscrire = async () => {
    setInscriLoading(true);
    try {
      await inscrireEvenement(id);
      Alert.alert(t('eventDetail.registeredTitle'), t('eventDetail.registeredMsg'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || err.response?.data?.message || 'Impossible de s\'inscrire');
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

  const dateDebut = new Date(evenement.date_debut);
  const dateFin = new Date(evenement.date_fin);
  const now = Date.now();
  const dansJours = Math.ceil((dateDebut.getTime() - now) / 86400000);
  const estTermine = dateFin.getTime() < now;
  const estEnCours = dateDebut.getTime() <= now && dateFin.getTime() >= now;
  const dayLabel = dansJours > 1 ? t('eventDetail.dayPlural') : t('eventDetail.daySingular');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {evenement.photo ? (
          <Image source={{ uri: evenement.photo }} style={styles.headerImage} resizeMode="cover" />
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Ionicons name="leaf" size={52} color={Colors.primary} />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.titre}>{evenement.titre}</Text>
          <TouchableOpacity style={styles.assocRow} onPress={() => { setAssocModal(evenement.association); setCurrentPhotoPage(0); }}>
            {evenement.association?.logo ? (
              <Image source={{ uri: evenement.association.logo }} style={styles.assocAvatar} />
            ) : (
              <View style={styles.assocAvatar}>
                <Text style={styles.assocInitial}>{evenement.association?.nom?.[0] ?? 'A'}</Text>
              </View>
            )}
            <Text style={styles.assocNom}>{evenement.association?.nom ?? t('common.association')}</Text>
            {evenement.valide_par_admin && (
              <View style={styles.verifBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.verifText}>{t('common.verified')}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              primary={dateDebut.toLocaleDateString('fr-DZ', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
              secondary={`${dateDebut.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })} – ${dateFin.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}`}
              styles={styles}
              C={C}
            />
            {dansJours > 0 && (
              <Text style={styles.dansJours}>{t('eventDetail.dansJours', { n: dansJours, day: dayLabel })}</Text>
            )}
            {evenement.wilaya && (
              <InfoRow icon="location-outline" primary={evenement.adresse || evenement.wilaya} secondary={evenement.wilaya} styles={styles} C={C} />
            )}
            {evenement.nb_places_max && (
              <InfoRow icon="people-outline" primary={`${evenement.nb_places_max} places disponibles`} styles={styles} C={C} />
            )}
          </View>

          {evenement.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('eventDetail.description')}</Text>
              <Text style={styles.description}>{evenement.description}</Text>
            </View>
          )}

          <View style={styles.qrInfoBox}>
            <Ionicons name="information-circle" size={18} color={Colors.blue} />
            <Text style={styles.qrInfoText}>{t('eventDetail.qrHint')}</Text>
          </View>

          {estTermine ? (
            <View style={styles.termineBadge}>
              <Ionicons name="checkmark-done-circle" size={20} color={C.grey} />
              <Text style={styles.termineText}>{t('eventDetail.eventEnded')}</Text>
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
                    <Text style={styles.btnPrimaryText}>{t('eventDetail.participate')}</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('QRScanner', { evenementId: id, titre: evenement.titre })}
              >
                <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
                <Text style={styles.btnSecondaryText}>
                  {estEnCours ? t('eventDetail.validatePresence') : t('eventDetail.scanQR')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!viewingPhoto} transparent animationType="fade" onRequestClose={() => setViewingPhoto(null)}>
        <TouchableOpacity style={styles.viewerOverlay} activeOpacity={1} onPress={() => setViewingPhoto(null)}>
          <Image source={{ uri: viewingPhoto ?? '' }} style={styles.viewerImage} resizeMode="contain" />
          <View style={styles.viewerClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!assocModal} transparent animationType="slide" onRequestClose={() => setAssocModal(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAssocModal(null)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <View style={styles.modalLogoWrap}>
              {assocModal?.logo ? (
                <Image source={{ uri: assocModal.logo }} style={styles.modalLogoImg} />
              ) : (
                <View style={styles.modalLogoFallback}>
                  <Text style={styles.modalLogoInitial}>{assocModal?.nom?.[0]?.toUpperCase() ?? 'A'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.modalNom}>{assocModal?.nom}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              {(assocModal?.description || assocModal?.facebook) ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{t('common.about')}</Text>
                  {assocModal?.description ? (
                    <Text style={[styles.modalSectionText, { marginBottom: assocModal.facebook ? 10 : 0 }]}>
                      {assocModal.description}
                    </Text>
                  ) : null}
                  {assocModal?.facebook ? (
                    <TouchableOpacity style={styles.modalContactRow} onPress={() => {
                      const url = assocModal.facebook!;
                      Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
                    }}>
                      <Ionicons name="logo-facebook" size={16} color="#1877F2" />
                      <Text style={[styles.modalSectionText, { color: '#1877F2', flex: 1 }]} numberOfLines={1}>
                        {assocModal.facebook}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
              {(assocModal?.email || assocModal?.telephone || assocModal?.adresse) ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{t('common.contact')}</Text>
                  {assocModal?.email ? (
                    <TouchableOpacity style={styles.modalContactRow} onPress={() => Linking.openURL(`mailto:${assocModal!.email}`)}>
                      <Ionicons name="mail-outline" size={16} color={Colors.primary} />
                      <Text style={[styles.modalSectionText, { color: Colors.primary, flex: 1 }]} numberOfLines={1}>{assocModal.email}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {assocModal?.telephone ? (
                    <TouchableOpacity style={styles.modalContactRow} onPress={() => Linking.openURL(`tel:${assocModal!.telephone}`)}>
                      <Ionicons name="call-outline" size={16} color={Colors.primary} />
                      <Text style={[styles.modalSectionText, { color: Colors.primary }]}>{assocModal.telephone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {assocModal?.adresse ? (
                    <View style={styles.modalContactRow}>
                      <Ionicons name="location-outline" size={16} color={C.grey} />
                      <Text style={[styles.modalSectionText, { flex: 1 }]}>{assocModal.adresse}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {assocModal?.photos?.length ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{t('common.photos')}</Text>
                  <ScrollView
                    horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={e =>
                      setCurrentPhotoPage(Math.round(e.nativeEvent.contentOffset.x / PHOTO_PAGE_W))
                    }
                  >
                    {chunkPhotos(assocModal.photos).map((page, pageIdx) => (
                      <View key={pageIdx} style={styles.photoPage}>
                        {page.map((uri, i) => (
                          <TouchableOpacity key={i} style={styles.photoThumbWrap} activeOpacity={0.85} onPress={() => setViewingPhoto(uri)}>
                            <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                  {chunkPhotos(assocModal.photos).length > 1 && (
                    <View style={styles.photoDots}>
                      {chunkPhotos(assocModal.photos).map((_, i) => (
                        <View key={i} style={[styles.photoDot, i === currentPhotoPage && styles.photoDotActive]} />
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAssocModal(null)}>
              <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

type StylesType = ReturnType<typeof createStyles>;
type ColorsType = typeof Colors;

function InfoRow({ icon, primary, secondary, styles, C }: {
  icon: any; primary: string; secondary?: string;
  styles: StylesType; C: ColorsType;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={C.grey} />
      <View>
        <Text style={styles.infoRowPrimary}>{primary}</Text>
        {secondary && <Text style={styles.infoRowSecondary}>{secondary}</Text>}
      </View>
    </View>
  );
}
