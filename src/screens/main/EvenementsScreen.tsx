import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Modal, ScrollView, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { getEvenements } from '../../services/api';
import { Evenement, EvenementsStackParamList } from '../../types';
import WilayaPickerModal from '../../components/WilayaPickerModal';

type Props = { navigation: NativeStackNavigationProp<EvenementsStackParamList, 'EvenementsList'> };

const PHOTO_PAGE_W = Dimensions.get('window').width - 48;

const chunkPhotos = (photos: string[]): string[][] => {
  const pages: string[][] = [];
  for (let i = 0; i < photos.length; i += 3) pages.push(photos.slice(i, i + 3));
  return pages;
};

const createStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.greyLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.greyBorder,
  },
  wilayaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.greyBorder, backgroundColor: C.surface,
  },
  wilayaBtnActive: { borderColor: Colors.primary, backgroundColor: C.primaryLight },
  wilayaBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.grey },
  wilayaBtnTextActive: { color: Colors.primary },
  countBadge: { backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  periodeBar: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.greyBorder,
  },
  periodeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.greyBorder, backgroundColor: C.surface,
  },
  periodeChipActive: { borderColor: Colors.primary, backgroundColor: C.primaryLight },
  periodeChipText: { fontSize: 12, fontWeight: '600', color: C.grey },
  periodeChipTextActive: { color: Colors.primary },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardPhoto: { width: '100%', height: 180 },
  cardPhotoPlaceholder: {
    height: 120, backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  statutFloat: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statutFloatText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14, paddingTop: 26, gap: 5 },
  titre: { fontSize: 15, fontWeight: '800', color: C.primaryDark, lineHeight: 21 },
  assocRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  assocNom: { fontSize: 12, color: Colors.primary, fontWeight: '600', flex: 1 },
  divider: { height: 1, backgroundColor: C.greyBorder, marginVertical: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: C.grey, flex: 1 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.greyBorder,
  },
  assocLogoWrap: {
    position: 'absolute', bottom: -16, left: 12,
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: C.surface, overflow: 'hidden', backgroundColor: C.surface,
  },
  assocLogoImg: { width: '100%', height: '100%' },
  assocLogoFallback: {
    width: '100%', height: '100%', backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  assocLogoInitial: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: C.grey },
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

