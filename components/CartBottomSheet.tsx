import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { CartItem } from '@/types';
import { CartItemCard } from './CartItemCard';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { CustomerSuggestions } from './CustomerSuggestions';
import { useCustomerStore } from '@/store/customerStore';
import {
  ShoppingCart,
  X,
  Trash2,
  ChevronUp,
  User,
  Phone,
  FileText,
  Users,
  Save,
  UserPlus,
  Check,
} from 'lucide-react-native';

const { height: screenHeight } = Dimensions.get('window');

interface CartBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  customerName: string;
  customerPhone: string;
  notes: string;
  discount: number;
  tax: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onSetCustomerName: (name: string) => void;
  onSetCustomerPhone: (phone: string) => void;
  onSetNotes: (notes: string) => void;
  onSetDiscount: (discount: number) => void;
  onSetTax: (tax: number) => void;
  onSetPaymentMethod: (method: 'cash' | 'card' | 'upi' | 'bank_transfer') => void;
  onCreateBill: () => void;
  isCreatingBill: boolean;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemsTaxTotal?: () => number;
  getBillTax?: () => number;
  onSelectCustomer?: (customerId: string | null, name: string, phone?: string) => void;
  onOpenCustomerModal?: () => void;
  selectedCustomerId?: string | null;
}

