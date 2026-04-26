import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { scannerQR } from '../../services/api';
import { EvenementsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<EvenementsStackParamList, 'QRScanner'>;
  route: RouteProp<EvenementsStackParamList, 'QRScanner'>;
};

export default function QRScannerScreen({ navigation, route }: Props) {
  const { titre } = route.params ?? {};
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => { requestPermission(); }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    let token = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed?.token) token = parsed.token;
    } catch {}

    try {
      await scannerQR(token);
      Alert.alert(
        'Présence validée !',
        'Vous avez été marqué présent. Vos points ont été crédités.',
        [{ text: 'Super !', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erreur réseau';
      Alert.alert('Erreur', msg, [
        { text: 'Réessayer', onPress: () => setScanned(false) },
        { text: 'Fermer', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="camera-outline" size={48} color={Colors.white} />
        <Text style={styles.permissionText}>Caméra requise pour scanner le QR code</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Scanner QR</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{titre}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch((t) => !t)}>
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Cadre de scan */}
      <View style={styles.scanArea}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {loading && (
            <ActivityIndicator size="large" color={Colors.primaryAccent} style={styles.loadingOverlay} />
          )}
        </View>
        <Text style={styles.scanHint}>
          {loading ? 'Validation en cours...' : 'Recherche d\'un QR code…'}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch((t) => !t)}>
          <Ionicons name="flash-outline" size={22} color={Colors.white} />
          <Text style={styles.footerBtnText}>Flash</Text>
        </TouchableOpacity>

        <View style={styles.qrInfoBox}>
          <Ionicons name="time-outline" size={14} color={Colors.primaryAccent} />
          <Text style={styles.qrInfoText}>QR valable uniquement pendant les horaires de l'événement</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="images-outline" size={22} color={Colors.white} />
          <Text style={styles.footerBtnText}>Galerie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C2C2A' },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  permissionText: { color: Colors.white, fontSize: 15, textAlign: 'center' },
  permBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  permBtnText: { color: Colors.white, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center', gap: 2,
  },
  headerTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, maxWidth: 200 },
  scanArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 },
  scanFrame: {
    width: 220, height: 220, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.primaryAccent, borderRadius: 6,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  loadingOverlay: { position: 'absolute' },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  footerBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  qrInfoBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(93,202,165,0.15)', borderRadius: 10,
    padding: 10, marginHorizontal: 12,
  },
  qrInfoText: { flex: 1, color: Colors.primaryAccent, fontSize: 11, lineHeight: 16 },
});
