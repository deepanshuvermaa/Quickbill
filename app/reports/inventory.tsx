import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { useItemsStore } from '@/store/itemsStore';
import { 
  ArrowLeft, 
  Package, 
  AlertTriangle, 
  Search,
  Download,
  Share2,
  Filter,
  Upload,
  FileText
} from 'lucide-react-native';
import { Item } from '@/types';
import { exportInventoryCSV, exportInventoryReport, downloadSampleCSV } from '@/utils/inventory-io';
import { Alert, ActivityIndicator } from 'react-native';

export default function InventoryReportScreen() {
  const router = useRouter();
  const { items, addItem } = useItemsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'report'>('report');
  
  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  
  // Filter items based on search query and selected category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'stock') {
      const stockA = a.stock || 0;
      const stockB = b.stock || 0;
      return sortOrder === 'asc' ? stockA - stockB : stockB - stockA;
    } else if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    return 0;
  });
  
  // Calculate inventory statistics
  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (item.price * (item.stock || 0)), 0);
  const lowStockItems = items.filter(item => item.stock !== undefined && item.stock < 10).length;
  
  // Get stock status
  const getStockStatus = (stock?: number): 'out' | 'low' | 'ok' => {
    if (stock === undefined || stock === 0) return 'out';
    if (stock < 10) return 'low';
    return 'ok';
  };
  
  // Handle export functions
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const success = await exportInventoryCSV(items);
      
      if (success) {
        Alert.alert(
          'Export Successful',
          'Inventory has been exported as CSV file.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to export inventory. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        'An error occurred while exporting inventory.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const success = await exportInventoryReport(items);
      
      if (success) {
        Alert.alert(
          'Export Successful',
          'Inventory report has been generated and is ready to print.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to generate inventory report. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        'An error occurred while generating the report.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExport = () => {
    Alert.alert(
      'Export Inventory',
      'Choose export format:',
      [
        {
          text: 'CSV Data',
          onPress: handleExportCSV
        },
        {
          text: 'Printable Report',
          onPress: handleExportReport
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Handle download sample CSV
  const handleDownloadSample = async () => {
    try {
      const success = await downloadSampleCSV();
      
      if (success) {
        Alert.alert(
          'Sample Downloaded',
          'Sample CSV template has been downloaded/shared. Use this template to format your inventory data.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Download Failed',
          'Unable to download sample template. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Download sample error:', error);
      Alert.alert(
        'Download Error',
        'An error occurred while downloading the sample.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Render item
  const renderItem = ({ item }: { item: Item }) => {
    const stockStatus = getStockStatus(item.stock);
    
    return (
      <TouchableOpacity 
        style={styles.itemRow}
        onPress={() => router.push(`/items/${item.id}`)}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
          <Text 
            style={[
              styles.itemStock,
              stockStatus === 'out' && styles.outOfStock,
              stockStatus === 'low' && styles.lowStock,
              stockStatus === 'ok' && styles.inStock,
            ]}
          >
            {item.stock === undefined ? 'No stock' : `Stock: ${item.stock}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Inventory Report',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleDownloadSample}
              >
                <FileText size={20} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Download size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Package size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Package size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Total Stock</Text>
            <Text style={styles.summaryValue}>{totalStock}</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <AlertTriangle size={24} color={colors.warning} />
            </View>
            <Text style={styles.summaryLabel}>Low Stock</Text>
            <Text style={styles.summaryValue}>{lowStockItems}</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Package size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Total Value</Text>
            <Text style={styles.summaryValue}>₹{totalValue.toFixed(2)}</Text>
          </Card>
        </View>
        
        <Card style={styles.filterCard}>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.selectedCategoryChipText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.selectedCategoryChip
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === category ? null : category
                )}
              >
                <Text 
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.selectedCategoryChipText
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'name' && styles.selectedSortOption
                ]}
                onPress={() => {
                  if (sortBy === 'name') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('name');
                    setSortOrder('asc');
                  }
                }}
              >
                <Text 
                  style={[
                    styles.sortOptionText,
                    sortBy === 'name' && styles.selectedSortOptionText
                  ]}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'stock' && styles.selectedSortOption
                ]}
                onPress={() => {
                  if (sortBy === 'stock') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('stock');
                    setSortOrder('asc');
                  }
                }}
              >
                <Text 
                  style={[
                    styles.sortOptionText,
                    sortBy === 'stock' && styles.selectedSortOptionText
                  ]}
                >
                  Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'price' && styles.selectedSortOption
                ]}
                onPress={() => {
                  if (sortBy === 'price') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('price');
                    setSortOrder('asc');
                  }
                }}
              >
                <Text 
                  style={[
                    styles.sortOptionText,
                    sortBy === 'price' && styles.selectedSortOptionText
                  ]}
                >
                  Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        <Card style={styles.itemsCard}>
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsTitle}>Inventory Items</Text>
            <Text style={styles.itemsCount}>{sortedItems.length} items</Text>
          </View>
          
          {sortedItems.length === 0 ? (
            <Text style={styles.emptyText}>No items found</Text>
          ) : (
            <FlatList
              data={sortedItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false} // Disable FlatList scrolling as we're using ScrollView
            />
          )}
        </Card>
        
        <Card style={styles.stockStatusCard}>
          <Text style={styles.sectionTitle}>Stock Status</Text>
          
          <View style={styles.stockStatusRow}>
            <View style={styles.stockStatusItem}>
              <View style={[styles.stockStatusIndicator, styles.inStockIndicator]} />
              <Text style={styles.stockStatusText}>In Stock</Text>
            </View>
            
            <View style={styles.stockStatusItem}>
              <View style={[styles.stockStatusIndicator, styles.lowStockIndicator]} />
              <Text style={styles.stockStatusText}>Low Stock</Text>
            </View>
            
            <View style={styles.stockStatusItem}>
              <View style={[styles.stockStatusIndicator, styles.outOfStockIndicator]} />
              <Text style={styles.stockStatusText}>Out of Stock</Text>
            </View>
          </View>
          
          <Text style={styles.stockStatusNote}>
            * Items with stock less than 10 are considered low stock
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  filterCard: {
    marginBottom: 16,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  categoriesList: {
    paddingBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedCategoryChipText: {
    color: colors.white,
    fontWeight: '500',
  },
  sortContainer: {
    marginTop: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    marginRight: 8,
  },
  selectedSortOption: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedSortOptionText: {
    color: colors.white,
    fontWeight: '500',
  },
  itemsCard: {
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: colors.textLight,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 14,
    fontWeight: '500',
  },
  inStock: {
    color: colors.success,
  },
  lowStock: {
    color: colors.warning,
  },
  outOfStock: {
    color: colors.danger,
  },
  stockStatusCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  stockStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stockStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockStatusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  inStockIndicator: {
    backgroundColor: colors.success,
  },
  lowStockIndicator: {
    backgroundColor: colors.warning,
  },
  outOfStockIndicator: {
    backgroundColor: colors.danger,
  },
  stockStatusText: {
    fontSize: 14,
    color: colors.text,
  },
  stockStatusNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});