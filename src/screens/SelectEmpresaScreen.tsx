import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EMPRESAS } from '../config/empresas';
import { useEmpresa } from '../contexts/EmpresaContext';

const ICONS: Record<string, string> = {
  'gula-grill':    'silverware-fork-knife',
  'comfort-shoes': 'shoe-heel',
};

export default function SelectEmpresaScreen() {
  const theme = useTheme();
  const { selectEmpresa } = useEmpresa();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.inner}>
        <MaterialCommunityIcons name="office-building" size={48} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Selecione a Empresa
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
          Escolha com qual empresa deseja trabalhar
        </Text>

        {EMPRESAS.map(emp => (
          <TouchableOpacity
            key={emp.id}
            onPress={() => selectEmpresa(emp.id)}
            activeOpacity={0.75}
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: emp.cor + '40' }]}
          >
            <View style={[styles.iconBox, { backgroundColor: emp.cor + '18' }]}>
              <MaterialCommunityIcons
                name={ICONS[emp.id] ?? 'domain'}
                size={32}
                color={emp.cor}
              />
            </View>
            <View style={styles.cardText}>
              <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                {emp.nome}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {emp.segmento}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={emp.cor} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: { fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
});
