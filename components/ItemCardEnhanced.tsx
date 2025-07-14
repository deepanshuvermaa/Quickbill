import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Item } from '@/types';
import { colors } from '@/constants/colors';
import { Edit, Trash2, Plus, Package } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface ItemCardEnhancedProps {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  showAddButton?: boolean;
  isGridView?: boolean;
  quantityInCart?: number;
  onUpdateQuantity?: (quantity: number) => void;
}

// Generate color based on category
const getCategoryColor = (category?: string): string => {
  if (!category) return colors.primary;
  
  const categoryColors: { [key: string]: string } = {
    'beverages': '#4CAF50',
    'snacks': '#FF9800',
    'grocery': '#2196F3',
    'dairy': '#9C27B0',
    'personal care': '#E91E63',
    'cleaning': '#00BCD4',
    'stationery': '#607D8B',
  };
  
  return categoryColors[category.toLowerCase()] || colors.primary;
};

// Generate gradient colors based on item name
const getGradientColors = (name: string): [string, string] => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 30) % 360;
  
  return [
    `hsl(${hue1}, 70%, 65%)`,
    `hsl(${hue2}, 70%, 55%)`,
  ];
};

export const ItemCardEnhanced = ({ 
  item, 
  onEdit, 
  onDelete, 
  onPress,
  showAddButton = false,
  isGridView = false,
  quantityInCart = 0,
  onUpdateQuantity,
}: ItemCardEnhancedProps) => {
  const categoryColor = getCategoryColor(item.category);
  const [gradientStart, gradientEnd] = getGradientColors(item.name);
  
  // Get stock status
  const getStockStatus = () => {
    if (item.stock === undefined) return null;
    if (item.stock === 0) return 'out';
    if (item.stock <= 5) return 'low';
    if (item.stock <= 20) return 'medium';
    return 'high';
  };
  
  const stockStatus = getStockStatus();
  
  const renderImagePlaceholder = () => (
    <View 
      style={[
        isGridView ? styles.gridImageContainer : styles.listImageContainer,
        { backgroundColor: gradientStart }
      ]}
    >
      <Text style={styles.placeholderText}>
        {item.name.substring(0, 2).toUpperCase()}
      </Text>
      {item.category && (
        <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
          <Package size={12} color={colors.white} />
        </View>
      )}
    </View>
  );
  
  const renderStockBadge = () => {
    if (!stockStatus) return null;
    
    const stockColors = {
      out: colors.danger,
      low: '#FF9800',
      medium: '#FFC107',
      high: '#4CAF50',
    };
    
    const stockLabels = {
      out: 'Out of Stock',
      low: `Only ${item.stock} left`,
      medium: `${item.stock} in stock`,
      high: 'In Stock',
    };
    
    return (
      <View style={[styles.stockBadge, { backgroundColor: stockColors[stockStatus] }]}>
        <Text style={styles.stockBadgeText}>
          {stockLabels[stockStatus]}
        </Text>
      </View>
    );
  };
  
  const renderAddControls = () => {
    if (!showAddButton) return null;
    
    if (quantityInCart > 0 && onUpdateQuantity) {
      return (
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(quantityInCart - 1)}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantityInCart}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(quantityInCart + 1)}
            disabled={item.stock !== undefined && quantityInCart >= item.stock}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        onPress={onPress} 
        style={styles.addButton}
        disabled={!onPress || item.stock === 0}
      >
        <Plus size={20} color={colors.white} />
      </TouchableOpacity>
    );
  };
  
  if (isGridView) {
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        {renderImagePlaceholder()}
        {renderStockBadge()}
        
        <View style={styles.gridContent}>
          <Text style={styles.gridName} numberOfLines={2}>
            {item.name}
          </Text>
          
          {item.unit && (
            <Text style={styles.gridUnit}>{item.unit}</Text>
          )}
          
          <View style={styles.gridPriceRow}>
            <Text style={styles.gridPrice}>₹{item.price.toFixed(2)}</Text>
            {renderAddControls()}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {renderImagePlaceholder()}
      
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listName} numberOfLines={1}>
            {item.name}
          </Text>
          {renderStockBadge()}
        </View>
        
        {item.description && (
          <Text style={styles.listDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.listFooter}>
          <View>
            <Text style={styles.listPrice}>₹{item.price.toFixed(2)}</Text>
            {item.unit && (
              <Text style={styles.listUnit}>per {item.unit}</Text>
            )}
          </View>
          
          <View style={styles.listActions}>
            {renderAddControls()}
            
            {onEdit && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }} 
                style={styles.actionButton}
              >
                <Edit size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }} 
                style={styles.actionButton}
              >
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // List View Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  listDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  listUnit: {
    fontSize: 12,
    color: colors.textLight,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Grid View Styles
  gridCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    position: 'relative',
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  gridContent: {
    flex: 1,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    minHeight: 36,
  },
  gridUnit: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  gridPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  
  // Common Styles
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.9,
  },
  categoryIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginHorizontal: 12,
  },
  actionButton: {
    padding: 8,
  },
});