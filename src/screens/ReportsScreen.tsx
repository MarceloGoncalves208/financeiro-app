import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ReportCardProps {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
}

function ReportCard({ title, description, icon, color, onPress }: ReportCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {description}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </Surface>
    </TouchableOpacity>
  );
}

export default function ReportsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const reports = [
    {
      title: 'DRE',
      description: 'Demonstracao do Resultado do Exercicio',
      icon: 'file-chart' as const,
      color: '#4361ee',
      screen: 'DREReport' as const,
    },
    {
      title: 'Fluxo de Caixa',
      description: 'Entradas e saidas de caixa',
      icon: 'cash-multiple' as const,
      color: '#06d6a0',
      screen: 'CashFlowReport' as const,
    },
    {
      title: 'CMV',
      description: 'Custo das Mercadorias Vendidas',
      icon: 'package-variant' as const,
      color: '#ef476f',
      screen: 'CMVReport' as const,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Relatorios
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Analise suas financas com relatorios detalhados
          </Text>
        </View>

        <View style={styles.list}>
          {reports.map((report) => (
            <ReportCard
              key={report.title}
              title={report.title}
              description={report.description}
              icon={report.icon}
              color={report.color}
              onPress={() => navigation.navigate(report.screen)}
            />
          ))}
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
    marginBottom: 4,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
