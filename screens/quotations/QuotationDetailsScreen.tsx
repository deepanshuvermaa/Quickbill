import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { useQuotationsStore } from '@/store/quotationsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { 
  ArrowLeft, 
  Share2, 
  Trash2, 
  User, 
  Phone, 
  Calendar, 
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react-native';

export default function QuotationDetailsScreen() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { quotations, deleteQuotation, updateQuotationStatus } = useQuotationsStore();
  const { businessInfo } = useSettingsStore();
  
  const quotation = quotations.find(q => q.id === id);
  
  if (!quotation) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Quotation Not Found',
            headerLeft: () => (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Quotation not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const formattedDate = new Date(quotation.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  const formattedValidUntil = new Date(quotation.validUntil).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  const isExpired = new Date(quotation.validUntil) < new Date();
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Quotation",
      "Are you sure you want to delete this quotation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteQuotation(quotation.id);
            Alert.alert("Success", "Quotation deleted successfully");
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  const handleShare = async () => {
    try {
      const quotationText = `
${businessInfo.name}
${businessInfo.address}

QUOTATION #${quotation.id.substring(5, 13)}
Date: ${formattedDate}
Valid Until: ${formattedValidUntil}

Customer: ${quotation.customerName}
${quotation.customerPhone ? `Phone: ${quotation.customerPhone}` : ''}

ITEMS:
${quotation.items.map(item => `${item.name} x ${item.quantity} = ₹${item.total.toFixed(2)}`).join('\n')}

Subtotal: ₹${quotation.subtotal.toFixed(2)}
Tax: ₹${quotation.tax.toFixed(2)}
Discount: ₹${quotation.discount.toFixed(2)}
Total: ₹${quotation.total.toFixed(2)}

${quotation.notes ? `Notes: ${quotation.notes}` : ''}

Thank you for your business!
`;

      await Share.share({
        message: quotationText,
        title: `Quotation #${quotation.id.substring(5, 13)}`,
      });
    } catch (error) {
      console.error('Error sharing quotation:', error);
      Alert.alert('Error', 'Failed to share quotation');
    }
  };
  
  const handleStatusChange = (status: 'accepted' | 'rejected') => {
    Alert.alert(
      `Mark as ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      `Are you sure you want to mark this quotation as ${status}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            updateQuotationStatus(quotation.id, status);
            Alert.alert("Success", `Quotation marked as ${status}`);
          }
        }
      ]
    );
  };
  
  const getStatusBadge = () => {
    if (isExpired && quotation.status === 'pending') {
      return (
        <View style={[styles.statusBadge, styles.expiredBadge]}>
          <Clock size={16} color={colors.white} />
          <Text style={styles.statusText}>Expired</Text>
        </View>
      );
    }
    
    switch (quotation.status) {
      case 'accepted':
        return (
          <View style={[styles.statusBadge, styles.acceptedBadge]}>
            <CheckCircle size={16} color={colors.white} />
            <Text style={styles.statusText}>Accepted</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, styles.rejectedBadge]}>
            <XCircle size={16} color={colors.white} />
            <Text style={styles.statusText}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Clock size={16} color={colors.white} />
            <Text style={styles.statusText}>Pending</Text>
          </View>
        );
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: `Quotation #${quotation.id.substring(5, 13)}`,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Share2 size={24} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Trash2 size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.businessCard}>
          <Text style={styles.businessName}>{businessInfo.name}</Text>
          <Text style={styles.businessAddress}>{businessInfo.address}</Text>
          {businessInfo.phone && (
            <Text style={styles.businessContact}>Phone: {businessInfo.phone}</Text>
          )}
          {businessInfo.email && (
            <Text style={styles.businessContact}>Email: {businessInfo.email}</Text>
          )}
        </Card>
        
        <Card style={styles.quotationInfoCard}>
          <View style={styles.quotationHeader}>
            <View>
              <Text style={styles.quotationTitle}>
                Quotation #{quotation.id.substring(5, 13)}
              </Text>
              <Text style={styles.quotationDate}>Created on {formattedDate}</Text>
            </View>
            {getStatusBadge()}
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{quotation.customerName}</Text>
              </View>
            </View>
            
            {quotation.customerPhone && (
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Phone size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{quotation.customerPhone}</Text>
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.validityContainer}>
            <View style={styles.infoIconContainer}>
              <Calendar size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Valid Until</Text>
              <Text style={[
                styles.infoValue,
                isExpired && styles.expiredText
              ]}>
                {formattedValidUntil} {isExpired && '(Expired)'}
              </Text>
            </View>
          </View>
        </Card>
        
        <Card style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemHeaderText, styles.itemNameHeader]}>Item</Text>
            <Text style={[styles.itemHeaderText, styles.itemQuantityHeader]}>Qty</Text>
            <Text style={[styles.itemHeaderText, styles.itemPriceHeader]}>Price</Text>
            <Text style={[styles.itemHeaderText, styles.itemTotalHeader]}>Total</Text>
          </View>
          
          {quotation.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
              <Text style={styles.itemQuantity}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
              <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{quotation.subtotal.toFixed(2)}</Text>
            </View>
            
            {quotation.tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>₹{quotation.tax.toFixed(2)}</Text>
              </View>
            )}
            
            {quotation.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.discountValue}>-₹{quotation.discount.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{quotation.total.toFixed(2)}</Text>
            </View>
          </View>
        </Card>
        
        {quotation.notes && (
          <Card style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <FileText size={18} color={colors.textLight} style={styles.notesIcon} />
              <Text style={styles.notesText}>{quotation.notes}</Text>
            </View>
          </Card>
        )}
        
        {quotation.status === 'pending' && !isExpired && (
          <View style={styles.actionButtons}>
            <Button
              title="Mark as Rejected"
              onPress={() => handleStatusChange('rejected')}
              variant="outline"
              icon={<XCircle size={18} color={colors.primary} />}
              style={styles.rejectButton}
            />
            
            <Button
              title="Mark as Accepted"
              onPress={() => handleStatusChange('accepted')}
              icon={<CheckCircle size={18} color={colors.white} />}
              style={styles.acceptButton}
            />
          </View>
        )}
        
        {quotation.status === 'accepted' && (
          <Button
            title="Convert to Bill"
            onPress={() => {
              // In a real app, this would create a bill from the quotation
              Alert.alert("Convert to Bill", "This would create a new bill from this quotation");
            }}
            style={styles.convertButton}
          />
        )}
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
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  businessCard: {
    marginBottom: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  businessContact: {
    fontSize: 14,
    color: colors.textLight,
  },
  quotationInfoCard: {
    marginBottom: 16,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  quotationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  quotationDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadge: {
    backgroundColor: colors.info,
  },
  acceptedBadge: {
    backgroundColor: colors.success,
  },
  rejectedBadge: {
    backgroundColor: colors.danger,
  },
  expiredBadge: {
    backgroundColor: colors.gray,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  expiredText: {
    color: colors.danger,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  itemHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  itemNameHeader: {
    flex: 3,
  },
  itemQuantityHeader: {
    flex: 1,
    textAlign: 'center',
  },
  itemPriceHeader: {
    flex: 2,
    textAlign: 'right',
  },
  itemTotalHeader: {
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  itemName: {
    flex: 3,
    fontSize: 16,
    color: colors.text,
  },
  itemQuantity: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 2,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  itemTotal: {
    flex: 2,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  summaryContainer: {
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  notesCard: {
    marginBottom: 16,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notesText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rejectButton: {
    flex: 1,
    marginRight: 8,
  },
  acceptButton: {
    flex: 1,
  },
  convertButton: {
    marginBottom: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 16,
  },
});