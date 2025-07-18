import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Calendar,
  DollarSign,
  ShoppingCart,
  Edit3,
  Trash2,
  FileText,
  TrendingUp,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useCustomerStore } from '@/store/customerStore';
import { formatPhoneNumber, formatGSTNumber } from '@/utils/customerValidation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function CustomerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerId = params.id as string;
  
  const { getCustomer, deleteCustomer } = useCustomerStore();
  const [customer, setCustomer] = useState(getCustomer(customerId));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customer) {
      Alert.alert('Error', 'Customer not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [customer]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteCustomer(customerId);
              Alert.alert('Success', 'Customer deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Customer Details',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(`/customers/edit/${customerId}`)}
              >
                <Edit3 size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Customer Header */}
        <Card style={styles.headerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.avatar}>
              <User size={40} color={colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerSince}>
                Customer since {formatDate(customer.createdAt)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(customer.stats.totalPurchases)}
            </Text>
            <Text style={styles.statLabel}>Total Purchases</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIcon}>
              <ShoppingCart size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{customer.stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>
              {customer.stats.totalTransactions > 0
                ? formatCurrency(customer.stats.averageOrderValue)
                : '₹0'}
            </Text>
            <Text style={styles.statLabel}>Avg. Order</Text>
          </Card>
        </View>

        {/* Contact Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {customer.phone && (
            <View style={styles.infoRow}>
              <Phone size={18} color={colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{formatPhoneNumber(customer.phone)}</Text>
              </View>
            </View>
          )}

          {customer.email && (
            <View style={styles.infoRow}>
              <Mail size={18} color={colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{customer.email}</Text>
              </View>
            </View>
          )}

          {customer.address && (
            <View style={styles.infoRow}>
              <MapPin size={18} color={colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{customer.address}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Business Information */}
        {customer.gstNumber && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Business Information</Text>
            
            <View style={styles.infoRow}>
              <Tag size={18} color={colors.textLight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>GST Number</Text>
                <Text style={styles.infoValue}>{formatGSTNumber(customer.gstNumber)}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Additional Information */}
        {(customer.notes || (customer.tags && customer.tags.length > 0)) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            {customer.notes && (
              <View style={styles.infoRow}>
                <FileText size={18} color={colors.textLight} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{customer.notes}</Text>
                </View>
              </View>
            )}

            {customer.tags && customer.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.infoLabel}>Tags</Text>
                <View style={styles.tags}>
                  {customer.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Activity Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          
          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.textLight} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Purchase</Text>
              <Text style={styles.infoValue}>
                {customer.stats.lastPurchaseDate
                  ? formatDate(customer.stats.lastPurchaseDate)
                  : 'No purchases yet'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.textLight} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(customer.updatedAt)}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Edit Customer"
          onPress={() => router.push(`/customers/edit/${customerId}`)}
          icon={<Edit3 size={20} color={colors.white} />}
          fullWidth
        />
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  headerCard: {
    margin: 16,
    padding: 20,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  customerSince: {
    fontSize: 14,
    color: colors.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});