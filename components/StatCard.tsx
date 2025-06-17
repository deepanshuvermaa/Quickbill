import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  onPress?: () => void;
}

export const StatCard = ({ title, value, icon, color = colors.primary, onPress }: StatCardProps) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <Card style={styles.card}>
      <CardComponent 
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            {icon}
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <Text 
            style={[styles.value, { color }]} 
            numberOfLines={1} 
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {value}
          </Text>
        </View>
      </CardComponent>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: isSmallScreen ? 10 : 16,
    minWidth: isSmallScreen ? '45%' : '30%',
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconContainer: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: isSmallScreen ? 10 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 12 : 14,
    color: colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontSize: isSmallScreen ? 16 : 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});