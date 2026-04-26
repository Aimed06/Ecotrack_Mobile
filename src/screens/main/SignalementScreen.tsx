import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { creerSignalement } from '../../services/api';

const DEGRES = [
  { value: 1, label: 'Très léger', color: Colors.primary },
  { value: 2, label: 'Léger', color: '#97C459' },
  { value: 3, label: 'Modéré', color: Colors.orange },
  { value: 4, label: 'Grave', color: '#E8703A' },
  { value: 5, label: 'Critique', color: Colors.red },
];

const TYPES_DECHET = ['Plastique', 'Organique', 'Verre', 'Métal', 'Dangereux', 'Autre'];

export default function SignalementScreen() {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [degre, setDegre] = useState(1);
  const [typesSelected, setTypesSelected] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [wilaya, setWilaya] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  const pickImage = async () => {
    if (photos.length >= 5) return Alert.alert('Limite', 'Maximum 5 photos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const toggleType = (type: string) => {
    setTypesSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!titre.trim()) return Alert.alert('Erreur', 'Le titre est obligatoire');
    if (!location) return Alert.alert('Erreur', 'Localisation non disponible');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('description', description);
      formData.append('degre_pollution', degre.toString());
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      if (wilaya) formData.append('wilaya', wilaya);

      photos.forEach((uri, i) => {
        formData.append('photos', {
          uri,
          type: 'image/jpeg',
          name: `photo_${i}.jpg`,
        } as any);
      });

      await creerSignalement(formData);
      Alert.alert('Succès', 'Votre signalement a été envoyé ! +20 pts', [
        { text: 'OK', onPress: () => { setTitre(''); setDescription(''); setPhotos([]); setDegre(1); } },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'envoyer le signalement');
    } finally {
      setLoading(false);
    }
  };

  const degreInfo = DEGRES[degre - 1];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Nouveau signalement</Text>

          {/* Zone photos */}
          <View style={styles.photosSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <TouchableOpacity style={styles.photoAdd} onPress={pickImage}>
                <Ionicons name="camera" size={28} color={Colors.primary} />
                <Text style={styles.photoAddText}>Ajouter</Text>
              </TouchableOpacity>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Titre & description */}
          <View style={styles.field}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Dépôt sauvage route nationale"
              value={titre}
              onChangeText={setTitre}
              maxLength={200}
              placeholderTextColor={Colors.grey}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Décrivez la situation..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.grey}
            />
          </View>

          {/* Localisation */}
          <View style={[styles.field, styles.locationCard]}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Localisation automatique</Text>
              <Text style={styles.locationCoords}>
                {location
                  ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : 'En attente de GPS...'}
              </Text>
            </View>
            {!location && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Wilaya (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Alger"
              value={wilaya}
              onChangeText={setWilaya}
              placeholderTextColor={Colors.grey}
            />
          </View>

          {/* Degré pollution */}
          <View style={styles.field}>
            <Text style={styles.label}>Degré de pollution</Text>
            <View style={styles.degreRow}>
              {DEGRES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.degreSegment, { backgroundColor: degre >= d.value ? d.color : Colors.greyBorder }]}
                  onPress={() => setDegre(d.value)}
                />
              ))}
            </View>
            <Text style={[styles.degreLabel, { color: degreInfo.color }]}>
              {degre}/5 · {degreInfo.label}
            </Text>
          </View>

          {/* Types de déchets */}
          <View style={styles.field}>
            <Text style={styles.label}>Type de déchets</Text>
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

          {/* Bouton envoi */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitText}>Envoyer le signalement · +20 pts</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark, paddingTop: 16, marginBottom: 20 },
  photosSection: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    borderStyle: 'dashed', padding: 12, marginBottom: 20,
  },
  photoAdd: {
    width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  photoAddText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  photoThumb: { position: 'relative' },
  photoImage: { width: 80, height: 80, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.primaryDark, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.black,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14,
  },
  locationLabel: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  locationCoords: { fontSize: 12, color: Colors.primaryMedium, marginTop: 2 },
  degreRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  degreSegment: { flex: 1, height: 10, borderRadius: 5 },
  degreLabel: { fontSize: 13, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.greyBorder,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.grey, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
