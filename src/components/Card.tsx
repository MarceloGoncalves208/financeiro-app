import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ title, children, style }: CardProps) {
  const theme = useTheme();

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }, style]} elevation={1}>
      {title && (
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
      )}
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    marginBottom: 12,
    fontWeight: '600',
  },
});
