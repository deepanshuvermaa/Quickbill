import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bill, PaymentMethod } from '@/types';
import { useCartStore } from './cartStore';
import { useSettingsStore } from './settingsStore';
import { useItemsStore } from './itemsStore';
import { generateUniqueId } from '@/utils/helpers';
import { generateInvoiceNumber } from '@/utils/invoice-numbering';

interface BillsState {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  getBillById: (id: string) => Bill | undefined;
  clearBills: () => void;
}

export const useBillsStore = create<BillsState>()(
  persist(
    (set, get) => ({
      bills: [],
      
      addBill: (bill: Bill) => {
        set((state) => ({
          bills: [bill, ...state.bills],
        }));
      },
      
      updateBill: (id: string, updates: Partial<Bill>) => {
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === id ? { ...bill, ...updates } : bill
          ),
        }));
      },
      
      deleteBill: (id: string) => {
        set((state) => ({
          bills: state.bills.filter((bill) => bill.id !== id),
        }));
      },
      
      getBillById: (id: string) => {
        return get().bills.find((bill) => bill.id === id);
      },
      
      clearBills: () => {
        set({ bills: [] });
      },
    }),
    {
      name: 'bills-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to create a bill from the cart
export const createBillFromCart = async (): Promise<string> => {
  const cartStore = useCartStore.getState();
  const settingsStore = useSettingsStore.getState();
  const billsStore = useBillsStore.getState();
  const itemsStore = useItemsStore.getState();
  
  // Generate invoice number using new numbering system
  const invoiceNumber = await generateInvoiceNumber();
  
  // Also generate a unique ID for internal reference (keeping both for compatibility)
  const billId = generateUniqueId('bill');
  
  // Get tax configuration
  const taxConfig = settingsStore.taxConfig;
  const taxRate = taxConfig?.isDefault ? 
    (taxConfig.igst || cartStore.tax) : 
    cartStore.tax;
  
  // Create the bill object
  const bill: Bill = {
    id: billId,
    invoiceNumber: invoiceNumber,
    billNumber: invoiceNumber, // Use invoice number as bill number
    customerId: cartStore.customerId,
    customerName: cartStore.customerName,
    customerPhone: cartStore.customerPhone,
    items: cartStore.items.map(item => ({
      ...item,
      total: item.price * item.quantity
    })),
    subtotal: cartStore.getSubtotal(),
    tax: cartStore.getSubtotal() * (taxRate / 100),
    taxRate: taxRate,
    discount: cartStore.getSubtotal() * (cartStore.discount / 100),
    total: cartStore.getTotal(),
    paymentMethod: cartStore.paymentMethod as PaymentMethod,
    notes: cartStore.notes,
    createdAt: Date.now(),
    isInterstate: false, // Default to intrastate, can be updated based on customer location
    // Add business info to the bill
    businessName: settingsStore.businessInfo.name,
    businessAddress: settingsStore.businessInfo.address,
    businessPhone: settingsStore.businessInfo.phone,
    businessEmail: settingsStore.businessInfo.email,
    businessTaxId: settingsStore.businessInfo.taxId,
    taxNumber: taxConfig?.gstNumber || settingsStore.businessInfo.taxId,
  };
  
  // Add the bill to the store
  billsStore.addBill(bill);
  
  // Update inventory stock for each item in the bill
  cartStore.items.forEach(item => {
    itemsStore.updateItemStock(item.id, -item.quantity);
  });
  
  // Return the bill ID
  return billId;
};