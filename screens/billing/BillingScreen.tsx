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
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { useItemsStore } from '@/store/itemsStore';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { createBillFromCart } from '@/store/billsStore';
import { ItemCard } from '@/components/ItemCard';
import { CartItemCard } from '@/components/CartItemCard';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Phone, 
  FileText, 
  Trash2,
  Bluetooth,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Users
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
import { useCustomerStore } from '@/store/customerStore';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';
// Hamburger menu import removed

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 380;
const isLargeScreen = width > 768;

export default function BillingScreen() {
  const navigation = useNavigation();
  // Hamburger menu hook removed
  const { items, initializeWithMockData, checkStockAvailability, updateItemStock } = useItemsStore();
  const { bills, getBillById, deleteBill } = useBillsStore();
  const { primaryPrinter, setPrimaryPrinter } = useSettingsStore();
  const { 
    items: cartItems, 
    customerId,
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
    setCustomerId,
    setCustomerName,
    setCustomerPhone,
    setCustomerDetails,
    setNotes,
    setDiscount,
    setTax,
    setPaymentMethod,
    getSubtotal,
    getTotal,
    autoShowCart
  } = useCartStore();
  
  const { updateCustomerStats } = useCustomerStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  const handleSelectCustomer = (customer) => {
    setCustomerDetails(customer.id, customer.name, customer.phone || '');
    setShowCustomerModal(false);
  };
  
  // Initialize with mock data if no items exist
  useEffect(() => {
    if (items.length === 0) {
      initializeWithMockData();
    }
  }, [items.length, initializeWithMockData]);
  
  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  
  // Filter items based on search query and selected category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Auto-show cart when items are added only if autoShowCart is true
  useEffect(() => {
    if (cartItems.length > 0 && autoShowCart) {
      setIsCartVisible(true);
    }
  }, [cartItems.length, autoShowCart]);
  
  const handleAddToCart = (item: Item) => {
    // Check stock availability before adding to cart
    const stockCheck = checkStockAvailability(item.id, 1);
    
    if (!stockCheck.available && typeof stockCheck.currentStock === 'number') {
      Alert.alert(
        "Insufficient Stock",
        `Only ${stockCheck.currentStock} units of "${item.name}" available in stock.`
      );
      return;
    }
    
    addItem(item, 1);
  };
  
  const handleUpdateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // If quantity is zero or negative, remove the item
      removeItem(itemId);
      return;
    }
    
    // Get the current quantity in cart
    const currentItem = cartItems.find(item => item.id === itemId);
    if (!currentItem) return;
    
    // Only check stock if increasing quantity
    if (newQuantity > currentItem.quantity) {
      // Check if we have enough stock
      const stockCheck = checkStockAvailability(itemId, newQuantity);
      
      if (!stockCheck.available && typeof stockCheck.currentStock === 'number') {
        Alert.alert(
          "Insufficient Stock",
          `Only ${stockCheck.currentStock} units of "${currentItem.name}" available in stock.`
        );
        return;
      }
    }
    
    // Update the quantity
    updateItemQuantity(itemId, newQuantity);
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
    
    // Check stock availability for all items before creating bill
    let insufficientStock = false;
    let itemWithInsufficientStock = '';
    let availableStock = 0;
    
    for (const item of cartItems) {
      const stockCheck = checkStockAvailability(item.id, item.quantity);
      
      if (!stockCheck.available) {
        insufficientStock = true;
        itemWithInsufficientStock = item.name;
        availableStock = stockCheck.currentStock || 0;
        break;
      }
    }
    
    if (insufficientStock) {
      Alert.alert(
        "Insufficient Stock",
        `Only ${availableStock} units of "${itemWithInsufficientStock}" available in stock.`
      );
      return;
    }
    
    setIsCreatingBill(true);
    
    try {
      // Create the bill
      const billId = await createBillFromCart();
      setCreatedBillId(billId);
      
      // Update inventory stock for each item in the bill
      for (const item of cartItems) {
        updateItemStock(item.id, -item.quantity); // Reduce stock by the quantity sold
      }
      
      // Update customer stats if a customer is selected
      if (customerId) {
        const total = getTotal();
        updateCustomerStats(customerId, total);
      }
      
      // Auto-clear cart after successful bill creation
      clearCart();
      
      Alert.alert(
        "Success",
        "Bill created successfully!",
        [
          { 
            text: "View Bill", 
            onPress: () => navigation.navigate('BillDetails', { id: billId })
          },
          { 
            text: "Print Bill", 
            onPress: () => handlePrintBill(billId)
          },
          { 
            text: "Share Bill", 
            onPress: () => handleShareBill(billId)
          },
          { 
            text: "Delete Bill", 
            style: "destructive",
            onPress: () => handleDeleteBill()
          },
          { 
            text: "New Bill", 
            onPress: () => {
              // Reset the form for a new bill (cart already cleared)
              setCreatedBillId(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error creating bill:", error);
      Alert.alert("Error", "Failed to create bill. Please try again.");
    } finally {
      setIsCreatingBill(false);
    }
  };
  
  const handlePrintBill = async (billId: string) => {
    const bill = getBillById(billId);
    if (!bill) {
      Alert.alert("Error", "Bill not found");
      return;
    }
    
    if (Platform.OS === 'web') {
      printOrShareBill(bill);
      return;
    }
    
    setIsPrinting(true);
    
    try {
      // Check if Bluetooth is enabled
      const bluetoothReady = await ensureBluetoothReady();
      if (!bluetoothReady) {
        Alert.alert(
          "Bluetooth Required",
          "Please enable Bluetooth to print receipts.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Settings", 
              onPress: () => {
                // In a real implementation, we would open Bluetooth settings
                console.log("Opening Bluetooth settings...");
              }
            }
          ]
        );
        setIsPrinting(false);
        return;
      }
      
      // Check if there's a primary printer set
      if (primaryPrinter) {
        // Test connection to primary printer
        const connectionWorking = await testPrinterConnection(primaryPrinter);
        
        if (connectionWorking) {
          // Print directly to primary printer
          try {
            const success = await printBillToPrinter(bill, primaryPrinter);
            
            if (success) {
              Alert.alert("Success", `Bill sent to ${primaryPrinter.name} successfully`);
            } else {
              // Connection failed, show options
              Alert.alert(
                "Print Failed",
                `Failed to print to ${primaryPrinter.name}. Would you like to select a different printer?`,
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Select Printer", 
                    onPress: () => {
                      setShowPrinterModal(true);
                    }
                  }
                ]
              );
            }
          } catch (error) {
            console.error('Error printing to primary printer:', error);
            Alert.alert(
              "Print Error",
              `Error printing to ${primaryPrinter.name}. Would you like to select a different printer?`,
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Select Printer", 
                  onPress: () => {
                    setShowPrinterModal(true);
                  }
                }
              ]
            );
          }
        } else {
          // Primary printer not available, show options
          Alert.alert(
            "Printer Unavailable",
            `Primary printer "${primaryPrinter.name}" is not available. Would you like to select a different printer?`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Select Printer", 
                onPress: () => {
                  setShowPrinterModal(true);
                }
              }
            ]
          );
        }
      } else {
        // No primary printer set, show printer selection modal
        setShowPrinterModal(true);
      }
    } catch (error) {
      console.error("Error preparing to print:", error);
      Alert.alert("Error", "Failed to prepare for printing. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handleShareBill = async (billId: string) => {
    const bill = getBillById(billId);
    if (!bill) {
      Alert.alert("Error", "Bill not found");
      return;
    }
    
    printOrShareBill(bill);
  };
  
  const handlePrinterSelected = async (printer: PrinterDevice) => {
    setShowPrinterModal(false);
    
    if (!createdBillId) {
      Alert.alert("Error", "No bill to print. Please create a bill first.");
      return;
    }
    
    const bill = getBillById(createdBillId);
    if (!bill) {
      Alert.alert("Error", "Bill not found");
      return;
    }
    
    setIsPrinting(true);
    
    try {
      const success = await printBillToPrinter(bill, printer);
      
      if (success) {
        // Set this printer as the primary printer for future use
        setPrimaryPrinter({
          id: printer.id,
          name: printer.name,
          address: printer.address
        });
        
        Alert.alert(
          "Success", 
          `Bill sent to ${printer.name} successfully.\n\nThis printer has been set as your primary printer for future printing.`
        );
      } else {
        Alert.alert("Error", "Failed to print bill. Please check printer connection.");
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      Alert.alert("Error", "Failed to print bill. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handleDeleteBill = () => {
    if (!createdBillId) return;
    
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            // Get the bill to restore inventory
            const bill = getBillById(createdBillId);
            if (bill) {
              // Restore inventory stock for each item in the bill
              for (const item of bill.items) {
                updateItemStock(item.id, item.quantity); // Add back to stock
              }
            }
            
            // Delete the bill
            deleteBill(createdBillId);
            clearCart();
            setCreatedBillId(null);
            Alert.alert("Success", "Bill deleted successfully");
          }
        }
      ]
    );
  };
  
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemCard
      item={item}
      onIncrement={() => handleUpdateCartItemQuantity(item.id, item.quantity + 1)}
      onDecrement={() => handleUpdateCartItemQuantity(item.id, item.quantity - 1)}
      onRemove={() => removeItem(item.id)}
    />
  );
  
  const renderPaymentMethodOption = (method: PaymentMethod, label: string) => (
    <TouchableOpacity
      style={[
        styles.paymentMethodOption,
        paymentMethod === method && styles.selectedPaymentMethod
      ]}
      onPress={() => setPaymentMethod(method)}
    >
      <Text
        style={[
          styles.paymentMethodText,
          paymentMethod === method && styles.selectedPaymentMethodText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  // Use horizontal layout for larger screens
  const useHorizontalLayout = isLargeScreen;
  
  // Render stock indicator for item card
  const renderStockIndicator = (item: Item) => {
    if (typeof item.stock !== 'number') return null;
    
    const isLowStock = item.stock < 5;
    const isOutOfStock = item.stock === 0;
    
    return (
      <View style={[
        styles.stockIndicator,
        isOutOfStock ? styles.outOfStockIndicator : 
        isLowStock ? styles.lowStockIndicator : styles.inStockIndicator
      ]}>
        <Text style={styles.stockText}>
          {isOutOfStock ? 'Out of Stock' : 
           isLowStock ? `Low Stock: ${item.stock}` : `In Stock: ${item.stock}`}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      
            </TouchableOpacity>
          ),
        }} 
      />
      
      {useHorizontalLayout ? (
        // Horizontal layout for larger screens
        <View style={styles.horizontalContent}>
          {/* Items Section */}
          <View style={styles.horizontalItemsContainer}>
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
            
            {categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !selectedCategory && styles.selectedCategoryChip
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text 
                      style={[
                        styles.categoryChipText,
                        !selectedCategory && styles.selectedCategoryChipText
                      ]}
                    >
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
                      <Text 
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category && styles.selectedCategoryChipText
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {filteredItems.length === 0 ? (
              <EmptyState
                title="No items found"
                message="Try a different search term or category"
                icon={<Search size={64} color={colors.gray} />}
              />
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View>
                    <ItemCard
                      item={item}
                      onPress={() => handleAddToCart(item)}
                      showAddButton={typeof item.stock !== 'number' || item.stock > 0}
                    />
                    {renderStockIndicator(item)}
                  </View>
                )}
                contentContainerStyle={styles.itemsList}
                numColumns={1}
              />
            )}
          </View>
          
          {/* Cart Section */}
          <View style={styles.horizontalCartContainer}>
            <View style={styles.cartHeader}>
              <View style={styles.cartHeaderLeft}>
                <ShoppingCart size={20} color={colors.primary} />
                <Text style={styles.cartTitle}>Cart</Text>
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              </View>
              
              <View style={styles.cartHeaderRight}>
                {cartItems.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearCartButton}
                    onPress={() => {
                      Alert.alert(
                        "Clear Cart",
                        "Are you sure you want to clear the cart?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "Clear", 
                            style: "destructive",
                            onPress: () => clearCart()
                          }
                        ]
                      );
                    }}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <ScrollView 
              style={styles.cartContent}
              contentContainerStyle={styles.cartContentContainer}
              showsVerticalScrollIndicator={true}
            >
              {cartItems.length === 0 ? (
                <EmptyState
                  title="Cart is empty"
                  message="Add items to create a bill"
                  icon={<ShoppingCart size={48} color={colors.gray} />}
                />
              ) : (
                <View>
                  <FlatList
                    data={cartItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCartItem}
                    contentContainerStyle={styles.cartItemsList}
                    scrollEnabled={false} // Disable FlatList scrolling as we're using ScrollView
                  />
                  
                  <View style={styles.cartSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>₹{getSubtotal().toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelWithInput}>
                        <Text style={styles.summaryLabel}>Discount (%)</Text>
                        <TextInput
                          style={styles.summaryInput}
                          value={discount.toString()}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            setDiscount(Math.min(100, Math.max(0, value)));
                          }}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                      <Text style={styles.summaryValue}>
                        -₹{(getSubtotal() * (discount / 100)).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelWithInput}>
                        <Text style={styles.summaryLabel}>Tax (%)</Text>
                        <TextInput
                          style={styles.summaryInput}
                          value={tax.toString()}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            setTax(Math.min(100, Math.max(0, value)));
                          }}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                      <Text style={styles.summaryValue}>
                        +₹{(getSubtotal() * (tax / 100)).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>₹{getTotal().toFixed(2)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.customerInfoContainer}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>
                    
                    <TouchableOpacity 
                      style={styles.customerSelectionButton}
                      onPress={() => setShowCustomerModal(true)}
                    >
                      <Users size={20} color={colors.primary} />
                      <Text style={styles.customerSelectionText}>
                        {customerId ? 'Change Customer' : 'Select Customer'}
                      </Text>
                    </TouchableOpacity>
                    
                    {customerId ? (
                      <View style={styles.selectedCustomerInfo}>
                        <View style={styles.inputRow}>
                          <View style={styles.inputContainer}>
                            <User size={20} color={colors.primary} style={styles.inputIcon} />
                            <Text style={styles.selectedCustomerText}>{customerName}</Text>
                          </View>
                        </View>
                        
                        {customerPhone && (
                          <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                              <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                              <Text style={styles.selectedCustomerText}>{customerPhone}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : (
                      <>
                        <View style={styles.inputRow}>
                          <View style={styles.inputContainer}>
                            <User size={20} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="Customer Name *"
                              value={customerName}
                              onChangeText={setCustomerName}
                              placeholderTextColor={colors.gray}
                            />
                          </View>
                        </View>
                        
                        <View style={styles.inputRow}>
                          <View style={styles.inputContainer}>
                            <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="Phone Number"
                              value={customerPhone}
                              onChangeText={setCustomerPhone}
                              keyboardType="phone-pad"
                              placeholderTextColor={colors.gray}
                            />
                          </View>
                        </View>
                      </>
                    )}
                    
                    <View style={styles.inputRow}>
                      <View style={styles.inputContainer}>
                        <FileText size={20} color={colors.primary} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Notes"
                          value={notes}
                          onChangeText={setNotes}
                          placeholderTextColor={colors.gray}
                          multiline
                        />
                      </View>
                    </View>
                    
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    
                    <View style={styles.paymentMethodsContainer}>
                      {renderPaymentMethodOption('cash', 'Cash')}
                      {renderPaymentMethodOption('card', 'Card')}
                      {renderPaymentMethodOption('upi', 'UPI')}
                      {renderPaymentMethodOption('bank_transfer', 'Bank Transfer')}
                    </View>
                    
                    <Button
                      title={isCreatingBill ? "Creating Bill..." : "Create Bill"}
                      onPress={handleCreateBill}
                      disabled={isCreatingBill || cartItems.length === 0}
                      style={styles.createBillButton}
                    >
                      {isCreatingBill && (
                        <ActivityIndicator size="small" color={colors.white} style={styles.buttonLoader} />
                      )}
                    </Button>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        // Vertical layout for smaller screens
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.verticalContent}
          keyboardVerticalOffset={100}
        >
          {/* Items Section */}
          <View style={[styles.verticalItemsContainer, isCartVisible && styles.reducedItemsContainer]}>
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
            
            {categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !selectedCategory && styles.selectedCategoryChip
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text 
                      style={[
                        styles.categoryChipText,
                        !selectedCategory && styles.selectedCategoryChipText
                      ]}
                    >
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
                      <Text 
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category && styles.selectedCategoryChipText
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {filteredItems.length === 0 ? (
              <EmptyState
                title="No items found"
                message="Try a different search term or category"
                icon={<Search size={64} color={colors.gray} />}
              />
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View>
                    <ItemCard
                      item={item}
                      onPress={() => handleAddToCart(item)}
                      showAddButton={typeof item.stock !== 'number' || item.stock > 0}
                    />
                    {renderStockIndicator(item)}
                  </View>
                )}
                contentContainerStyle={styles.itemsList}
                numColumns={1} // Changed to 1 column for better visibility
              />
            )}
          </View>
          
          {/* Cart Section */}
          {(!isCartVisible) ? (
            <TouchableOpacity 
              style={styles.showCartButton}
              onPress={() => setIsCartVisible(true)}
              activeOpacity={0.8}
            >
              <ShoppingCart size={24} color={colors.white} />
              {cartItems.length > 0 && (
                <View style={styles.floatingCartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
              <Text style={styles.showCartText}>View Cart</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.verticalCartContainer}>
              <View style={styles.fullScreenCartHeader}>
                <View style={styles.cartHeaderLeft}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setIsCartVisible(false)}
                  >
                    <ChevronDown size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.fullScreenCartTitle}>Cart</Text>
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                  </View>
                </View>
                
                <View style={styles.cartHeaderRight}>
                  {cartItems.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearCartButton}
                      onPress={() => {
                        Alert.alert(
                          "Clear Cart",
                          "Are you sure you want to clear the cart?",
                          [
                            { text: "Cancel", style: "cancel" },
                            { 
                              text: "Clear", 
                              style: "destructive",
                              onPress: () => clearCart()
                            }
                          ]
                        );
                      }}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <ScrollView 
                style={styles.cartContent}
                contentContainerStyle={styles.cartContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {cartItems.length === 0 ? (
                  <EmptyState
                    title="Cart is empty"
                    message="Add items to create a bill"
                    icon={<ShoppingCart size={48} color={colors.gray} />}
                  />
                ) : (
                  <View>
                    <FlatList
                      data={cartItems}
                      keyExtractor={(item) => item.id}
                      renderItem={renderCartItem}
                      contentContainerStyle={styles.cartItemsList}
                      scrollEnabled={false} // Disable FlatList scrolling as we're using ScrollView
                    />
                    
                    <View style={styles.cartSummary}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>₹{getSubtotal().toFixed(2)}</Text>
                      </View>
                      
                      <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelWithInput}>
                          <Text style={styles.summaryLabel}>Discount (%)</Text>
                          <TextInput
                            style={styles.summaryInput}
                            value={discount.toString()}
                            onChangeText={(text) => {
                              const value = parseFloat(text) || 0;
                              setDiscount(Math.min(100, Math.max(0, value)));
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        </View>
                        <Text style={styles.summaryValue}>
                          -₹{(getSubtotal() * (discount / 100)).toFixed(2)}
                        </Text>
                      </View>
                      
                      <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelWithInput}>
                          <Text style={styles.summaryLabel}>Tax (%)</Text>
                          <TextInput
                            style={styles.summaryInput}
                            value={tax.toString()}
                            onChangeText={(text) => {
                              const value = parseFloat(text) || 0;
                              setTax(Math.min(100, Math.max(0, value)));
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        </View>
                        <Text style={styles.summaryValue}>
                          +₹{(getSubtotal() * (tax / 100)).toFixed(2)}
                        </Text>
                      </View>
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{getTotal().toFixed(2)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.customerInfoContainer}>
                      <Text style={styles.sectionTitle}>Customer Information</Text>
                      
                      <TouchableOpacity 
                        style={styles.customerSelectionButton}
                        onPress={() => setShowCustomerModal(true)}
                      >
                        <Users size={20} color={colors.primary} />
                        <Text style={styles.customerSelectionText}>
                          {customerId ? 'Change Customer' : 'Select Customer'}
                        </Text>
                      </TouchableOpacity>
                      
                      {customerId ? (
                        <View style={styles.selectedCustomerInfo}>
                          <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                              <User size={20} color={colors.primary} style={styles.inputIcon} />
                              <Text style={styles.selectedCustomerText}>{customerName}</Text>
                            </View>
                          </View>
                          
                          {customerPhone && (
                            <View style={styles.inputRow}>
                              <View style={styles.inputContainer}>
                                <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                                <Text style={styles.selectedCustomerText}>{customerPhone}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ) : (
                        <>
                          <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                              <User size={20} color={colors.primary} style={styles.inputIcon} />
                              <TextInput
                                style={styles.input}
                                placeholder="Customer Name *"
                                value={customerName}
                                onChangeText={setCustomerName}
                                placeholderTextColor={colors.gray}
                              />
                            </View>
                          </View>
                          
                          <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                              <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                              <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                value={customerPhone}
                                onChangeText={setCustomerPhone}
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.gray}
                              />
                            </View>
                          </View>
                        </>
                      )}
                      
                      <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                          <FileText size={20} color={colors.primary} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Notes"
                            value={notes}
                            onChangeText={setNotes}
                            placeholderTextColor={colors.gray}
                            multiline
                          />
                        </View>
                      </View>
                      
                      <Text style={styles.sectionTitle}>Payment Method</Text>
                      
                      <View style={styles.paymentMethodsContainer}>
                        {renderPaymentMethodOption('cash', 'Cash')}
                        {renderPaymentMethodOption('card', 'Card')}
                        {renderPaymentMethodOption('upi', 'UPI')}
                        {renderPaymentMethodOption('bank_transfer', 'Bank Transfer')}
                      </View>
                      
                      <Button
                        title={isCreatingBill ? "Creating Bill..." : "Create Bill"}
                        onPress={handleCreateBill}
                        disabled={isCreatingBill || cartItems.length === 0}
                        style={styles.createBillButton}
                      >
                        {isCreatingBill && (
                          <ActivityIndicator size="small" color={colors.white} style={styles.buttonLoader} />
                        )}
                      </Button>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
      
      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={handlePrinterSelected}
      />
      
      <CustomerSelectionModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={handleSelectCustomer}
        selectedCustomerId={customerId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 75 : 55, // Account for absolute positioned tab bar
    paddingTop: Platform.OS === 'ios' ? 88 : 56, // Account for header height
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Horizontal layout styles
  horizontalContent: {
    flex: 1,
    flexDirection: 'row',
  },
  horizontalItemsContainer: {
    flex: 3,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  horizontalCartContainer: {
    flex: 2,
  },
  // Vertical layout styles
  verticalContent: {
    flex: 1,
    flexDirection: 'column',
  },
  verticalItemsContainer: {
    flex: 1,
  },
  reducedItemsContainer: {
    display: 'none', // Hide items completely when cart is visible
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedCategoryChipText: {
    color: colors.white,
    fontWeight: '500',
  },
  itemsList: {
    padding: 16,
    paddingBottom: 50, // Add padding at the bottom to ensure items are visible
  },
  verticalCartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 95 : 65, // Account for tab bar
    backgroundColor: colors.white,
    zIndex: 1000,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  fullScreenCartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16, // Account for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  fullScreenCartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  cartBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  cartHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearCartButton: {
    padding: 8,
    marginRight: 8,
  },
  hideCartButton: {
    padding: 8,
  },
  showCartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
  showCartText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  cartContent: {
    flex: 1,
  },
  cartContentContainer: {
    paddingBottom: 12, // Add padding to ensure the bottom content is visible when scrolling
  },
  cartEmptyState: {
    padding: 16,
  },
  cartItemsList: {
    padding: 16,
  },
  cartSummary: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  summaryLabelWithInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: colors.white,
    color: colors.text,
    backgroundColor: colors.white,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  customerInfoContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputRow: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  paymentMethodOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    backgroundColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedPaymentMethodText: {
    color: colors.white,
    fontWeight: '500',
  },
  createBillButton: {
    marginTop: 8,
    marginBottom: 12, // Add bottom margin to ensure button is visible when scrolling
  },
  customerSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  customerSelectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 8,
  },
  selectedCustomerInfo: {
    marginBottom: 8,
  },
  selectedCustomerText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  buttonLoader: {
    marginRight: 8,
  },
  // Stock indicator styles
  stockIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: -4,
    marginBottom: 6,
    marginLeft: 16,
    alignSelf: 'flex-start',
  },
  inStockIndicator: {
    backgroundColor: `${colors.success}20`,
  },
  lowStockIndicator: {
    backgroundColor: `${colors.warning}20`,
  },
  outOfStockIndicator: {
    backgroundColor: `${colors.danger}20`,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
});