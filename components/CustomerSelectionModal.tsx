import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { useCustomerStore } from '@/store/customerStore';
import { CustomerWithStats } from '@/types/customer';
import { formatPhoneNumber } from '@/utils/customerValidation';
import {
  X,
  Search,
  User,
  Phone,
  Plus,
  Check,
  Clock,
} from 'lucide-react-native';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState } from './EmptyState';

interface CustomerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customerId: string | null, customerName: string, customerPhone?: string) => void;
  selectedCustomerId: string | null;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  visible,
  onClose,
  onSelectCustomer,
  selectedCustomerId,
}) => {
  const { customers, recentCustomers, searchCustomers, loadRecentCustomers } = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRecentCustomers();
    }
  }, [visible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        searchCustomers(searchQuery);
        setShowAllCustomers(true);
        setIsSearching(false);
      } else {
        setShowAllCustomers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCustomer = (customer: CustomerWithStats | null) => {
    if (customer) {
      onSelectCustomer(customer.id, customer.name, customer.phone);
    } else {
      onSelectCustomer(null, '', '');
    }
    onClose();
  };

  const handleQuickAdd = () => {
    const trimmedName = searchQuery.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a customer name');
      return;
    }

    // For quick add, we'll pass the name as-is and let the billing screen handle creation
    onSelectCustomer(null, trimmedName, '');
    setSearchQuery('');
    onClose();
  };

  const displayCustomers = showAllCustomers ? customers : recentCustomers;

  const renderCustomerItem = ({ item }: { item: CustomerWithStats }) => {
    const isSelected = item.id === selectedCustomerId;
    
    return (
      <TouchableOpacity
        onPress={() => handleSelectCustomer(item)}
        style={[styles.customerItem, isSelected && styles.selectedItem]}
      >
        <View style={styles.customerAvatar}>
          <User size={20} color={isSelected ? colors.white : colors.primary} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          <View style={styles.customerMeta}>
            {item.phone && (
              <View style={styles.metaItem}>
                <Phone size={12} color={isSelected ? colors.white : colors.textLight} />
                <Text style={[styles.metaText, isSelected && styles.selectedText]}>
                  {formatPhoneNumber(item.phone)}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, isSelected && styles.selectedText]}>
                ₹{item.stats.totalPurchases.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkIcon}>
            <Check size={20} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Customer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Search size={20} color={colors.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.gray}
                autoCapitalize="none"
              />
            </View>
          </View>

          {!showAllCustomers && recentCustomers.length > 0 && (
            <View style={styles.sectionHeader}>
              <Clock size={16} color={colors.textLight} />
              <Text style={styles.sectionTitle}>Recent Customers</Text>
            </View>
          )}

          {selectedCustomerId && (
            <TouchableOpacity
              style={styles.clearSelection}
              onPress={() => handleSelectCustomer(null)}
            >
              <Text style={styles.clearSelectionText}>Clear Selection</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={displayCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomerItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <Card style={styles.quickAddCard}>
                  <Text style={styles.quickAddText}>
                    No customer found with "{searchQuery}"
                  </Text>
                  <Button
                    title={`Quick Add "${searchQuery}"`}
                    onPress={handleQuickAdd}
                    icon={<Plus size={18} color={colors.white} />}
                    style={styles.quickAddButton}
                  />
                </Card>
              ) : (
                <EmptyState
                  title="No customers yet"
                  message="Add your first customer to see them here"
                  icon={<User size={48} color={colors.gray} />}
                />
              )
            }
          />

          <View style={styles.footer}>
            <Button
              title="Continue Without Customer"
              onPress={() => handleSelectCustomer(null)}
              variant="outline"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  clearSelection: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  clearSelectionText: {
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    alignItems: 'center',
    gap: 16,
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
  selectedText: {
    color: colors.white,
  },
  checkIcon: {
    marginLeft: 12,
  },
  quickAddCard: {
    padding: 20,
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickAddButton: {
    paddingHorizontal: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});