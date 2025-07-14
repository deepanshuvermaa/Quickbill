import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CartItem } from '@/types';
import { colors } from '@/constants/colors';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { Card } from './Card';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity?: (quantity: number) => void;
  onRemove?: () => void;
  // Legacy props for backward compatibility
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const CartItemCard = ({ 
  item, 
  onUpdateQuantity,
  onRemove,
  // Legacy props
  onIncrement, 
  onDecrement
}: CartItemCardProps) => {
  const handleIncrement = () => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.quantity + 1);
    } else if (onIncrement) {
      onIncrement();
    }
  };
  
  const handleDecrement = () => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.quantity - 1);
    } else if (onDecrement) {
      onDecrement();
    }
  };
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={styles.price}>₹{item.price.toFixed(2)} × {item.quantity}</Text>
          <Text style={styles.total}>₹{item.total.toFixed(2)}</Text>
        </View>
        
        <View style={styles.actions}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              onPress={handleDecrement} 
              style={styles.quantityButton}
              disabled={item.quantity <= 1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Minus 
                size={16} 
                color={item.quantity <= 1 ? colors.gray : colors.primary} 
              />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{item.quantity}</Text>
            
            <TouchableOpacity 
              onPress={handleIncrement} 
              style={styles.quantityButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {onRemove && (
            <TouchableOpacity 
              onPress={onRemove} 
              style={styles.removeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  price: {
    fontSize: isSmallScreen ? 12 : 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  total: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  quantityButton: {
    padding: isSmallScreen ? 6 : 8,
  },
  quantity: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    color: colors.text,
    minWidth: isSmallScreen ? 24 : 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
});