export const CartBottomSheet: React.FC<CartBottomSheetProps> = ({
  visible,
  onClose,
  cartItems,
  customerName,
  customerPhone,
  notes,
  discount,
  tax,
  paymentMethod,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSetCustomerName,
  onSetCustomerPhone,
  onSetNotes,
  onSetDiscount,
  onSetTax,
  onSetPaymentMethod,
  onCreateBill,
  isCreatingBill,
  getSubtotal,
  getTotal,
  getItemsTaxTotal,
  getBillTax,
  onSelectCustomer,
  onOpenCustomerModal,
  selectedCustomerId,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveAsCustomer, setSaveAsCustomer] = useState(false);
  const [customerSaved, setCustomerSaved] = useState(false);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const lastGestureDy = useRef(0);
  const customerStore = useCustomerStore();
  const { getCustomerById, createCustomer, getCustomerByPhone } = customerStore || {};
  
  const COLLAPSED_HEIGHT = screenHeight * 0.7;
  const FULL_HEIGHT = screenHeight - (Platform.OS === 'ios' ? 150 : 120); // Account for tab bar and safe areas
  
  const handleCreateBill = async () => {
    // If save as customer is checked and customer doesn't exist
    if (saveAsCustomer && customerName.trim() && !selectedCustomerId) {
      try {
        // Check if customer with this phone already exists
        if (customerPhone && getCustomerByPhone) {
          const existingCustomer = getCustomerByPhone(customerPhone);
          if (existingCustomer) {
            // Silently use existing customer
            if (onSelectCustomer) {
              onSelectCustomer(existingCustomer.id, existingCustomer.name, existingCustomer.phone);
            }
            console.log(`Using existing customer: ${existingCustomer.name}`);
          } else if (createCustomer) {
            // Create new customer silently
            const newCustomer = createCustomer({
              name: customerName.trim(),
              phone: customerPhone || undefined,
              email: undefined,
              address: undefined,
              notes: notes || undefined,
              tags: [],
            }, 'billing');
            
            // Update the selected customer
            if (onSelectCustomer) {
              onSelectCustomer(newCustomer.id, newCustomer.name, newCustomer.phone);
            }
            
            console.log(`Customer saved successfully: ${newCustomer.name}`);
            
            // Show visual feedback for 2 seconds
            setCustomerSaved(true);
            setTimeout(() => setCustomerSaved(false), 2000);
          }
        }
      } catch (error) {
        console.error('Error saving customer:', error);
        // Don't show error alert - continue with bill creation
      }
    }
    
    // Reset save customer flag
    setSaveAsCustomer(false);
    
    // Proceed with creating the bill
    onCreateBill();
  };
  
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: isFullScreen ? 0 : screenHeight - COLLAPSED_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, isFullScreen]);
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = isFullScreen 
          ? Math.max(0, gestureState.dy)
          : Math.max(0, screenHeight - COLLAPSED_HEIGHT + gestureState.dy);
        translateY.setValue(newY);
        lastGestureDy.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const currentY = isFullScreen ? gestureState.dy : screenHeight - COLLAPSED_HEIGHT + gestureState.dy;
        
        // Swipe down to close
        if (velocity > 0.5 || currentY > screenHeight * 0.8) {
          onClose();
          return;
        }
        
        // Swipe up to full screen
        if (velocity < -0.5 || currentY < screenHeight * 0.3) {
          setIsFullScreen(true);
          return;
        }
        
        // Snap to nearest position
        if (currentY < screenHeight * 0.5) {
          setIsFullScreen(true);
        } else {
          setIsFullScreen(false);
        }
      },
    })
  ).current;
  
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemCard
      item={item}
      onUpdateQuantity={(quantity) => onUpdateQuantity(item.id, quantity)}
      onRemove={() => onRemoveItem(item.id)}
    />
  );
  
  const renderPaymentMethodOption = (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer',
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.paymentOption,
        paymentMethod === method && styles.selectedPaymentOption
      ]}
      onPress={() => onSetPaymentMethod(method)}
    >
      <Text style={[
        styles.paymentOptionText,
        paymentMethod === method && styles.selectedPaymentOptionText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  if (!visible) return null;
  
  return (
    <>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      />
      
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            height: isFullScreen ? FULL_HEIGHT : COLLAPSED_HEIGHT,
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.header}>
          <View style={styles.dragHandle} />
          
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ShoppingCart size={20} color={colors.primary} />
              <Text style={styles.headerTitle}>Cart</Text>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.fullScreenButton}
                onPress={() => setIsFullScreen(!isFullScreen)}
              >
                <ChevronUp 
                  size={20} 
                  color={colors.primary}
                  style={isFullScreen ? styles.rotatedIcon : undefined}
                />
              </TouchableOpacity>
              
              {cartItems.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    Alert.alert(
                      "Clear Cart",
                      "Are you sure you want to clear the cart?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Clear", 
                          style: "destructive",
                          onPress: onClearCart
                        }
                      ]
                    );
                  }}
                >
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer, 
            { 
              paddingBottom: cartItems.length > 0 
                ? (isFullScreen ? 260 : 180) 
                : 20 
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {cartItems.length === 0 ? (
            <EmptyState
              title="Cart is empty"
              message="Add items to create a bill"
              icon={<ShoppingCart size={48} color={colors.gray} />}
            />
          ) : (
            <>
              <FlatList
                data={cartItems}
                keyExtractor={(item) => item.id}
                renderItem={renderCartItem}
                scrollEnabled={false}
                style={styles.cartItemsList}
              />
              
              <View style={styles.summarySection}>
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
                        onSetDiscount(Math.min(100, Math.max(0, value)));
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholder="0"
                      placeholderTextColor={colors.gray}
                    />
                  </View>
                  <Text style={styles.summaryValue}>
                    -₹{(getSubtotal() * (discount / 100)).toFixed(2)}
                  </Text>
                </View>
                
                {/* Show item taxes if any */}
                {getItemsTaxTotal && getItemsTaxTotal() > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Item Taxes</Text>
                    <Text style={styles.summaryValue}>
                      +₹{getItemsTaxTotal().toFixed(2)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLabelWithInput}>
                    <Text style={styles.summaryLabel}>Bill Tax (%)</Text>
                    <TextInput
                      style={styles.summaryInput}
                      value={tax.toString()}
                      onChangeText={(text) => {
                        const value = parseFloat(text) || 0;
                        onSetTax(Math.min(100, Math.max(0, value)));
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholder="0"
                      placeholderTextColor={colors.gray}
                    />
                  </View>
                  <Text style={styles.summaryValue}>
                    +₹{(getBillTax ? getBillTax() : (getSubtotal() * (tax / 100))).toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{getTotal().toFixed(2)}</Text>
                </View>
              </View>
              
              <View style={styles.customerSection}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                
                <View style={[styles.inputContainer, { zIndex: 2 }]}>
                  <User size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Customer Name *"
                    value={customerName || ''}
                    onChangeText={(text) => {
                      try {
                        onSetCustomerName(text);
                        setShowSuggestions(text.length > 0);
                      } catch (error) {
                        console.error('Error setting customer name:', error);
                      }
                    }}
                    onFocus={() => {
                      try {
                        setShowSuggestions((customerName || '').length > 0);
                      } catch (error) {
                        console.error('Error on focus:', error);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholderTextColor={colors.gray}
                  />
                  {onOpenCustomerModal && (
                    <TouchableOpacity
                      style={styles.selectCustomerIcon}
                      onPress={onOpenCustomerModal}
                    >
                      <Users size={20} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {showSuggestions && (
                    <View>
                      <CustomerSuggestions
                        searchQuery={customerName}
                        onSelectCustomer={(customer) => {
                          try {
                            if (!customer || !customer.name) {
                              console.warn('Invalid customer data');
                              setShowSuggestions(false);
                              return;
                            }
                            
                            onSetCustomerName(customer.name);
                            onSetCustomerPhone(customer.phone || '');
                            
                            if (onSelectCustomer && typeof onSelectCustomer === 'function') {
                              // Call the customer selection handler with proper parameters
                              onSelectCustomer(customer.id, customer.name, customer.phone);
                            }
                            setShowSuggestions(false);
                          } catch (error) {
                            console.error('Error selecting customer:', error);
                            setShowSuggestions(false);
                          }
                        }}
                      />
                    </View>
                  )}
                </View>
                
                <View style={styles.inputContainer}>
                  <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChangeText={onSetCustomerPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.gray}
                  />
                </View>
                
                {/* Save as Customer Option */}
                {customerName.trim() && !selectedCustomerId && (
                  <TouchableOpacity
                    style={styles.saveCustomerOption}
                    onPress={() => setSaveAsCustomer(!saveAsCustomer)}
                    disabled={customerSaved}
                  >
                    <View style={styles.saveCustomerCheckbox}>
                      {(saveAsCustomer || customerSaved) && (
                        <View style={styles.checkboxChecked}>
                          {customerSaved ? (
                            <Check size={12} color={colors.white} />
                          ) : (
                            <X size={12} color={colors.white} />
                          )}
                        </View>
                      )}
                    </View>
                    {customerSaved ? (
                      <Check size={18} color={colors.success} style={styles.saveCustomerIcon} />
                    ) : (
                      <UserPlus size={18} color={colors.primary} style={styles.saveCustomerIcon} />
                    )}
                    <Text style={[
                      styles.saveCustomerText,
                      customerSaved && styles.saveCustomerTextSaved
                    ]}>
                      {customerSaved ? 'Customer saved!' : 'Save as customer for future use'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.inputContainer}>
                  <FileText size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Notes"
                    value={notes}
                    onChangeText={onSetNotes}
                    placeholderTextColor={colors.gray}
                    multiline
                  />
                </View>
              </View>
              
              <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                
                <View style={styles.paymentMethods}>
                  {renderPaymentMethodOption('cash', 'Cash')}
                  {renderPaymentMethodOption('card', 'Card')}
                  {renderPaymentMethodOption('upi', 'UPI')}
                  {renderPaymentMethodOption('bank_transfer', 'Bank')}
                </View>
              </View>
            </>
          )}
        </ScrollView>
        
        {cartItems.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalSummary}>
              <Text style={styles.totalSummaryLabel}>Total</Text>
              <Text style={styles.totalSummaryValue}>₹{getTotal().toFixed(2)}</Text>
            </View>
            
            <Button
              title={isCreatingBill ? "Creating..." : "Create Bill"}
              onPress={handleCreateBill}
              disabled={isCreatingBill || !customerName.trim()}
              style={styles.createBillButton}
            >
              {isCreatingBill && (
                <ActivityIndicator size="small" color={colors.white} />
              )}
            </Button>
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  cartBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullScreenButton: {
    padding: 4,
  },
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  cartItemsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summarySection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.grayLight,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
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
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  customerSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  paymentSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPaymentOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedPaymentOptionText: {
    color: colors.white,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 140 : 120, // Increased to account for tab bar
    marginBottom: 0,
  },
  totalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalSummaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  totalSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  createBillButton: {
    borderRadius: 12,
  },
  selectCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
  },
  selectCustomerButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectCustomerIcon: {
    padding: 8,
    marginLeft: 8,
  },
  saveCustomerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  saveCustomerCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    backgroundColor: colors.primary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCustomerIcon: {
    marginRight: 6,
  },
  saveCustomerText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  saveCustomerTextSaved: {
    color: colors.success,
    fontWeight: '600',
  },
});