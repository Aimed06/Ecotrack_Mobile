import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { proposePointCollecte } from '../../services/api';

const TYPES_DECHET = ['Plastique', 'Organique', 'Verre', 'Métal', 'Dangereux', 'Autre'];

export default function ProposePointCollecteScreen() {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [horaires, setHoraires] = useState('');
  const [typesSelected, setTypesSelected] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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

  const toggleType = (type: string) => {
    setTypesSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!nom.trim()) return Alert.alert('Erreur', 'Le nom est obligatoire');
    if (typesSelected.length === 0) return Alert.alert('Erreur', 'Sélectionnez au moins un type de déchet');
    if (!location) return Alert.alert('Erreur', 'Localisation non disponible');

    setLoading(true);
    try {
      await proposePointCollecte({
        nom: nom.trim(),
        description: description.trim() || undefined,
        adresse: adresse.trim() || undefined,
        wilaya: wilaya.trim() || undefined,
        horaires: horaires.trim() || undefined,
        type_dechet: typesSelected,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      Alert.alert(
        'Proposition envoyée',
        'Merci ! Votre proposition sera examinée par l\'équipe EcoTrack.',
        [{ text: 'OK', onPress: () => {
          setNom(''); setDescription(''); setAdresse('');
          setWilaya(''); setHoraires(''); setTypesSelected([]);
        }}]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (err.message === 'Network Error' ? 'Impossible de joindre le serveur. Vérifiez votre connexion.' : 'Impossible d\'envoyer la proposition');
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Proposer un point de collecte</Text>
          <Text style={styles.pageSubtitle}>
            Signalez un lieu adapté à la collecte de déchets. Votre proposition sera validée par l'équipe.
          </Text>

          {/* Nom */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom du point *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bac recyclage centre-ville"
              value={nom}
              onChangeText={setNom}
              maxLength={200}
              placeholderTextColor={Colors.grey}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Décrivez le lieu, l'accès, la capacité..."
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

          {/* Adresse */}
          <View style={styles.field}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Rue Didouche Mourad, Alger"
              value={adresse}
              onChangeText={setAdresse}
              placeholderTextColor={Colors.grey}
            />
          </View>

          {/* Wilaya */}
          <View style={styles.field}>
            <Text style={styles.label}>Wilaya</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Alger"
              value={wilaya}
              onChangeText={setWilaya}
              placeholderTextColor={Colors.grey}
            />
          </View>

          {/* Horaires */}
          <View style={styles.field}>
            <Text style={styles.label}>Horaires d'accès</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Lun-Sam 8h-20h"
              value={horaires}
              onChangeText={setHoraires}
              placeholderTextColor={Colors.grey}
            />
          </View>

          {/* Types de déchets */}
          <View style={styles.field}>
            <Text style={styles.label}>Types de déchets acceptés *</Text>
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

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitText}>Envoyer la proposition</Text>
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
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark, paddingTop: 16, marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: Colors.grey, marginBottom: 24, lineHeight: 20 },
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
