import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useItemsStore } from '@/store/itemsStore';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { createBillFromCart } from '@/store/billsStore';
import { ItemCardEnhanced } from '@/components/ItemCardEnhanced';
import { CartBottomSheet } from '@/components/CartBottomSheet';
import { CartBottomBar } from '@/components/CartBottomBar';
import { EmptyState } from '@/components/EmptyState';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { 
  Search, 
  ShoppingCart, 
  Menu,
  Grid3x3,
  List,
  Package,
} from 'lucide-react-native';
import { 
  ensureBluetoothReady, 
  PrinterDevice, 
  printBillToPrinter,
  testPrinterConnection
} from '@/utils/bluetooth-print';
import { Item, CartItem, PaymentMethod } from '@/types';
import { printOrShareBill } from '@/utils/print';
import { useBillsStore } from '@/store/billsStore';
import { useHamburgerMenu } from '../../_layout';
import { useCustomerStore } from '@/store/customerStore';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function BillingScreen() {
  const router = useRouter();
  const { toggleMenu } = useHamburgerMenu();
  const { items, initializeWithMockData, checkStockAvailability } = useItemsStore();
  const { bills, getBillById, deleteBill } = useBillsStore();
  const { primaryPrinter, setPrimaryPrinter, taxConfig, defaultTaxRate } = useSettingsStore();
  const { updateCustomerStats, createCustomer, loadAllCustomers } = useCustomerStore();
  const { 
    items: cartItems, 
    customerName, 
    customerPhone, 
    notes, 
    discount, 
    tax, 
    paymentMethod,
    addItem, 
    updateItemQuantity, 
    removeItem, 
    clearCart,
    setCustomerName,
    setCustomerPhone,
    setNotes,
    setDiscount,
    setTax,
    setPaymentMethod,
    getSubtotal,
    getSubtotalWithItemTax,
    getItemsTaxTotal,
    getBillTaxableAmount,
    getBillTax,
    getTotal,
  } = useCartStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Initialize with mock data if no items exist
  useEffect(() => {
    if (items.length === 0) {
      initializeWithMockData();
    }
    // Initialize customers
    loadAllCustomers();
  }, [items.length, initializeWithMockData, loadAllCustomers]);
  
  // Initialize tax with default value when cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && tax === 0) {
      // Use GST config if available and set as default, otherwise use defaultTaxRate
      const defaultTax = taxConfig?.isDefault ? taxConfig.igst : defaultTaxRate;
      setTax(defaultTax);
    }
  }, [cartItems.length, tax, taxConfig, defaultTaxRate, setTax]);
  
  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  
  // Filter items based on search query and selected category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Get quantity in cart for an item
  const getQuantityInCart = (itemId: string): number => {
    const cartItem = cartItems.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };
  
  // Handle add to cart with single tap
  const handleItemPress = (item: Item) => {
    const currentQuantity = getQuantityInCart(item.id);
    
    if (currentQuantity === 0) {
      // Check stock availability
      const stockCheck = checkStockAvailability(item.id, 1);
      
      if (!stockCheck.available && typeof stockCheck.currentStock === 'number') {
        Alert.alert(
          "Insufficient Stock",
          `Only ${stockCheck.currentStock} units of "${item.name}" available in stock.`
        );
        return;
      }
      
      addItem(item, 1);
    }
  };
  
  // Handle quantity update
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Check stock availability
    const stockCheck = checkStockAvailability(itemId, newQuantity);
    
    if (!stockCheck.available && typeof stockCheck.currentStock === 'number') {
      Alert.alert(
        "Insufficient Stock",
        `Only ${stockCheck.currentStock} units of "${item.name}" available in stock.`
      );
      return;
    }
    
    updateItemQuantity(itemId, newQuantity);
  };

  const handleSelectCustomer = (customerId: string | null, name: string, phone?: string) => {
    setSelectedCustomerId(customerId);
    setCustomerName(name);
    if (phone) {
      setCustomerPhone(phone);
    } else {
      setCustomerPhone('');
    }
  };
  
  const handleCreateBill = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Error", "Cart is empty. Please add items to create a bill.");
      return;
    }
    
    if (!customerName.trim()) {
      Alert.alert("Error", "Please enter customer name.");
      return;
    }
    
    setIsCreatingBill(true);
    
    try {
      // Create the bill
      const billId = await createBillFromCart();
      setCreatedBillId(billId);
      
      // Handle customer - either update existing or create new
      let finalCustomerId = selectedCustomerId;
      
      if (!selectedCustomerId && customerPhone.trim()) {
        // Create new customer if phone is provided but no customer selected
        const newCustomer = createCustomer({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          createdFrom: 'billing',
        });
        if (newCustomer) {
          finalCustomerId = newCustomer.id;
        }
      }
      
      // Update customer stats if we have a customer ID
      if (finalCustomerId) {
        const total = getTotal();
        updateCustomerStats(finalCustomerId, total);
      }
      
      // Show success message
      Alert.alert(
        "Bill Created", 
        "Bill has been created successfully. Would you like to print it?",
        [
          { 
            text: "Later", 
            style: "cancel",
            onPress: () => {
              clearCart();
              setShowCart(false);
              setSelectedCustomerId(null);
            }
          },
          { 
            text: Platform.OS === 'web' ? "Print/Share" : "Print", 
            onPress: async () => {
              const bill = getBillById(billId);
              if (bill) {
                if (Platform.OS === 'web') {
                  await printOrShareBill(bill);
                } else {
                  await handleBluetoothPrint(bill);
                }
              }
              clearCart();
              setShowCart(false);
              setSelectedCustomerId(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating bill:', error);
      Alert.alert("Error", "Failed to create bill. Please try again.");
    } finally {
      setIsCreatingBill(false);
    }
  };
  
  const handleBluetoothPrint = async (bill: any) => {
    const bluetoothReady = await ensureBluetoothReady();
    if (!bluetoothReady) {
      Alert.alert("Bluetooth Required", "Please enable Bluetooth to print receipts.");
      return;
    }
    
    // Check if there's a primary printer set
    if (primaryPrinter) {
      const connectionWorking = await testPrinterConnection();
      
      if (connectionWorking) {
        try {
          await printBillToPrinter(bill, {
            id: primaryPrinter.address,
            name: primaryPrinter.name,
            address: primaryPrinter.address,
            paired: true,
            connected: true,
            type: 'thermal',
            paperWidth: '58mm'
          });
          Alert.alert("Success", `Bill sent to ${primaryPrinter.name} successfully`);
        } catch (error) {
          setShowPrinterModal(true);
        }
      } else {
        setShowPrinterModal(true);
      }
    } else {
      setShowPrinterModal(true);
    }
  };
  
  const handlePrinterSelected = async (printer: PrinterDevice) => {
    setShowPrinterModal(false);
    
    if (createdBillId) {
      const bill = getBillById(createdBillId);
      if (bill) {
        try {
          const success = await printBillToPrinter(bill, printer);
          
          if (success) {
            setPrimaryPrinter({
              id: printer.id,
              name: printer.name,
              address: printer.address
            });
            Alert.alert("Success", `Bill sent to ${printer.name} successfully`);
          } else {
            Alert.alert("Error", "Failed to print bill");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to print bill");
        }
      }
    }
  };
  
  const renderItem = ({ item }: { item: Item }) => (
    <ItemCardEnhanced
      item={item}
      onPress={() => handleItemPress(item)}
      showAddButton={true}
      isGridView={isGridView}
      quantityInCart={getQuantityInCart(item.id)}
      onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
    />
  );
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Billing',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={toggleMenu}
              style={styles.menuButton}
            >
              <Menu size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsGridView(!isGridView)}
              style={styles.viewToggle}
            >
              {isGridView ? (
                <List size={24} color={colors.text} />
              ) : (
                <Grid3x3 size={24} color={colors.text} />
              )}
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* Search Bar */}
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
      
      {/* Category Pills */}
      {categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesList}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryChipText,
              !selectedCategory && styles.selectedCategoryChipText
            ]}>
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
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.selectedCategoryChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Items List/Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No items found"
          message="Try a different search term or category"
          icon={<Package size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.itemsList,
            isGridView && styles.gridList
          ]}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? 'grid' : 'list'}
          columnWrapperStyle={isGridView ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Cart Bottom Bar */}
      <CartBottomBar
        itemCount={cartItems.length}
        total={getTotal()}
        onPress={() => setShowCart(true)}
      />
      
      {/* Cart Bottom Sheet */}
      <CartBottomSheet
        visible={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        customerName={customerName}
        customerPhone={customerPhone}
        notes={notes}
        discount={discount}
        tax={tax}
        paymentMethod={paymentMethod}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onSetCustomerName={setCustomerName}
        onSetCustomerPhone={setCustomerPhone}
        onSetNotes={setNotes}
        onSetDiscount={setDiscount}
        onSetTax={setTax}
        onSetPaymentMethod={setPaymentMethod}
        onCreateBill={handleCreateBill}
        isCreatingBill={isCreatingBill}
        getItemsTaxTotal={getItemsTaxTotal}
        getBillTax={getBillTax}
        getSubtotal={getSubtotal}
        getTotal={getTotal}
        onSelectCustomer={handleSelectCustomer}
        onOpenCustomerModal={() => setShowCustomerModal(true)}
        selectedCustomerId={selectedCustomerId}
      />
      
      {/* Printer Selection Modal */}
      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={handlePrinterSelected}
      />
      
      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={handleSelectCustomer}
        selectedCustomerId={selectedCustomerId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  viewToggle: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
  categoriesContainer: {
    minHeight: 60,
    maxHeight: 60,
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 15,
    color: colors.textLight,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: colors.white,
    fontWeight: '600',
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  gridList: {
    paddingHorizontal: 8,
    paddingBottom: 120,
  },
  gridRow: {
    paddingHorizontal: 8,
    gap: 8,
  },
});