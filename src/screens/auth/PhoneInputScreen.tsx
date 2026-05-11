import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { requestOTP, loginWithGoogle } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

WebBrowser.maybeCompleteAuthSession();

// ⚠️ Remplacer par vos Client IDs depuis console.cloud.google.com
const GOOGLE_WEB_CLIENT_ID = 'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneInput'> };

export default function PhoneInputScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) handleGoogleToken(token);
    } else if (response?.type === 'error') {
      Alert.alert(t('common.error'), t('auth.phone.errorGoogleCancelled'));
    }
  }, [response]);

  const handleGoogleToken = async (accessToken: string) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle(accessToken);
      const { token, utilisateur } = res.data.data;
      await signIn(token, utilisateur);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('auth.phone.errorGoogleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const cleaned = telephone.trim().replace(/\s/g, '');
    if (!cleaned) return Alert.alert(t('common.error'), t('auth.phone.errorEmpty'));

    const local = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    const fullNumber = `+213${local}`;

    setLoading(true);
    try {
      const res = await requestOTP(fullNumber);
      const devOtp: string | undefined = (res.data as any).otp; // backend renvoie l'OTP en mode dev
      if (devOtp) {
        // En développement il n'y a pas de SMS — l'OTP s'affiche ici et dans la console backend
        Alert.alert('Code OTP (dev)', `Code : ${devOtp}`, [
          { text: 'OK', onPress: () => navigation.navigate('OTPVerification', { telephone: fullNumber }) },
        ]);
      } else {
        navigation.navigate('OTPVerification', { telephone: fullNumber });
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('auth.phone.errorSend'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.title}>EcoTrack</Text>
          <Text style={styles.subtitle}>{t('auth.phone.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('auth.phone.phoneLabel')}</Text>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.flagText}>🇩🇿</Text>
              <Text style={styles.prefixText}>+213</Text>
            </View>
            <TextInput
              style={styles.inputField}
              placeholder={t('auth.phone.phonePlaceholder')}
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholderTextColor={Colors.grey}
            />
          </View>
          <Text style={styles.hint}>{t('auth.phone.phoneHint')}</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('auth.phone.sendCode')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.phone.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, (!request || loading) && styles.googleBtnDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
            <Text style={styles.googleBtnText}>{t('auth.phone.continueGoogle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assocLink}
            onPress={() => navigation.navigate('AssocLogin')}
          >
            <Ionicons name="business-outline" size={15} color={Colors.grey} />
            <Text style={styles.assocLinkText}>{t('auth.phone.assocSpace')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  logoText: { color: Colors.white, fontSize: 32, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.grey, textAlign: 'center' },
  form: { gap: 12 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.primaryDark },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.greyBorder,
    borderRadius: 12, overflow: 'hidden',
  },
  prefix: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 14,
    backgroundColor: '#F4F4F8',
    borderRightWidth: 1.5, borderRightColor: Colors.greyBorder,
  },
  flagText: { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primaryDark },
  inputField: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, color: Colors.black,
  },
  hint: { fontSize: 12, color: Colors.grey, marginTop: -4 },
  button: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.greyBorder },
  dividerText: { fontSize: 13, color: Colors.grey, fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.greyBorder,
    paddingVertical: 14, backgroundColor: Colors.white,
  },
  googleBtnDisabled: { opacity: 0.5 },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primaryDark },
  assocLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 6, marginTop: 4,
  },
  assocLinkText: { fontSize: 13, color: Colors.grey, fontWeight: '500' },
});
