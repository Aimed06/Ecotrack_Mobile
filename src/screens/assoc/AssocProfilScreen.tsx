import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfilAssociation, changerMotDePasseAssociation } from '../../services/api';
import WilayaPickerModal from '../../components/WilayaPickerModal';

export default function AssocProfilScreen() {
  const { assoc, signOutAssoc, refreshAssoc } = useAuth();

  const [nom, setNom]               = useState(assoc?.nom ?? '');
  const [description, setDescription] = useState(assoc?.description ?? '');
  const [wilaya, setWilaya]         = useState(assoc?.wilaya ?? '');
  const [adresse, setAdresse]       = useState(assoc?.adresse ?? '');
  const [telephone, setTelephone]   = useState(assoc?.telephone ?? '');
  const [facebook, setFacebook]     = useState(assoc?.facebook ?? '');
  const [logoUri, setLogoUri]       = useState<string | null>(assoc?.logo ?? null);
  const [logoFile, setLogoFile]     = useState<{ uri: string; name: string; type: string } | null>(null);
  const [saving, setSaving]         = useState(false);
  const [showWilaya, setShowWilaya] = useState(false);

  // Changement de mot de passe
  const [mdpActuel, setMdpActuel]       = useState('');
  const [mdpNouveau, setMdpNouveau]     = useState('');
  const [mdpConfirmer, setMdpConfirmer] = useState('');
  const [showMdp, setShowMdp]           = useState(false);
  const [mdpLoading, setMdpLoading]     = useState(false);
  const [mdpModalVisible, setMdpModalVisible] = useState(false);

  useEffect(() => {
    if (assoc) {
      setNom(assoc.nom ?? '');
      setDescription(assoc.description ?? '');
      setWilaya(assoc.wilaya ?? '');
      setAdresse(assoc.adresse ?? '');
      setTelephone(assoc.telephone ?? '');
      setFacebook(assoc.facebook ?? '');
      setLogoUri(assoc.logo ?? null);
    }
  }, [assoc]);

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Accès à la galerie requis.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setLogoUri(asset.uri);
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      setLogoFile({ uri: asset.uri, name: `logo.${ext}`, type: `image/${ext}` });
    }
  };

  const handleSave = async () => {
    if (!nom.trim()) { Alert.alert('Erreur', 'Le nom est obligatoire.'); return; }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('nom', nom.trim());
      form.append('description', description.trim());
      form.append('adresse', adresse.trim());
      form.append('wilaya', wilaya);
      form.append('telephone', telephone.trim());
      form.append('facebook', facebook.trim());
      if (logoFile) form.append('logo', logoFile as any);

      await updateProfilAssociation(form);
      await refreshAssoc();
      setLogoFile(null);
      Alert.alert('Succès', 'Profil mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangerMotDePasse = async () => {
    if (!mdpActuel || !mdpNouveau || !mdpConfirmer) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.'); return;
    }
    if (mdpNouveau.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères.'); return;
    }
    if (mdpNouveau !== mdpConfirmer) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.'); return;
    }
    setMdpLoading(true);
    try {
      await changerMotDePasseAssociation(mdpActuel, mdpNouveau);
      setMdpModalVisible(false);
      setMdpActuel(''); setMdpNouveau(''); setMdpConfirmer('');
      Alert.alert('Succès', 'Mot de passe mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Impossible de changer le mot de passe.');
    } finally {
      setMdpLoading(false);
    }
  };

  const initial = assoc?.nom?.[0]?.toUpperCase() ?? '🏢';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickLogo} style={styles.logoWrap}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImg} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.assocNom}>{assoc?.nom}</Text>
          <Text style={styles.assocEmail}>{assoc?.email}</Text>
          <View style={styles.valideBadge}>
            <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
            <Text style={styles.valideText}>Association validée</Text>
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Field label="Nom de l'association *">
            <TextInput style={styles.input} value={nom} onChangeText={setNom}
              placeholder="Nom de votre association" placeholderTextColor={Colors.grey} />
          </Field>

          <Field label="Description">
            <TextInput style={[styles.input, styles.textarea]} value={description}
              onChangeText={setDescription} placeholder="Décrivez votre association..."
              multiline numberOfLines={4} textAlignVertical="top"
              placeholderTextColor={Colors.grey} />
          </Field>

          <Field label="Wilaya">
            <TouchableOpacity style={styles.wilayaBtn} onPress={() => setShowWilaya(true)}>
              <Text style={[styles.wilayaBtnText, wilaya && { color: Colors.black }]}>
                {wilaya || 'Sélectionner une wilaya'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.grey} />
            </TouchableOpacity>
          </Field>

          <Field label="Adresse">
            <TextInput style={styles.input} value={adresse} onChangeText={setAdresse}
              placeholder="Ex : 12 Rue des Pins, Hydra, Alger"
              placeholderTextColor={Colors.grey} />
          </Field>

          <Field label="Téléphone">
            <TextInput style={styles.input} value={telephone} onChangeText={setTelephone}
              placeholder="Ex : 0555 123 456" keyboardType="phone-pad"
              placeholderTextColor={Colors.grey} />
          </Field>

          <Field label="Page Facebook">
            <TextInput style={styles.input} value={facebook} onChangeText={setFacebook}
              placeholder="https://facebook.com/votre-page"
              keyboardType="url" autoCapitalize="none"
              placeholderTextColor={Colors.grey} />
          </Field>
        </View>

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
        </TouchableOpacity>

        {/* Changer mot de passe */}
        <TouchableOpacity style={styles.mdpBtn} onPress={() => setMdpModalVisible(true)}>
          <Ionicons name="lock-closed-outline" size={16} color={Colors.primaryDark} />
          <Text style={styles.mdpBtnText}>Changer le mot de passe</Text>
        </TouchableOpacity>

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnecter', style: 'destructive', onPress: signOutAssoc },
          ])}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal changement de mot de passe */}
      <Modal visible={mdpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>

            <View style={styles.mdpField}>
              <Text style={styles.mdpLabel}>Mot de passe actuel</Text>
              <View style={styles.passwordWrap}>
                <TextInput style={styles.passwordInput} value={mdpActuel}
                  onChangeText={setMdpActuel} secureTextEntry={!showMdp}
                  placeholder="••••••••" placeholderTextColor={Colors.grey} />
                <TouchableOpacity onPress={() => setShowMdp(!showMdp)} style={styles.eyeBtn}>
                  <Ionicons name={showMdp ? 'eye-off' : 'eye'} size={18} color={Colors.grey} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mdpField}>
              <Text style={styles.mdpLabel}>Nouveau mot de passe (min. 8 caractères)</Text>
              <TextInput style={styles.mdpInput} value={mdpNouveau}
                onChangeText={setMdpNouveau} secureTextEntry={!showMdp}
                placeholder="••••••••" placeholderTextColor={Colors.grey} />
            </View>

            <View style={styles.mdpField}>
              <Text style={styles.mdpLabel}>Confirmer le nouveau mot de passe</Text>
              <TextInput
                style={[styles.mdpInput, mdpConfirmer && mdpConfirmer !== mdpNouveau && { borderColor: Colors.red }]}
                value={mdpConfirmer} onChangeText={setMdpConfirmer}
                secureTextEntry={!showMdp}
                placeholder="••••••••" placeholderTextColor={Colors.grey} />
            </View>

            <TouchableOpacity
              style={[styles.mdpConfirmBtn, mdpLoading && { opacity: 0.7 }]}
              onPress={handleChangerMotDePasse}
              disabled={mdpLoading}
            >
              {mdpLoading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.mdpConfirmBtnText}>Confirmer</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mdpCancelBtn}
              onPress={() => { setMdpModalVisible(false); setMdpActuel(''); setMdpNouveau(''); setMdpConfirmer(''); }}
            >
              <Text style={styles.mdpCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <WilayaPickerModal
        visible={showWilaya}
        selected={wilaya}
        onSelect={(w) => setWilaya(w)}
        onClose={() => setShowWilaya(false)}
      />
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { alignItems: 'center', paddingVertical: 28 },
  logoWrap: { position: 'relative', marginBottom: 12 },
  logoImg: { width: 88, height: 88, borderRadius: 44 },
  logoPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  logoInitial: { fontSize: 34, fontWeight: '800', color: Colors.primary },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  assocNom: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  assocEmail: { fontSize: 13, color: Colors.grey, marginTop: 4 },
  valideBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 10,
  },
  valideText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  form: { gap: 4, marginBottom: 20 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.black,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  wilayaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  wilayaBtnText: { fontSize: 15, color: Colors.grey, flex: 1 },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  mdpBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.greyBorder,
    paddingVertical: 14, marginBottom: 12,
  },
  mdpBtnText: { color: Colors.primaryDark, fontSize: 15, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.red,
    paddingVertical: 14,
  },
  logoutText: { color: Colors.red, fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.white,
    borderRadius: 20, padding: 24, gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  mdpField: { gap: 6 },
  mdpLabel: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  mdpInput: {
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.black,
  },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.greyBorder, borderRadius: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.black },
  eyeBtn: { paddingHorizontal: 14 },
  mdpConfirmBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  mdpConfirmBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  mdpCancelBtn: { alignItems: 'center', paddingVertical: 4 },
  mdpCancelBtnText: { fontSize: 14, color: Colors.grey },
});
