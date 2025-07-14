import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Users, Plus, Search, Phone, Mail, MapPin, ChevronRight, Trash2, ArrowLeft } from 'lucide-react-native';
import { useCustomersStore } from '@/store/customersStore';

export default function CustomersScreen() {
  const navigation = useNavigation();
  const { customers, deleteCustomer } = useCustomersStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
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
  
  const renderCustomerItem = ({ item }: { item: any }) => (
    <Card>
      <TouchableOpacity onPress={() => navigation.navigate('CustomerDetails', { id: item.id })}>
        <View style={styles.customerItem}>
          <View style={styles.customerHeader}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={() => handleDeleteCustomer(item.id)} 
                style={styles.actionButton}
              >
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
              <ChevronRight size={18} color={colors.gray} />
            </View>
          </View>
          
          {item.phone && (
            <View style={styles.contactRow}>
              <Phone size={16} color={colors.textLight} style={styles.contactIcon} />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
          
          {item.email && (
            <View style={styles.contactRow}>
              <Mail size={16} color={colors.textLight} style={styles.contactIcon} />
              <Text style={styles.contactText}>{item.email}</Text>
            </View>
          )}
          
          {item.address && (
            <View style={styles.contactRow}>
              <MapPin size={16} color={colors.textLight} style={styles.contactIcon} />
              <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">
                {item.address}
              </Text>
            </View>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.totalBills || 0}</Text>
              <Text style={styles.statLabel}>Bills</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{(item.totalSpent || 0).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.statLabel}>Since</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('/customers/add')}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>
      
      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          message="Add your first customer to see it here"
          icon={<Users size={64} color={colors.gray} />}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="No matching customers"
          message="Try a different search term"
          icon={<Search size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.addButtonContainer}>
        <Button
          title="Add New Customer"
          onPress={() => navigation.navigate('/customers/add')}
          icon={<Plus size={20} color={colors.white} />}
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 6,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
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
    padding: 16,
    paddingBottom: 60,
  },
  customerItem: {
    padding: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  addButtonContainer: {
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