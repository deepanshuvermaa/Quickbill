import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors } from '@/constants/colors';
import { ShoppingCart } from 'lucide-react-native';

interface CartBottomBarProps {
  itemCount: number;
  total: number;
  onPress: () => void;
}

export const CartBottomBar: React.FC<CartBottomBarProps> = ({
  itemCount,
  total,
  onPress,
}) => {
  if (itemCount === 0) return null;
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.leftSection}>
        <ShoppingCart size={20} color={colors.white} />
        <Text style={styles.itemCount}>{itemCount} items</Text>
        <View style={styles.separator} />
        <Text style={styles.total}>₹{total.toFixed(2)}</Text>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.viewCartText}>View Cart</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 60,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginRight: 4,
  },
  arrow: {
    fontSize: 18,
    color: colors.white,
  },
});