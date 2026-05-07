import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { MainStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  modifierProfil,
  initierChangementEmail as initierEmailApi,
  confirmerChangementEmail as confirmerEmailApi,
} from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'EditProfil'>;
};

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi',
  'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla',
  'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
];

const createStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  photoSection: { alignItems: 'center', paddingVertical: 28 },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 32, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  photoHint: { fontSize: 13, color: C.grey },
  form: { gap: 4, marginBottom: 20 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: C.primaryDark, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.black, backgroundColor: C.surface,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.surface,
  },
  pickerValue: { fontSize: 15, color: C.black },
  pickerPlaceholder: { fontSize: 15, color: C.grey },
  wilayaList: {
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    marginTop: 4, overflow: 'hidden', backgroundColor: C.surface,
  },
  wilayaItem: { paddingHorizontal: 14, paddingVertical: 12 },
  wilayaItemActive: { backgroundColor: C.primaryLight },
  wilayaItemText: { fontSize: 14, color: C.black },
  wilayaItemTextActive: { color: Colors.primary, fontWeight: '700' },

  emailSection: {
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 16,
    padding: 16, marginBottom: 28, gap: 10, backgroundColor: C.surface,
  },
  emailSectionTitle: { fontSize: 13, fontWeight: '700', color: C.primaryDark },
  emailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  emailConfirmed: { fontSize: 14, color: C.black, flex: 1 },
  pendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  pendingText: { fontSize: 13, color: '#92400E', flex: 1 },
  pendingLabel: { fontSize: 11, color: '#B45309', fontWeight: '600' },
  confirmEmailBtn: {
    backgroundColor: '#F59E0B', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  confirmEmailBtnText: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  changeEmailBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  changeEmailBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  emailInputWrap: { gap: 10 },
  emailInput: {
    borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: C.black, backgroundColor: C.surface,
  },
  emailInputActions: { flexDirection: 'row', gap: 10 },
  cancelEmailBtn: {
    flex: 1, borderWidth: 1.5, borderColor: C.greyBorder, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  cancelEmailBtnText: { fontSize: 14, color: C.grey, fontWeight: '600' },
  sendCodeBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  sendCodeBtnText: { fontSize: 14, color: Colors.white, fontWeight: '700' },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: C.surface,
    borderRadius: 20, padding: 24, gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.primaryDark, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: C.grey, textAlign: 'center', lineHeight: 20 },
  otpInput: {
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, fontSize: 28, fontWeight: '800',
    color: C.primaryDark, letterSpacing: 8, backgroundColor: C.bg,
  },
  otpConfirmBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  otpConfirmBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  otpCancelBtn: { alignItems: 'center', paddingVertical: 4 },
  otpCancelBtnText: { fontSize: 14, color: C.grey },
  devOtpBanner: {
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  devOtpLabel: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  devOtpCode: { fontSize: 24, fontWeight: '800', color: '#15803D', letterSpacing: 6, marginTop: 2 },
});