export default function EvenementsScreen({ navigation }: Props) {
  const route = useRoute<RouteProp<EvenementsStackParamList, 'EvenementsList'>>();
  const C = useThemeColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { t } = useI18n();

  const STATUT_CONFIG = useMemo(() => ({
    en_attente: { label: t('events.statusPending'), color: Colors.orange },
    publie:     { label: t('events.statusUpcoming'), color: Colors.primary },
    annule:     { label: t('events.statusCancelled'), color: Colors.red },
    termine:    { label: t('events.statusDone'), color: Colors.grey },
  }), [t]);

  const PERIODES = useMemo(() => ([
    { key: 'toutes' as const, label: t('events.allPeriods') },
    { key: 'semaine' as const, label: t('events.thisWeek') },
    { key: 'mois' as const, label: t('events.thisMonth') },
  ]), [t]);

  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [periode, setPeriode] = useState<'toutes' | 'semaine' | 'mois'>('toutes');
  const [assocModal, setAssocModal] = useState<Evenement['association'] | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [currentPhotoPage, setCurrentPhotoPage] = useState(0);

  const fetchData = async () => {
    try {
      const res = await getEvenements(1);
      setEvenements(res.data.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const openId = route.params?.openId;
    if (openId) {
      navigation.setParams({ openId: undefined });
      navigation.push('EvenementDetail', { id: openId });
    }
  }, [route.params?.openId]);

  const now = new Date();
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const upcoming = evenements
    .filter(e => new Date(e.date_fin) >= now)
    .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime());

  const termine = evenements
    .filter(e => new Date(e.date_fin) < now)
    .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());

  const sorted = [...upcoming, ...termine];

  const filtered = sorted.filter(e => {
    if (wilaya && e.wilaya !== wilaya) return false;
    if (periode !== 'toutes') {
      if (new Date(e.date_fin) < now) return false;
      if (periode === 'semaine') return new Date(e.date_debut) <= endOfWeek;
      if (periode === 'mois') return new Date(e.date_debut) <= endOfMonth;
    }
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const resultLabel = filtered.length !== 1 ? t('events.resultPlural') : t('events.resultSingular');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.wilayaBtn, wilaya && styles.wilayaBtnActive]}
          onPress={() => setShowWilayaPicker(true)}
        >
          <Ionicons name="location-outline" size={15} color={wilaya ? Colors.primary : C.grey} />
          <Text style={[styles.wilayaBtnText, wilaya && styles.wilayaBtnTextActive]} numberOfLines={1}>
            {wilaya ?? t('events.allWilayas')}
          </Text>
          {wilaya
            ? <Ionicons name="close-circle" size={16} color={Colors.primary} onPress={() => setWilaya(null)} />
            : <Ionicons name="chevron-down" size={15} color={C.grey} />
          }
        </TouchableOpacity>
        {(wilaya || periode !== 'toutes') && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length} {resultLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.periodeBar}>
        {PERIODES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.periodeChip, periode === key && styles.periodeChipActive]}
            onPress={() => setPeriode(key)}
          >
            <Text style={[styles.periodeChipText, periode === key && styles.periodeChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
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
          const statutInfo = STATUT_CONFIG[item.statut as keyof typeof STATUT_CONFIG] || STATUT_CONFIG.publie;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => navigation.push('EvenementDetail', { id: item.id })}
            >
              <View>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.cardPhoto} resizeMode="cover" />
                ) : (
                  <View style={styles.cardPhotoPlaceholder}>
                    <Ionicons name="calendar" size={36} color={Colors.primary} />
                  </View>
                )}
                <View style={[styles.statutFloat, { backgroundColor: statutInfo.color }]}>
                  <Text style={styles.statutFloatText}>{statutInfo.label}</Text>
                </View>
                <TouchableOpacity style={styles.assocLogoWrap} onPress={() => { setAssocModal(item.association); setCurrentPhotoPage(0); }}>
                  {item.association?.logo ? (
                    <Image source={{ uri: item.association.logo }} style={styles.assocLogoImg} />
                  ) : (
                    <View style={styles.assocLogoFallback}>
                      <Text style={styles.assocLogoInitial}>{item.association?.nom?.[0]?.toUpperCase() ?? 'A'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.titre} numberOfLines={2}>{item.titre}</Text>
                <TouchableOpacity style={styles.assocRow} onPress={() => { setAssocModal(item.association); setCurrentPhotoPage(0); }}>
                  <Text style={styles.assocNom} numberOfLines={1}>{item.association?.nom ?? t('common.association')}</Text>
                  {item.valide_par_admin && (
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={C.grey} />
                  <Text style={styles.infoText}>
                    {new Date(item.date_debut).toLocaleDateString('fr-DZ', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                </View>
                {item.wilaya && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={C.grey} />
                    <Text style={styles.infoText}>{item.wilaya}</Text>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <Ionicons name="chevron-forward" size={16} color={C.greyBorder} style={{ marginLeft: 'auto' }} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={C.greyBorder} />
            <Text style={styles.emptyText}>
              {wilaya ? t('events.noEventsInWilaya', { wilaya }) : t('events.noEvents')}
            </Text>
          </View>
        }
      />

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

      <Modal visible={!!viewingPhoto} transparent animationType="fade" onRequestClose={() => setViewingPhoto(null)}>
        <TouchableOpacity style={styles.viewerOverlay} activeOpacity={1} onPress={() => setViewingPhoto(null)}>
          <Image source={{ uri: viewingPhoto ?? '' }} style={styles.viewerImage} resizeMode="contain" />
          <View style={styles.viewerClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </Modal>

      <WilayaPickerModal
        visible={showWilayaPicker}
        selected={wilaya}
        onSelect={(nom) => setWilaya(nom)}
        onClose={() => setShowWilayaPicker(false)}
      />
    </SafeAreaView>
  );
}
