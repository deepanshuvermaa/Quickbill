import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useNavigation } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  Trash2, 
  ArrowLeft,
  Filter,
  DollarSign,
  ShoppingCart,
  Calendar,
  UserCheck,
  UserX,
  Tag,
  Download,
  Upload,
  MoreVertical
} from 'lucide-react-native';
import { useCustomersStore, Customer } from '@/store/customersStore';
import { SwipeListView } from 'react-native-swipe-list-view';
import { exportCustomersToCSV, importCustomersFromCSV, generateCSVTemplate } from '@/utils/customer-csv';
import { debugCustomerStorage, forceAddTestCustomer } from '@/utils/debug-customers';
import { runCompleteDiagnostics, forceSyncStorage, resetStorage } from '@/utils/diagnose-storage';
import { testAsyncStorage } from '@/utils/test-storage';

export default function CustomersScreen() {
  const navigation = useNavigation();
  const { 
    customers, 
    deleteCustomer, 
    searchCustomers,
    getActiveCustomers,
    filterActive,
    setFilterActive,
    initializeWithMockData,
    importCustomers,
    hasHydrated 
  } = useCustomersStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  // Initialize with mock data if no customers exist after hydration
  useEffect(() => {
    if (hasHydrated && customers.length === 0) {
      initializeWithMockData();
    }
  }, [hasHydrated, customers.length, initializeWithMockData]);
  
  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[CustomersScreen] Screen focused, customers:', customers.length);
    });
    
    return unsubscribe;
  }, [navigation, customers.length]);
  
  const filteredCustomers = useMemo(() => {
    let result = searchQuery ? searchCustomers(searchQuery) : customers;
    if (filterActive) {
      result = result.filter(c => c.isActive);
    }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [customers, searchQuery, filterActive]);
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[CustomersScreen] Refreshing, current customers:', customers.length);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [customers.length]);
  
  const handleDeleteCustomer = (id: string) => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteCustomer(id);
            Alert.alert("Success", "Customer deleted successfully");
          }
        }
      ]
    );
  };
  
  const handleExportCustomers = async () => {
    const customersToExport = filterActive ? getActiveCustomers() : customers;
    
    if (customersToExport.length === 0) {
      Alert.alert("No Data", "No customers to export");
      return;
    }
    
    const result = await exportCustomersToCSV(customersToExport);
    
    if (result.success) {
      Alert.alert("Success", `Exported ${customersToExport.length} customers`);
    } else {
      Alert.alert("Error", result.error || "Failed to export customers");
    }
  };
  
  const handleImportCustomers = async () => {
    const result = await importCustomersFromCSV();
    
    if (result.success && result.customers) {
      const importResult = importCustomers(result.customers);
      Alert.alert(
        "Import Complete", 
        `Successfully imported ${importResult.success} customers${importResult.failed > 0 ? ` (${importResult.failed} failed)` : ''}`
      );
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    } else if (result.error) {
      Alert.alert("Import Failed", result.error);
    }
  };
  
  const handleDownloadTemplate = async () => {
    const result = await generateCSVTemplate();
    
    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to generate template");
    }
  };
  
  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) 
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    );
  };
  
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };
  
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      onPress={() => {
        if (isSelectionMode) {
          toggleCustomerSelection(item.id);
        } else {
          navigation.navigate('CustomerDetails', { id: item.id });
        }
      }}
      onLongPress={() => {
        setIsSelectionMode(true);
        toggleCustomerSelection(item.id);
      }}
    >
      <Card style={[
        styles.customerCard,
        selectedCustomers.includes(item.id) && styles.selectedCard
      ]}>
        <View style={styles.customerItem}>
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.customerName}>{item.name}</Text>
                {!item.isActive && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>
              {item.customerType && (
                <View style={[styles.typeBadge, styles[`${item.customerType}Badge`]]}>
                  <Text style={[styles.typeBadgeText, styles[`${item.customerType}BadgeText`]]}>
                    {item.customerType.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </View>
          
          <View style={styles.contactInfo}>
            {item.phone && (
              <View style={styles.contactRow}>
                <Phone size={14} color={colors.textLight} />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            )}
            
            {item.email && (
              <View style={styles.contactRow}>
                <Mail size={14} color={colors.textLight} />
                <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
            
            {item.gstNumber && (
              <View style={styles.contactRow}>
                <Tag size={14} color={colors.textLight} />
                <Text style={styles.contactText}>GST: {item.gstNumber}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <ShoppingCart size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{item.totalTransactions}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <DollarSign size={16} color={colors.success} />
              </View>
              <View>
                <Text style={styles.statValue}>{formatCurrency(item.totalPurchases)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Calendar size={16} color={colors.info} />
              </View>
              <View>
                <Text style={styles.statValue}>
                  {item.lastPurchaseDate ? formatDate(item.lastPurchaseDate) : 'Never'}
                </Text>
                <Text style={styles.statLabel}>Last Purchase</Text>
              </View>
            </View>
          </View>
          
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  const renderHiddenItem = ({ item }: { item: Customer }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteCustomer(item.id)}
      >
        <Trash2 size={20} color={colors.white} />
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Customers',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setFilterActive(!filterActive)}
              >
                <Filter 
                  size={20} 
                  color={filterActive ? colors.primary : colors.gray} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => setShowMoreOptions(true)}
              >
                <MoreVertical size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('AddCustomer')}
              >
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, email, or GST..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray}
          />
        </View>
        
        <View style={styles.filterChips}>
          <TouchableOpacity 
            style={[styles.filterChip, filterActive && styles.activeFilterChip]}
            onPress={() => setFilterActive(!filterActive)}
          >
            <UserCheck size={16} color={filterActive ? colors.white : colors.primary} />
            <Text style={[styles.filterChipText, filterActive && styles.activeFilterChipText]}>
              Active Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {filteredCustomers.length} customers found
        </Text>
        {isSelectionMode && (
          <TouchableOpacity 
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedCustomers([]);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!hasHydrated ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          message="Add your first customer to get started"
          icon={<Users size={64} color={colors.gray} />}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="No matching customers"
          message="Try adjusting your search or filters"
          icon={<Search size={64} color={colors.gray} />}
        />
      ) : (
        <SwipeListView
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddCustomer')}
        activeOpacity={0.8}
      >
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Modal
        visible={showMoreOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreOptions(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>More Options</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowMoreOptions(false);
                handleExportCustomers();
              }}
            >
              <Download size={20} color={colors.text} />
              <Text style={styles.modalOptionText}>Export Customers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowMoreOptions(false);
                handleImportCustomers();
              }}
            >
              <Upload size={20} color={colors.text} />
              <Text style={styles.modalOptionText}>Import Customers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowMoreOptions(false);
                handleDownloadTemplate();
              }}
            >
              <Download size={20} color={colors.text} />
              <Text style={styles.modalOptionText}>Download CSV Template</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { backgroundColor: '#f0f0f0' }]}
              onPress={() => {
                setShowMoreOptions(false);
                debugCustomerStorage();
              }}
            >
              <Text style={styles.modalOptionText}>🐛 Debug Storage</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { backgroundColor: '#f0f0f0' }]}
              onPress={() => {
                setShowMoreOptions(false);
                forceAddTestCustomer();
                handleRefresh();
              }}
            >
              <Text style={styles.modalOptionText}>🧪 Add Test Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { backgroundColor: '#e8f5e9' }]}
              onPress={async () => {
                setShowMoreOptions(false);
                await runCompleteDiagnostics();
              }}
            >
              <Text style={styles.modalOptionText}>🔍 Run Full Diagnostics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { backgroundColor: '#fff3e0' }]}
              onPress={async () => {
                setShowMoreOptions(false);
                await forceSyncStorage();
                handleRefresh();
              }}
            >
              <Text style={styles.modalOptionText}>🔄 Force Sync Storage</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { backgroundColor: '#ffebee' }]}
              onPress={async () => {
                setShowMoreOptions(false);
                Alert.alert(
                  "Reset Storage",
                  "This will clear all customer data. Are you sure?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Reset", 
                      style: "destructive",
                      onPress: async () => {
                        await resetStorage();
                        handleRefresh();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.modalOptionText}>🗑️ Reset Storage</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowMoreOptions(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
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
  filterChips: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.primary,
  },
  activeFilterChipText: {
    color: colors.white,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textLight,
  },
  cancelText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  customerCard: {
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  customerItem: {
    padding: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  inactiveBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.danger + '20',
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  regularBadge: {
    backgroundColor: colors.info + '20',
  },
  regularBadgeText: {
    color: colors.info,
  },
  wholesaleBadge: {
    backgroundColor: colors.warning + '20',
  },
  wholesaleBadgeText: {
    color: colors.warning,
  },
  vipBadge: {
    backgroundColor: colors.success + '20',
  },
  vipBadgeText: {
    color: colors.success,
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 6,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.textLight,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 16,
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 75,
    height: '90%',
    borderRadius: 8,
  },
  backRightBtnRight: {
    backgroundColor: colors.danger,
  },
  backTextWhite: {
    color: colors.white,
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  moreButton: {
    padding: 8,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 16,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
});