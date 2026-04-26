import React, { useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import WILAYAS from '../constants/wilayas';

interface Props {
  visible: boolean;
  selected: string | null;
  onSelect: (nom: string | null) => void;
  onClose: () => void;
}

export default function WilayaPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? WILAYAS.filter((w) => w.nom.toLowerCase().includes(query.toLowerCase()))
    : WILAYAS;

  const handleSelect = (nom: string | null) => {
    setQuery('');
    onSelect(nom);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choisir une wilaya</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.grey} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.grey} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une wilaya..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(w) => w.id.toString()}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            !query.trim() ? (
              <TouchableOpacity
                style={[styles.item, !selected && styles.itemActive]}
                onPress={() => handleSelect(null)}
              >
                <Ionicons name="globe-outline" size={18} color={!selected ? Colors.primary : Colors.grey} />
                <Text style={[styles.itemText, !selected && styles.itemTextActive]}>Toute l'Algérie</Text>
                {!selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => {
            const isActive = selected === item.nom;
            return (
              <TouchableOpacity
                style={[styles.item, isActive && styles.itemActive]}
                onPress={() => handleSelect(item.nom)}
              >
                <Text style={styles.itemId}>{item.id.toString().padStart(2, '0')}</Text>
                <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.nom}</Text>
                {isActive && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.greyBorder,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.greyLight, justifyContent: 'center', alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.greyLight, borderRadius: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.black },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  itemActive: { backgroundColor: Colors.primaryLight },
  itemId: { width: 24, fontSize: 12, color: Colors.grey, fontWeight: '600', textAlign: 'right' },
  itemText: { flex: 1, fontSize: 14, color: Colors.black, fontWeight: '500' },
  itemTextActive: { color: Colors.primary, fontWeight: '700' },
  separator: { height: 1, backgroundColor: Colors.greyBorder, marginLeft: 56 },
});
