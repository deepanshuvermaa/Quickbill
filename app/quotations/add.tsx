import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useItemsStore } from '@/store/itemsStore';
import { useQuotationsStore } from '@/store/quotationsStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ItemCard } from '@/components/ItemCard';
import { CartItemCard } from '@/components/CartItemCard';
import { 
  User, 
  Phone, 
  Calendar, 
  Percent, 
  FileText, 
  Search,
  Plus,
  Trash2
} from 'lucide-react-native';

export default function AddQuotationScreen() {
  const router = useRouter();
  const { items } = useItemsStore();
  const { addQuotation } = useQuotationsStore();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('2');
  const [tax, setTax] = useState('7');
  
  // Set validity to 7 days from now
  const [validUntilDate, setValidUntilDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [validUntil, setValidUntil] = useState(
    validUntilDate.toLocaleDateString()
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  
  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleAddItem = (item: any) => {
    const existingItemIndex = selectedItems.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Item already exists, update quantity
      const newItems = [...selectedItems];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + 1,
        total: item.price * (newItems[existingItemIndex].quantity + 1)
      };
      setSelectedItems(newItems);
    } else {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          ...item,
          quantity: 1,
          total: item.price
        }
      ]);
    }
  };
  
  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    setSelectedItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity, total: item.price * quantity } 
          : item
      )
    );
  };
  
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  const getSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };
  
  const getTotal = () => {
    const subtotal = getSubtotal();
    const taxRate = parseFloat(tax) / 100;
    const discountRate = parseFloat(discount) / 100;
    
    // First add tax to subtotal
    const subtotalWithTax = subtotal + (subtotal * taxRate);
    
    // Then apply discount to the subtotal with tax
    const discountAmount = subtotalWithTax * discountRate;
    
    return subtotalWithTax - discountAmount;
  };
  
  const handleCreateQuotation = () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please add at least one item to the quotation");
      return;
    }
    
    if (!customerName.trim()) {
      Alert.alert("Error", "Please enter customer name");
      return;
    }
    
    try {
      const quotationId = addQuotation({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: selectedItems,
        subtotal: getSubtotal(),
        tax: getSubtotal() * (parseFloat(tax) / 100),
        discount: (getSubtotal() + getSubtotal() * (parseFloat(tax) / 100)) * (parseFloat(discount) / 100),
        total: getTotal(),
        notes: notes.trim(),
        validUntil: validUntilDate.getTime(),
        status: 'pending'
      });
      
      Alert.alert(
        "Success",
        "Quotation created successfully",
        [
          { 
            text: "View Quotation", 
            onPress: () => router.push(`/quotations/${quotationId}`)
          },
          { 
            text: "OK", 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("Error creating quotation:", error);
      Alert.alert("Error", "Failed to create quotation. Please try again.");
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Create Quotation' }} />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollContent}>
          <Card>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
            <Input
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              leftIcon={<User size={18} color={colors.gray} />}
            />
            
            <Input
              label="Phone Number (Optional)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={colors.gray} />}
            />
            
            <Input
              label="Valid Until"
              value={validUntil}
              onChangeText={setValidUntil}
              placeholder="DD/MM/YYYY"
              leftIcon={<Calendar size={18} color={colors.gray} />}
              editable={false}
            />
            <Text style={styles.validityNote}>Quotation valid for 7 days from today</Text>
          </Card>
          
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Add Items</Text>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={colors.gray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search items..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>
            
            <View style={styles.itemsContainer}>
              {filteredItems.length === 0 ? (
                <Text style={styles.noItemsText}>No items found</Text>
              ) : (
                filteredItems.slice(0, 5).map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onPress={() => handleAddItem(item)}
                    showAddButton
                  />
                ))
              )}
              
              {filteredItems.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => {
                    // In a real app, this would show a modal with all items
                    Alert.alert("View More", "This would show all matching items");
                  }}
                >
                  <Text style={styles.viewMoreText}>View more items...</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
          
          <Card style={styles.card}>
            <View style={styles.selectedItemsHeader}>
              <Text style={styles.sectionTitle}>Selected Items</Text>
              {selectedItems.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      "Clear Items",
                      "Are you sure you want to remove all items?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Clear", 
                          style: "destructive",
                          onPress: () => setSelectedItems([])
                        }
                      ]
                    );
                  }}
                >
                  <Trash2 size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            
            {selectedItems.length === 0 ? (
              <Text style={styles.noItemsText}>No items selected</Text>
            ) : (
              selectedItems.map(item => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onIncrement={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                  onDecrement={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              ))
            )}
          </Card>
          
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Quotation Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{getSubtotal().toFixed(2)}</Text>
            </View>
            
            <View style={styles.taxDiscountContainer}>
              <View style={styles.taxDiscountInput}>
                <Input
                  label="Tax (%)"
                  value={tax}
                  onChangeText={setTax}
                  keyboardType="numeric"
                  leftIcon={<Percent size={18} color={colors.gray} />}
                />
              </View>
              
              <View style={styles.taxDiscountInput}>
                <Input
                  label="Discount (%)"
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  leftIcon={<Percent size={18} color={colors.gray} />}
                />
              </View>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{getTotal().toFixed(2)}</Text>
            </View>
          </Card>
          
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this quotation"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              leftIcon={<FileText size={18} color={colors.gray} />}
            />
          </Card>
          
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
            
            <Button
              title="Create Quotation"
              onPress={handleCreateQuotation}
              icon={<Plus size={18} color={colors.white} />}
              style={styles.createButton}
              disabled={selectedItems.length === 0}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  validityNote: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 16,
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
  itemsContainer: {
    marginBottom: 8,
  },
  noItemsText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: 16,
  },
  viewMoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  selectedItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  taxDiscountContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  taxDiscountInput: {
    flex: 1,
    marginRight: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    flex: 2,
  },
});