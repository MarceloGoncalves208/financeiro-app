import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Configuracoes
          </Text>
        </View>

        <List.Section>
          <List.Subheader>Sobre</List.Subheader>
          <List.Item
            title="Gula Grill Financeiro"
            description="Versao 1.0.0"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />
          <Divider />
          <List.Item
            title="Banco de Dados"
            description="Supabase (PostgreSQL)"
            left={(props) => <List.Icon {...props} icon="database" />}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontWeight: 'bold' },
});
