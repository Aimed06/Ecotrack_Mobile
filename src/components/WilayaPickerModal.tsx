import React, { useMemo, useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import WILAYAS from '../constants/wilayas';

interface Props {
  visible: boolean;
  selected: string | null;
  onSelect: (nom: string | null) => void;
  onClose: () => void;
}

function createStyles(C: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: C.greyBorder,
    },
    title: { fontSize: 17, fontWeight: '700', color: C.primaryDark },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.greyLight, justifyContent: 'center', alignItems: 'center',
    },
    searchRow: {
      flexDirection: 'row', alignItems: 'center',
      margin: 12, paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: C.greyLight, borderRadius: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: C.black },
    item: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingVertical: 14,
    },
    itemActive: { backgroundColor: C.primaryLight },
    itemId: { width: 24, fontSize: 12, color: C.grey, fontWeight: '600', textAlign: 'right' },
    itemText: { flex: 1, fontSize: 14, color: C.black, fontWeight: '500' },
    itemTextActive: { color: Colors.primary, fontWeight: '700' },
    separator: { height: 1, backgroundColor: C.greyBorder, marginLeft: 56 },
  });
}

export default function WilayaPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const C = useThemeColors();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(C), [C]);

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
          <Text style={styles.title}>{t('wilayaPicker.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={C.grey} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={C.grey} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('wilayaPicker.searchPlaceholder')}
            placeholderTextColor={C.grey}
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
                <Ionicons name="globe-outline" size={18} color={!selected ? Colors.primary : C.grey} />
                <Text style={[styles.itemText, !selected && styles.itemTextActive]}>{t('wilayaPicker.allAlgeria')}</Text>
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
