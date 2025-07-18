import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useNavigation } from '@react-navigation/native';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  User,
  ChevronRight,
  ArrowLeft,
  Download,
  Upload,
  Users
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useCustomerStore, initializeCustomerStore } from '@/store/customerStore';
import { CustomerWithStats } from '@/types/customer';
import { formatPhoneNumber } from '@/utils/customerValidation';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function CustomerListScreen() {
  const navigation = useNavigation();
  const {
    customers,
    searchQuery,
    isLoading,
    error,
    searchCustomers,
    loadAllCustomers,
    deleteCustomer,
    setError
  } = useCustomerStore();

  const [refreshing, setRefreshing] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Initialize store on mount
  useEffect(() => {
    initializeCustomerStore();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllCustomers();
    setRefreshing(false);
  }, [loadAllCustomers]);

  const handleDeleteCustomer = useCallback((customer: CustomerWithStats) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteCustomer(customer.id);
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        }
      ]
    );
  }, [deleteCustomer]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const renderCustomerItem = useCallback(({ item }: { item: CustomerWithStats }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
      onLongPress={() => handleDeleteCustomer(item)}
    >
      <Card style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <View style={styles.customerAvatar}>
            <User size={24} color={colors.primary} />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.customerMeta}>
              {item.phone && (
                <View style={styles.metaItem}>
                  <Phone size={14} color={colors.textLight} />
                  <Text style={styles.metaText}>{formatPhoneNumber(item.phone)}</Text>
                </View>
              )}
              {item.email && (
                <View style={styles.metaItem}>
                  <Mail size={14} color={colors.textLight} />
                  <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={20} color={colors.gray} />
        </View>
        
        {item.stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Purchases</Text>
              <Text style={styles.statValue}>{formatCurrency(item.stats.totalPurchases)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{item.stats.totalTransactions}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg. Order</Text>
              <Text style={styles.statValue}>
                {item.stats.totalTransactions > 0 
                  ? formatCurrency(item.stats.averageOrderValue)
                  : '₹0'}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  ), [navigation, handleDeleteCustomer]);

  const ListHeader = useMemo(() => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputWrapper}>
        <Search size={20} color={colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, email..."
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
          placeholderTextColor={colors.gray}
          autoCapitalize="none"
        />
      </View>
    </View>
  ), [localSearchQuery]);

  const ListEmpty = useMemo(() => (
    <EmptyState
      title={localSearchQuery ? "No customers found" : "No customers yet"}
      message={localSearchQuery 
        ? "Try adjusting your search" 
        : "Add your first customer to get started"}
      icon={<Users size={64} color={colors.gray} />}
    />
  ), [localSearchQuery]);

  // Show error if any
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      setError(null);
    }
  }, [error, setError]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Customers',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('CustomerImportExport')}
              >
                <Download size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('AddCustomer')}
              >
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {isLoading && customers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputWrapper: {
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
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  customerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  customerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});