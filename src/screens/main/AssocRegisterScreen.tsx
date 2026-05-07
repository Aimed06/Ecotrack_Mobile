import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { MainStackParamList } from '../../types';
import { initierInscriptionAssociation, confirmerInscriptionAssociation } from '../../services/api';
import WilayaPickerModal from '../../components/WilayaPickerModal';

type Props = { navigation: NativeStackNavigationProp<MainStackParamList, 'AssocRegister'> };

export default function AssocRegisterScreen({ navigation }: Props) {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // OTP verification
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [emailOtp, setEmailOtp]   = useState('');
  const [phoneOtp, setPhoneOtp]   = useState('');
  const [devEmailOtp, setDevEmailOtp] = useState<string | null>(null);
  const [devPhoneOtp, setDevPhoneOtp] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim() || !email.trim() || !motDePasse || !adresse.trim() || !wilaya || !telephone.trim()) {
      Alert.alert('Champs manquants', 'Nom, email, mot de passe, adresse, wilaya et téléphone sont obligatoires.');
      return;
    }
    if (motDePasse.length < 8) {
      Alert.alert('Mot de passe trop court', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmer) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await initierInscriptionAssociation({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        mot_de_passe: motDePasse,
        adresse: adresse.trim(),
        description: description.trim() || undefined,
        wilaya,
        telephone: telephone.trim(),
      });
      setDevEmailOtp(res.data?.data?.email_otp ?? null);
      setDevPhoneOtp(res.data?.data?.phone_otp ?? null);
      setEmailOtp('');
      setPhoneOtp('');
      setOtpModalVisible(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmerOtp = async () => {
    if (emailOtp.length !== 6 || phoneOtp.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir les deux codes à 6 chiffres.');
      return;
    }
    setConfirming(true);
    try {
      await confirmerInscriptionAssociation(email.trim().toLowerCase(), emailOtp, phoneOtp);
      setOtpModalVisible(false);
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Code incorrect ou expiré.');
    } finally {
      setConfirming(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Demande envoyée !</Text>
          <Text style={styles.successText}>
            Votre demande d'inscription a bien été reçue. L'administrateur l'examinera et vous recevrez
            une réponse par email sous peu.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          {/* En-tête */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.iconWrap}>
            <Ionicons name="business" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Inscrire votre association</Text>
          <Text style={styles.subtitle}>
            Remplissez ce formulaire. L'administrateur validera votre demande avant activation.
          </Text>

          {/* Nom */}
          <Field label="Nom de l'association *">
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Ex : Association Verte d'Alger"
              maxLength={200}
            />
          </Field>

          {/* Email */}
          <Field label="Email *">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="contact@association.dz"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          {/* Mot de passe */}
          <Field label="Mot de passe * (min. 8 caractères)">
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={motDePasse}
                onChangeText={setMotDePasse}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.grey} />
              </TouchableOpacity>
            </View>
          </Field>

          {/* Confirmer mot de passe */}
          <Field label="Confirmer le mot de passe *">
            <TextInput
              style={[styles.input, confirmer && confirmer !== motDePasse && styles.inputError]}
              value={confirmer}
              onChangeText={setConfirmer}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
            />
          </Field>

          {/* Description */}
          <Field label="Description de l'association">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Présentez votre association, ses objectifs, ses activités..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          {/* Adresse */}
          <Field label="Adresse *">
            <TextInput
              style={styles.input}
              value={adresse}
              onChangeText={setAdresse}
              placeholder="Ex : 12 Rue des Pins, Hydra, Alger"
              maxLength={500}
            />
          </Field>

          {/* Wilaya */}
          <Field label="Wilaya *">
            <TouchableOpacity
              style={styles.wilayaBtn}
              onPress={() => setShowWilayaPicker(true)}
            >
              <Ionicons name="location-outline" size={16} color={wilaya ? Colors.primary : Colors.grey} />
              <Text style={[styles.wilayaBtnText, wilaya && styles.wilayaBtnTextActive]} numberOfLines={1}>
                {wilaya || 'Choisir une wilaya'}
              </Text>
              {wilaya
                ? <Ionicons name="close-circle" size={16} color={Colors.primary} onPress={() => setWilaya('')} />
                : <Ionicons name="chevron-down" size={16} color={Colors.grey} />
              }
            </TouchableOpacity>
          </Field>

          {/* Téléphone */}
          <Field label="Téléphone">
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={setTelephone}
              placeholder="Ex : 0555 123 456"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </Field>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.submitBtnText}>Envoyer la demande</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <WilayaPickerModal
        visible={showWilayaPicker}
        selected={wilaya}
        onSelect={(nom) => setWilaya(nom)}
        onClose={() => setShowWilayaPicker(false)}
      />

      {/* Modal vérification OTP */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Vérification</Text>
            <Text style={styles.modalDesc}>
              Codes envoyés à{'\n'}
              <Text style={{ fontWeight: '700', color: Colors.primaryDark }}>{email.trim().toLowerCase()}</Text>
              {'\n'}et{'\n'}
              <Text style={{ fontWeight: '700', color: Colors.primaryDark }}>{telephone.trim()}</Text>
            </Text>

            {/* Code email */}
            <View style={styles.otpField}>
              <Text style={styles.otpLabel}>
                <Ionicons name="mail-outline" size={13} /> Code email
              </Text>
              {devEmailOtp && (
                <View style={styles.devBanner}>
                  <Text style={styles.devBannerLabel}>Dev :</Text>
                  <Text style={styles.devBannerCode}>{devEmailOtp}</Text>
                </View>
              )}
              <TextInput
                style={styles.otpInput}
                value={emailOtp}
                onChangeText={(t) => setEmailOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="------"
                placeholderTextColor={Colors.grey}
                textAlign="center"
              />
            </View>

            {/* Code téléphone */}
            <View style={styles.otpField}>
              <Text style={styles.otpLabel}>
                <Ionicons name="call-outline" size={13} /> Code téléphone
              </Text>
              {devPhoneOtp && (
                <View style={styles.devBanner}>
                  <Text style={styles.devBannerLabel}>Dev :</Text>
                  <Text style={styles.devBannerCode}>{devPhoneOtp}</Text>
                </View>
              )}
              <TextInput
                style={styles.otpInput}
                value={phoneOtp}
                onChangeText={(t) => setPhoneOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="------"
                placeholderTextColor={Colors.grey}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, confirming && { opacity: 0.7 }]}
              onPress={handleConfirmerOtp}
              disabled={confirming}
            >
              {confirming
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.confirmBtnText}>Confirmer l'inscription</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => { setOtpModalVisible(false); }}
            >
              <Text style={styles.resendBtnText}>Renvoyer les codes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { marginBottom: 20 },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 13, color: Colors.grey, lineHeight: 20, marginBottom: 28 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.black,
    backgroundColor: Colors.white,
  },
  inputError: { borderColor: Colors.red },
  textarea: { height: 110, textAlignVertical: 'top' },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    backgroundColor: Colors.white,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.black },
  eyeBtn: { paddingHorizontal: 14 },
  wilayaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.white,
  },
  wilayaBtnText: { flex: 1, fontSize: 14, color: Colors.grey },
  wilayaBtnTextActive: { color: Colors.black },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  successText: { fontSize: 14, color: Colors.grey, textAlign: 'center', lineHeight: 22 },
  backBtn: {
    marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  backBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Modal OTP
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.white,
    borderRadius: 20, padding: 24, gap: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  modalDesc: { fontSize: 13, color: Colors.grey, textAlign: 'center', lineHeight: 20 },
  otpField: { gap: 6 },
  otpLabel: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  devBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  devBannerLabel: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  devBannerCode: { fontSize: 18, fontWeight: '800', color: '#15803D', letterSpacing: 4 },
  otpInput: {
    borderWidth: 2, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingVertical: 12, fontSize: 24, fontWeight: '800',
    color: Colors.primaryDark, letterSpacing: 8,
  },
  confirmBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  confirmBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  resendBtn: { alignItems: 'center', paddingVertical: 4 },
  resendBtnText: { fontSize: 13, color: Colors.grey },
});
