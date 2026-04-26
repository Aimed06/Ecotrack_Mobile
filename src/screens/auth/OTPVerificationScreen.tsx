import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList, Utilisateur } from '../../types';
import { Colors } from '../../constants/colors';
import { loginCitoyen, registerCitoyen, requestOTP } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
  route: RouteProp<AuthStackParamList, 'OTPVerification'>;
};

export default function OTPVerificationScreen({ navigation, route }: Props) {
  const { telephone } = route.params;
  const { signIn } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const otpCode = otp.join('');

  const handleVerify = async () => {
    if (otpCode.length < 6) return Alert.alert('Erreur', 'Entrez le code à 6 chiffres');
    setLoading(true);
    try {
      if (isNewUser) {
        if (!nom.trim() || !prenom.trim()) {
          setLoading(false);
          return Alert.alert('Erreur', 'Veuillez remplir votre nom et prénom');
        }
        const res = await registerCitoyen({ telephone, nom, prenom, otp: otpCode });
        await signIn(res.data.data.token, res.data.data.utilisateur as Utilisateur);
      } else {
        const res = await loginCitoyen(telephone, otpCode);
        await signIn(res.data.data.token, res.data.data.utilisateur as Utilisateur);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || '';
      if (message.includes('non enregistré') || err.response?.status === 404) {
        setIsNewUser(true);
        Alert.alert('Nouveau compte', 'Ce numéro n\'est pas encore enregistré. Créez votre compte.');
      } else {
        Alert.alert('Erreur', message || 'Code invalide ou expiré');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await requestOTP(telephone);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Envoyé', 'Un nouveau code a été envoyé');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>Code envoyé au {telephone}</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v.slice(-1), i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        {isNewUser && (
          <View style={styles.newUserForm}>
            <Text style={styles.newUserTitle}>Créez votre profil</Text>
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              value={prenom}
              onChangeText={setPrenom}
              placeholderTextColor={Colors.grey}
            />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              value={nom}
              onChangeText={setNom}
              placeholderTextColor={Colors.grey}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {isNewUser ? 'Créer mon compte' : 'Valider'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resend} onPress={handleResend}>
          <Text style={styles.resendText}>Renvoyer le code</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  back: { marginBottom: 32 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.grey, marginBottom: 32 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  otpBox: {
    flex: 1, height: 56, borderWidth: 1.5, borderColor: Colors.greyBorder,
    borderRadius: 10, fontSize: 22, fontWeight: '700', color: Colors.primaryDark,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  newUserForm: { gap: 12, marginBottom: 16 },
  newUserTitle: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.black,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  resend: { alignItems: 'center' },
  resendText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
