import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MenuItemProps {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  color?: string;
}

function MenuItem({ title, icon, onPress, color }: MenuItemProps) {
  const theme = useTheme();
  const iconColor = color || theme.colors.onSurface;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItem}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        <Text variant="bodyLarge" style={[styles.menuText, color ? { color } : {}]}>
          {title}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Mais
          </Text>
        </View>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Cadastros
          </Text>
          <MenuItem
            title="Clientes"
            icon="account-group"
            onPress={() => navigation.navigate('Clients')}
          />
          <Divider />
          <MenuItem
            title="Fornecedores"
            icon="truck"
            onPress={() => navigation.navigate('Suppliers')}
          />
          <Divider />
          <MenuItem
            title="Categorias"
            icon="tag-multiple"
            onPress={() => navigation.navigate('Categories')}
          />
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Configuracoes
          </Text>
          <MenuItem
            title="Dados da Empresa"
            icon="domain"
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <MenuItem
            title="Impostos"
            icon="percent"
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <MenuItem
            title="Backup"
            icon="cloud-upload"
            onPress={() => {}}
          />
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Sobre
          </Text>
          <MenuItem
            title="Versao do App"
            icon="information"
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            title="Termos de Uso"
            icon="file-document"
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            title="Politica de Privacidade"
            icon="shield-check"
            onPress={() => {}}
          />
        </Surface>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Financeiro App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
});
