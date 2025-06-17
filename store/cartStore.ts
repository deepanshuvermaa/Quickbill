import { create } from 'zustand';
import { CartItem, Item, PaymentMethod } from '@/types';

interface CartState {
  items: CartItem[];
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
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAutoShowCart: (autoShow: boolean) => void; // New action to control auto-showing cart
  
  // Computed values
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
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
      customerName: "",
      customerPhone: "",
      notes: "",
      discount: 2, // Reset to default 2% discount
      tax: 7, // Reset to default 7% tax
      paymentMethod: "cash",
      // Keep autoShowCart setting unchanged
    });
  },
  
  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setNotes: (notes) => set({ notes }),
  setDiscount: (discount) => set({ discount }),
  setTax: (tax) => set({ tax }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setAutoShowCart: (autoShow) => set({ autoShowCart: autoShow }),
  
  // Computed values as functions to ensure they're always up-to-date
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const taxRate = get().tax / 100;
    const discountRate = get().discount / 100;
    
    // First add tax to subtotal
    const subtotalWithTax = subtotal + (subtotal * taxRate);
    
    // Then apply discount to the subtotal with tax
    const discount = subtotalWithTax * discountRate;
    
    return subtotalWithTax - discount;
  }
}));