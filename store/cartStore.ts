import { create } from 'zustand';
import { CartItem, Item, PaymentMethod } from '@/types';

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  notes: string;
  discount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  autoShowCart: boolean; // New property to control auto-showing cart
  
  // Actions
  addItem: (item: Item, quantity: number) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setCustomerId: (id: string | null) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerDetails: (id: string | null, name: string, phone: string) => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAutoShowCart: (autoShow: boolean) => void; // New action to control auto-showing cart
  
  // Computed values
  getSubtotal: () => number;
  getSubtotalWithItemTax: () => number;
  getItemsTaxTotal: () => number;
  getBillTaxableAmount: () => number;
  getBillTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: "",
  customerPhone: "",
  notes: "",
  discount: 2, // Default 2% discount
  tax: 7, // Default 7% tax
  paymentMethod: "cash",
  autoShowCart: false, // Default to not auto-show cart
  
  // Actions
  addItem: (item, quantity) => {
    if (quantity <= 0) return;
    
    const { items } = get();
    const existingItemIndex = items.findIndex((i) => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Item already exists, update quantity
      const newQuantity = items[existingItemIndex].quantity + quantity;
      
      set((state) => ({
        items: state.items.map((i, index) => 
          index === existingItemIndex 
            ? { ...i, quantity: newQuantity, total: i.price * newQuantity } 
            : i
        ),
      }));
    } else {
      // Add new item
      const cartItem: CartItem = {
        ...item,
        quantity,
        total: item.price * quantity,
      };
      
      set((state) => ({
        items: [...state.items, cartItem],
      }));
    }
  },
  
  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      get().removeItem(itemId);
      return;
    }
    
    set((state) => ({
      items: state.items.map((item) => 
        item.id === itemId 
          ? { ...item, quantity, total: item.price * quantity } 
          : item
      ),
    }));
  },
  
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
  },
  
  clearCart: () => {
    set({
      items: [],
      customerId: null,
      customerName: "",
      customerPhone: "",
      notes: "",
      discount: 2, // Reset to default 2% discount
      tax: 7, // Reset to default 7% tax
      paymentMethod: "cash",
      // Keep autoShowCart setting unchanged
    });
  },
  
  setCustomerId: (id) => set({ customerId: id }),
  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setCustomerDetails: (id, name, phone) => set({ 
    customerId: id, 
    customerName: name, 
    customerPhone: phone 
  }),
  setNotes: (notes) => set({ notes }),
  setDiscount: (discount) => set({ discount }),
  setTax: (tax) => set({ tax }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setAutoShowCart: (autoShow) => set({ autoShowCart: autoShow }),
  
  // Computed values as functions to ensure they're always up-to-date
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },
  
  getSubtotalWithItemTax: () => {
    return get().items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const itemTax = item.taxRate ? (itemTotal * item.taxRate / 100) : 0;
      return sum + itemTotal + itemTax;
    }, 0);
  },
  
  getItemsTaxTotal: () => {
    return get().items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const itemTax = item.taxRate ? (itemTotal * item.taxRate / 100) : 0;
      return sum + itemTax;
    }, 0);
  },
  
  getBillTaxableAmount: () => {
    // Only items without individual tax rates are subject to bill tax
    return get().items.reduce((sum, item) => {
      if (!item.taxRate) {
        return sum + (item.price * item.quantity);
      }
      return sum;
    }, 0);
  },
  
  getBillTax: () => {
    const billTaxableAmount = get().getBillTaxableAmount();
    const taxRate = get().tax / 100;
    return billTaxableAmount * taxRate;
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const itemsTax = get().getItemsTaxTotal();
    const billTax = get().getBillTax();
    const discountRate = get().discount / 100;
    
    // Subtotal + all taxes
    const subtotalWithAllTaxes = subtotal + itemsTax + billTax;
    
    // Apply discount to the total
    const discount = subtotalWithAllTaxes * discountRate;
    
    return subtotalWithAllTaxes - discount;
  }
}));