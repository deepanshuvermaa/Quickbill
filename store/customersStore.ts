import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '@/utils/helpers';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  totalBills?: number;
  totalSpent?: number;
  createdAt: number;
  updatedAt: number;
}

interface CustomersState {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalBills' | 'totalSpent'>) => string;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  updateCustomerStats: (id: string, billAmount: number) => void;
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: [],
      
      addCustomer: (customer) => {
        const now = Date.now();
        const id = generateUniqueId('cust');
        
        const newCustomer: Customer = {
          ...customer,
          id,
          totalBills: 0,
          totalSpent: 0,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          customers: [newCustomer, ...state.customers],
        }));
        
        return id;
      },
      
      updateCustomer: (id, updates) => {
        const now = Date.now();
        
        set((state) => ({
          customers: state.customers.map((customer) => 
            customer.id === id 
              ? { ...customer, ...updates, updatedAt: now } 
              : customer
          ),
        }));
      },
      
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }));
      },
      
      getCustomerById: (id) => {
        return get().customers.find((customer) => customer.id === id);
      },
      
      updateCustomerStats: (id, billAmount) => {
        set((state) => ({
          customers: state.customers.map((customer) => 
            customer.id === id 
              ? { 
                  ...customer, 
                  totalBills: (customer.totalBills || 0) + 1,
                  totalSpent: (customer.totalSpent || 0) + billAmount,
                  updatedAt: Date.now()
                } 
              : customer
          ),
        }));
      },
    }),
    {
      name: 'customers-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);