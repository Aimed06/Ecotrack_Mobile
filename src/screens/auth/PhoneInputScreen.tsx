import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { requestOTP } from '../../services/api';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneInput'> };

export default function PhoneInputScreen({ navigation }: Props) {
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleaned = telephone.trim();
    if (!cleaned) return Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');

    setLoading(true);
    try {
      await requestOTP(cleaned);
      navigation.navigate('OTPVerification', { telephone: cleaned });
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'envoyer le code');
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
          <Text style={styles.subtitle}>Application citoyenne environnementale</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="+213 5XX XX XX XX"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholderTextColor={Colors.grey}
          />
          <Text style={styles.hint}>Un code de vérification sera envoyé par SMS</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Envoyer le code</Text>
            )}
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
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.black,
  },
  hint: { fontSize: 12, color: Colors.grey, marginTop: -4 },
  button: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
