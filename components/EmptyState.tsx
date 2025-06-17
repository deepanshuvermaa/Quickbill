import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { FileX } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState = ({ title, message, icon, style }: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      {icon || <FileX size={64} color={colors.gray} />}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    maxWidth: 300,
  },
});