import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { MainStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { modifierProfil } from '../../services/api';

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

export default function EditProfilScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();

  const [nom, setNom]       = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [email, setEmail]   = useState(user?.email ?? '');
  const [wilaya, setWilaya] = useState(user?.wilaya ?? '');
  const [photoUri, setPhotoUri]   = useState<string | null>(user?.photo_profil ?? null);
  const [photoFile, setPhotoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showWilayas, setShowWilayas] = useState(false);

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase();

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie requis.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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
      Alert.alert('Erreur', 'Le nom et le prénom sont obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('nom', nom.trim());
      form.append('prenom', prenom.trim());
      if (email.trim()) form.append('email', email.trim());
      if (wilaya) form.append('wilaya', wilaya);
      if (photoFile) form.append('photo', photoFile as any);

      await modifierProfil(form);
      await refreshUser();
      Alert.alert('Succès', 'Profil mis à jour.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Photo de profil */}
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
          <Text style={styles.photoHint}>Appuyez pour changer la photo</Text>
        </View>

        {/* Champs */}
        <View style={styles.form}>
          <Field label="Prénom" value={prenom} onChangeText={setPrenom} placeholder="Votre prénom" />
          <Field label="Nom" value={nom} onChangeText={setNom} placeholder="Votre nom" />
          <Field
            label="Email" value={email} onChangeText={setEmail}
            placeholder="votre@email.com" keyboardType="email-address" autoCapitalize="none"
          />

          {/* Wilaya picker */}
          <Text style={styles.label}>Wilaya</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowWilayas((v) => !v)}
          >
            <Text style={wilaya ? styles.pickerValue : styles.pickerPlaceholder}>
              {wilaya || 'Sélectionner une wilaya'}
            </Text>
            <Ionicons name={showWilayas ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.grey} />
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

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.grey}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  photoHint: { fontSize: 13, color: Colors.grey },
  form: { gap: 4, marginBottom: 28 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.black, backgroundColor: Colors.white,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerValue: { fontSize: 15, color: Colors.black },
  pickerPlaceholder: { fontSize: 15, color: Colors.grey },
  wilayaList: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    marginTop: 4, overflow: 'hidden',
  },
  wilayaItem: { paddingHorizontal: 14, paddingVertical: 12 },
  wilayaItemActive: { backgroundColor: Colors.primaryLight },
  wilayaItemText: { fontSize: 14, color: Colors.black },
  wilayaItemTextActive: { color: Colors.primary, fontWeight: '700' },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
