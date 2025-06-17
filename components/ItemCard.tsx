import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Item } from '@/types';
import { colors } from '@/constants/colors';
import { Edit, Trash2, Plus } from 'lucide-react-native';
import { Card } from './Card';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface ItemCardProps {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  showAddButton?: boolean;
}

export const ItemCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onPress,
  showAddButton = false
}: ItemCardProps) => {
  return (
    <Card>
      <TouchableOpacity 
        onPress={onPress} 
        disabled={!onPress}
        style={styles.touchable}
        activeOpacity={0.7}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
            
            {item.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.category}>{item.category}</Text>
              </View>
            )}
            
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            {item.stock !== undefined && (
              <Text style={[
                styles.stock,
                item.stock <= 0 ? styles.outOfStock : null
              ]}>
                {item.stock <= 0 ? "Out of stock" : `Stock: ${item.stock} ${item.unit || ""}`}
              </Text>
            )}
          </View>
          
          <View style={styles.actions}>
            {showAddButton && (
              <TouchableOpacity 
                onPress={onPress} 
                style={styles.addButton}
                disabled={!onPress || item.stock === 0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Plus size={20} color={colors.white} />
              </TouchableOpacity>
            )}
            
            {onEdit && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit();
                }} 
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Edit size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete();
                }} 
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  price: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  categoryContainer: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  category: {
    fontSize: isSmallScreen ? 10 : 12,
    color: colors.textLight,
  },
  description: {
    fontSize: isSmallScreen ? 12 : 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  stock: {
    fontSize: isSmallScreen ? 10 : 12,
    color: colors.textLight,
  },
  outOfStock: {
    color: colors.danger,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});