export default function EditProfilScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  const C = useThemeColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { t } = useI18n();

  const [nom, setNom]       = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [wilaya, setWilaya] = useState(user?.wilaya ?? '');
  const [photoUri, setPhotoUri]   = useState<string | null>(user?.photo_profil ?? null);
  const [photoFile, setPhotoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showWilayas, setShowWilayas] = useState(false);

  const [emailInput, setEmailInput]       = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailLoading, setEmailLoading]   = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode]             = useState('');
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [devOtp, setDevOtp]               = useState<string | null>(null);

  const confirmedEmail = user?.email ?? null;
  const pendingEmail   = user?.pending_email ?? pendingTarget;

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase();

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('editProfile.errorGallery'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      setPhotoFile({ uri: asset.uri, name: `photo.${ext}`, type: `image/${ext}` });
    }
  };

  const handleSave = async () => {
    if (!nom.trim() || !prenom.trim()) {
      Alert.alert(t('common.error'), t('editProfile.errorNameRequired'));
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('nom', nom.trim());
      form.append('prenom', prenom.trim());
      if (wilaya) form.append('wilaya', wilaya);
      if (photoFile) form.append('photo', photoFile as any);
      await modifierProfil(form);
      await refreshUser();
      Alert.alert(t('common.success'), t('editProfile.successProfile'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('editProfile.errorUpdateProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleInitierEmail = async () => {
    const cleaned = emailInput.trim();
    if (!cleaned) { Alert.alert(t('common.error'), t('editProfile.errorEmailEmpty')); return; }
    setEmailLoading(true);
    try {
      const res = await initierEmailApi(cleaned);
      const otp = res.data?.data?.otp ?? null;
      setDevOtp(otp);
      setPendingTarget(cleaned);
      await refreshUser();
      setShowEmailInput(false);
      setEmailInput('');
      setOtpCode('');
      setOtpModalVisible(true);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('editProfile.errorEmailSend'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmerEmail = async () => {
    if (otpCode.length !== 6) { Alert.alert(t('common.error'), t('editProfile.errorCodeEmpty')); return; }
    setEmailLoading(true);
    try {
      await confirmerEmailApi(otpCode);
      setOtpModalVisible(false);
      setOtpCode('');
      setPendingTarget(null);
      await refreshUser();
      Alert.alert(t('common.success'), t('editProfile.successEmail'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('editProfile.errorCodeInvalid'));
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>{t('editProfile.photoHint')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t('editProfile.firstnameLabel')}</Text>
            <TextInput style={styles.input} value={prenom} onChangeText={setPrenom}
              placeholder={t('editProfile.firstnamePlaceholder')} placeholderTextColor={C.grey} autoCapitalize="words" />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t('editProfile.lastnameLabel')}</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom}
              placeholder={t('editProfile.lastnamePlaceholder')} placeholderTextColor={C.grey} autoCapitalize="words" />
          </View>

          <Text style={styles.label}>{t('editProfile.wilayaLabel')}</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowWilayas(v => !v)}>
            <Text style={wilaya ? styles.pickerValue : styles.pickerPlaceholder}>
              {wilaya || t('editProfile.wilayaPlaceholder')}
            </Text>
            <Ionicons name={showWilayas ? 'chevron-up' : 'chevron-down'} size={18} color={C.grey} />
          </TouchableOpacity>

          {showWilayas && (
            <View style={styles.wilayaList}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                {WILAYAS.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.wilayaItem, w === wilaya && styles.wilayaItemActive]}
                    onPress={() => { setWilaya(w); setShowWilayas(false); }}
                  >
                    <Text style={[styles.wilayaItemText, w === wilaya && styles.wilayaItemTextActive]}>
                      {w}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.emailSection}>
          <Text style={styles.emailSectionTitle}>{t('editProfile.emailSection')}</Text>

          <View style={styles.emailRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginTop: 1 }} />
            <Text style={styles.emailConfirmed} numberOfLines={1}>
              {confirmedEmail || t('editProfile.emailNotSet')}
            </Text>
          </View>

          {pendingEmail && (
            <View style={styles.pendingRow}>
              <Ionicons name="time-outline" size={15} color="#B45309" style={{ marginTop: 1 }} />
              <Text style={styles.pendingText} numberOfLines={1}>{pendingEmail}</Text>
              <Text style={styles.pendingLabel}>{t('editProfile.emailPending')}</Text>
              <TouchableOpacity style={styles.confirmEmailBtn}
                onPress={() => { setOtpCode(''); setOtpModalVisible(true); }}>
                <Text style={styles.confirmEmailBtnText}>{t('editProfile.emailConfirm')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!showEmailInput ? (
            <TouchableOpacity style={styles.changeEmailBtn} onPress={() => setShowEmailInput(true)}>
              <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
              <Text style={styles.changeEmailBtnText}>
                {confirmedEmail || pendingEmail ? t('editProfile.emailChange') : t('editProfile.emailAdd')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emailInputWrap}>
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="nouvel@email.com"
                placeholderTextColor={C.grey}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <View style={styles.emailInputActions}>
                <TouchableOpacity style={styles.cancelEmailBtn}
                  onPress={() => { setShowEmailInput(false); setEmailInput(''); }}>
                  <Text style={styles.cancelEmailBtnText}>{t('editProfile.emailCancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendCodeBtn, emailLoading && { opacity: 0.7 }]}
                  onPress={handleInitierEmail}
                  disabled={emailLoading}
                >
                  {emailLoading
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Text style={styles.sendCodeBtnText}>{t('editProfile.emailSendCode')}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{t('editProfile.saveBtn')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('editProfile.otpTitle')}</Text>
            <Text style={styles.modalDesc}>
              {t('editProfile.otpDesc', { email: pendingEmail || pendingTarget || '' })}
            </Text>
            {devOtp && (
              <View style={styles.devOtpBanner}>
                <Text style={styles.devOtpLabel}>{t('editProfile.otpDevLabel')}</Text>
                <Text style={styles.devOtpCode}>{devOtp}</Text>
              </View>
            )}
            <TextInput
              style={styles.otpInput}
              value={otpCode}
              onChangeText={(v) => setOtpCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="------"
              placeholderTextColor={C.grey}
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.otpConfirmBtn, emailLoading && { opacity: 0.7 }]}
              onPress={handleConfirmerEmail}
              disabled={emailLoading}
            >
              {emailLoading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.otpConfirmBtnText}>{t('editProfile.otpConfirm')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.otpCancelBtn}
              onPress={() => { setOtpModalVisible(false); setOtpCode(''); }}>
              <Text style={styles.otpCancelBtnText}>{t('editProfile.otpCancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
