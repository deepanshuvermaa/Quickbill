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
import { 
  FileText, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  ChevronRight, 
  Trash2,
  ArrowLeft
} from 'lucide-react-native';
import { useQuotationsStore } from '@/store/quotationsStore';

export default function QuotationsScreen() {
  const navigation = useNavigation();
  const { quotations, deleteQuotation } = useQuotationsStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredQuotations = quotations.filter(quotation => 
    quotation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quotation.id.includes(searchQuery)
  );
  
  const handleDeleteQuotation = (id: string) => {
    Alert.alert(
      "Delete Quotation",
      "Are you sure you want to delete this quotation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteQuotation(id);
            Alert.alert("Success", "Quotation deleted successfully");
          }
        }
      ]
    );
  };
  
  const renderQuotationItem = ({ item }: { item: any }) => (
    <Card style={styles.quotationCard}>
      <TouchableOpacity onPress={() => navigation.navigate(`/quotations/${item.id}`)}>
        <View style={styles.quotationHeader}>
          <Text style={styles.quotationId}>Quotation #{item.id.substring(0, 8)}</Text>
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => handleDeleteQuotation(item.id)} 
              style={styles.actionButton}
            >
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
            <ChevronRight size={18} color={colors.gray} />
          </View>
        </View>
        
        <View style={styles.quotationInfo}>
          <View style={styles.infoRow}>
            <User size={16} color={colors.textLight} style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.customerName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.textLight} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.quotationFooter}>
          <Text style={styles.itemsCount}>
            {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.totalAmount}>₹{item.total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Quotations',
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
              style={styles.addButton}
              onPress={() => navigation.navigate('/quotations/add')}
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
            placeholder="Search quotations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>
      
      {quotations.length === 0 ? (
        <EmptyState
          title="No quotations yet"
          message="Create your first quotation to see it here"
          icon={<FileText size={64} color={colors.gray} />}
        />
      ) : filteredQuotations.length === 0 ? (
        <EmptyState
          title="No matching quotations"
          message="Try a different search term"
          icon={<Search size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={filteredQuotations}
          keyExtractor={(item) => item.id}
          renderItem={renderQuotationItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.addButtonContainer}>
        <Button
          title="Create New Quotation"
          onPress={() => navigation.navigate('/quotations/add')}
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
    paddingBottom: 8,
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
    paddingBottom: 80,
  },
  quotationCard: {
    marginBottom: 12,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quotationId: {
    fontSize: 16,
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
  quotationInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
  },
  quotationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
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