import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Linking,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { 
  User, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  Tag,
  FileText,
  Share2,
  UserCheck,
  UserX,
  CreditCard,
  Clock,
  MoreVertical
} from 'lucide-react-native';
import { useCustomersStore, Customer } from '@/store/customersStore';
import { useBillsStore } from '@/store/billsStore';

interface RouteParams {
  id: string;
}

export default function CustomerDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as RouteParams;
  
  const { getCustomerById, updateCustomer, deleteCustomer } = useCustomersStore();
  const { bills } = useBillsStore();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [customerBills, setCustomerBills] = useState<any[]>([]);
  
  useEffect(() => {
    const customerData = getCustomerById(id);
    if (customerData) {
      setCustomer(customerData);
      const customerBillsData = bills.filter(bill => bill.customerId === id);
      setCustomerBills(customerBillsData.sort((a, b) => b.createdAt - a.createdAt));
    }
  }, [id, bills]);
  
  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };
  
  const handleEmail = () => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };
  
  const handleShare = async () => {
    if (!customer) return;
    
    const message = `Customer: ${customer.name}\n${customer.phone ? `Phone: ${customer.phone}\n` : ''}${customer.email ? `Email: ${customer.email}\n` : ''}${customer.address ? `Address: ${customer.address}\n` : ''}`;
    
    try {
      await Share.share({
        message,
        title: 'Customer Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share customer details');
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteCustomer(id);
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  const toggleCustomerStatus = () => {
    if (!customer) return;
    
    updateCustomer(id, { isActive: !customer.isActive });
    setCustomer({ ...customer, isActive: !customer.isActive });
    Alert.alert(
      'Success', 
      `Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`
    );
  };
  
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const getCustomerStats = () => {
    const totalSpent = customer?.totalPurchases || 0;
    const totalOrders = customer?.totalTransactions || 0;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastPurchase = customer?.lastPurchaseDate 
      ? formatDate(customer.lastPurchaseDate) 
      : 'Never';
    
    return { totalSpent, totalOrders, avgOrderValue, lastPurchase };
  };
  
  if (!customer) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          title="Customer not found"
          message="This customer doesn't exist or has been deleted"
          icon={<User size={64} color={colors.gray} />}
        />
      </SafeAreaView>
    );
  }
  
  const stats = getCustomerStats();
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: customer.name,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setShowActions(true)}
            >
              <MoreVertical size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                {customer.isActive ? (
                  <UserCheck size={16} color={colors.success} />
                ) : (
                  <UserX size={16} color={colors.danger} />
                )}
              </View>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.customerType && (
                <View style={[styles.typeBadge, styles[`${customer.customerType}Badge`]]}>
                  <Text style={[styles.typeBadgeText, styles[`${customer.customerType}BadgeText`]]}>
                    {customer.customerType.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            {customer.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Phone size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            {customer.email && (
              <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                <Mail size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {customer.phone && (
            <View style={styles.infoRow}>
              <Phone size={18} color={colors.textLight} />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
          )}
          
          {customer.email && (
            <View style={styles.infoRow}>
              <Mail size={18} color={colors.textLight} />
              <Text style={styles.infoText}>{customer.email}</Text>
            </View>
          )}
          
          {customer.address && (
            <View style={styles.infoRow}>
              <MapPin size={18} color={colors.textLight} />
              <Text style={styles.infoText}>{customer.address}</Text>
            </View>
          )}
          
          {customer.gstNumber && (
            <View style={styles.infoRow}>
              <Tag size={18} color={colors.textLight} />
              <Text style={styles.infoText}>GST: {customer.gstNumber}</Text>
            </View>
          )}
          
          {(!customer.phone && !customer.email && !customer.address && !customer.gstNumber) && (
            <Text style={styles.noDataText}>No contact information available</Text>
          )}
        </Card>
        
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Customer Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <DollarSign size={24} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(stats.totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <ShoppingCart size={24} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <TrendingUp size={24} color={colors.warning} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(stats.avgOrderValue)}</Text>
              <Text style={styles.statLabel}>Avg. Order Value</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Calendar size={24} color={colors.info} />
              </View>
              <Text style={styles.statValue}>{stats.lastPurchase}</Text>
              <Text style={styles.statLabel}>Last Purchase</Text>
            </View>
          </View>
        </Card>
        
        {customer.creditLimit && customer.creditLimit > 0 && (
          <Card style={styles.creditCard}>
            <Text style={styles.sectionTitle}>Credit Information</Text>
            <View style={styles.creditInfo}>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Credit Limit</Text>
                <Text style={styles.creditValue}>{formatCurrency(customer.creditLimit)}</Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Outstanding Balance</Text>
                <Text style={[
                  styles.creditValue,
                  (customer.outstandingBalance || 0) > 0 && styles.creditDanger
                ]}>
                  {formatCurrency(customer.outstandingBalance || 0)}
                </Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Available Credit</Text>
                <Text style={[
                  styles.creditValue,
                  styles.creditSuccess
                ]}>
                  {formatCurrency(customer.creditLimit - (customer.outstandingBalance || 0))}
                </Text>
              </View>
            </View>
          </Card>
        )}
        
        {customer.notes && (
          <Card style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={colors.textLight} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{customer.notes}</Text>
          </Card>
        )}
        
        {customer.tags && customer.tags.length > 0 && (
          <Card style={styles.tagsCard}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {customer.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
        
        <Card style={styles.recentOrdersCard}>
          <View style={styles.recentOrdersHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => {/* Navigate to all orders */}}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {customerBills.length > 0 ? (
            customerBills.slice(0, 5).map((bill) => (
              <TouchableOpacity 
                key={bill.id} 
                style={styles.orderItem}
                onPress={() => {/* Navigate to bill details */}}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{bill.billNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(bill.createdAt)}</Text>
                </View>
                <Text style={styles.orderAmount}>{formatCurrency(bill.total)}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noDataText}>No orders yet</Text>
          )}
        </Card>
        
        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            <Clock size={16} color={colors.textLight} />
            <Text style={styles.metadataText}>
              Customer since {formatDate(customer.createdAt)}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Clock size={16} color={colors.textLight} />
            <Text style={styles.metadataText}>
              Last updated {formatDate(customer.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowActions(false);
                navigation.navigate('AddCustomer', { customerId: id });
              }}
            >
              <Edit2 size={20} color={colors.text} />
              <Text style={styles.modalOptionText}>Edit Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowActions(false);
                toggleCustomerStatus();
              }}
            >
              {customer.isActive ? (
                <>
                  <UserX size={20} color={colors.warning} />
                  <Text style={styles.modalOptionText}>Deactivate Customer</Text>
                </>
              ) : (
                <>
                  <UserCheck size={20} color={colors.success} />
                  <Text style={styles.modalOptionText}>Activate Customer</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={() => {
                setShowActions(false);
                handleDelete();
              }}
            >
              <Trash2 size={20} color={colors.danger} />
              <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>
                Delete Customer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowActions(false)}
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
  moreButton: {
    padding: 8,
    marginRight: 8,
  },
  content: {
    paddingBottom: 24,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  customerName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  creditCard: {
    margin: 16,
    marginBottom: 8,
  },
  creditInfo: {
    marginTop: 8,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  creditLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  creditValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  creditDanger: {
    color: colors.danger,
  },
  creditSuccess: {
    color: colors.success,
  },
  notesCard: {
    margin: 16,
    marginBottom: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  tagsCard: {
    margin: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
  },
  recentOrdersCard: {
    margin: 16,
    marginBottom: 8,
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 16,
    color: colors.primary,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  metadata: {
    padding: 16,
    paddingTop: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  modalOptionDanger: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 24,
  },
  modalOptionText: {
    fontSize: 18,
    color: colors.text,
    marginLeft: 16,
  },
  modalOptionTextDanger: {
    color: colors.danger,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
});