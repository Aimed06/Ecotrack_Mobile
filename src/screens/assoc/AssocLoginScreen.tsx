import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { AuthStackParamList } from '../../types';
import { loginAssociation } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'AssocLogin'> };

export default function AssocLoginScreen({ navigation }: Props) {
  const { signInAssoc } = useAuth();
  const [email, setEmail]           = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !motDePasse) {
      Alert.alert('Champs manquants', 'Email et mot de passe sont obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAssociation(email.trim().toLowerCase(), motDePasse);
      const { token, association } = res.data.data;

      if (association.statut === 'en_attente') {
        Alert.alert(
          'Compte en attente',
          'Votre demande est en cours d\'examen par l\'administrateur. Vous serez notifié par email une fois validée.',
        );
        return;
      }

      if (association.statut === 'rejetee') {
        Alert.alert(
          'Demande rejetée',
          association.motif_rejet
            ? `Votre demande a été rejetée.\n\nMotif : ${association.motif_rejet}`
            : 'Votre demande d\'inscription a été rejetée.',
        );
        return;
      }

      await signInAssoc(token, association);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || err.response?.data?.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="business" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Espace Association</Text>
          <Text style={styles.subtitle}>Connectez-vous pour gérer votre profil et vos événements.</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="contact@association.dz"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.grey}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  placeholderTextColor={Colors.grey}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.grey} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.loginBtnText}>Se connecter</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.registerHint}>
            <Text style={styles.registerHintText}>Pas encore inscrit ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PhoneInput')}>
              <Text style={styles.registerHintLink}>Inscrire mon association</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { paddingTop: 8, paddingBottom: 24, alignSelf: 'flex-start' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.grey, lineHeight: 20, marginBottom: 32 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.black,
  },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.black },
  eyeBtn: { paddingHorizontal: 14 },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  registerHint: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 28,
  },
  registerHintText: { fontSize: 13, color: Colors.grey },
  registerHintLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
