import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { generateUniqueId } from '@/utils/helpers';
import { generateMockCustomers } from '@/utils/customer-mock-data';

// Create MMKV instance
const storage = new MMKV();

// Create Zustand storage adapter for MMKV
const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  createdAt: number;
  updatedAt: number;
  totalPurchases: number;
  totalTransactions: number;
  isActive: boolean;
  lastPurchaseDate?: number;
  notes?: string;
  customerType?: 'regular' | 'wholesale' | 'vip';
  creditLimit?: number;
  outstandingBalance?: number;
  tags?: string[];
}

interface CustomersState {
  customers: Customer[];
  selectedCustomerId?: string;
  searchQuery: string;
  filterActive: boolean;
  hasHydrated: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalTransactions'>) => string;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  updateCustomerStats: (id: string, purchaseAmount: number) => void;
  setSelectedCustomer: (id: string | undefined) => void;
  setSearchQuery: (query: string) => void;
  setFilterActive: (active: boolean) => void;
  searchCustomers: (query: string) => Customer[];
  getActiveCustomers: () => Customer[];
  getInactiveCustomers: () => Customer[];
  bulkUpdateCustomers: (ids: string[], updates: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  bulkDeleteCustomers: (ids: string[]) => void;
  importCustomers: (customers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]) => { success: number; failed: number };
  exportCustomers: () => Customer[];
  getCustomerAnalytics: () => {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    averageTransactionValue: number;
    topCustomers: Customer[];
  };
  initializeWithMockData: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useCustomersStoreMMKV = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomerId: undefined,
      searchQuery: '',
      filterActive: true,
      hasHydrated: false,
      
      addCustomer: (customer) => {
        const now = Date.now();
        const id = generateUniqueId('CUST');
        
        const newCustomer: Customer = {
          ...customer,
          id,
          totalPurchases: 0,
          totalTransactions: 0,
          isActive: customer.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        };
        
        console.log('[CustomerStore MMKV] Adding customer:', newCustomer);
        
        set((state) => ({
          customers: [newCustomer, ...state.customers],
        }));
        
        console.log('[CustomerStore MMKV] Customer added with ID:', id);
        
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
          selectedCustomerId: state.selectedCustomerId === id ? undefined : state.selectedCustomerId,
        }));
      },
      
      getCustomerById: (id) => {
        return get().customers.find((customer) => customer.id === id);
      },
      
      updateCustomerStats: (id, purchaseAmount) => {
        const now = Date.now();
        set((state) => ({
          customers: state.customers.map((customer) => 
            customer.id === id 
              ? { 
                  ...customer, 
                  totalTransactions: customer.totalTransactions + 1,
                  totalPurchases: customer.totalPurchases + purchaseAmount,
                  lastPurchaseDate: now,
                  updatedAt: now
                } 
              : customer
          ),
        }));
      },
      
      setSelectedCustomer: (id) => {
        set({ selectedCustomerId: id });
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      setFilterActive: (active) => {
        set({ filterActive: active });
      },
      
      searchCustomers: (query) => {
        const customers = get().customers;
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return customers;
        
        return customers.filter((customer) => 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.phone?.includes(searchTerm) ||
          customer.gstNumber?.toLowerCase().includes(searchTerm)
        );
      },
      
      getActiveCustomers: () => {
        return get().customers.filter((customer) => customer.isActive);
      },
      
      getInactiveCustomers: () => {
        return get().customers.filter((customer) => !customer.isActive);
      },
      
      bulkUpdateCustomers: (ids, updates) => {
        const now = Date.now();
        set((state) => ({
          customers: state.customers.map((customer) => 
            ids.includes(customer.id)
              ? { ...customer, ...updates, updatedAt: now }
              : customer
          ),
        }));
      },
      
      bulkDeleteCustomers: (ids) => {
        set((state) => ({
          customers: state.customers.filter((customer) => !ids.includes(customer.id)),
          selectedCustomerId: ids.includes(state.selectedCustomerId || '') ? undefined : state.selectedCustomerId,
        }));
      },
      
      importCustomers: (customersToImport) => {
        const now = Date.now();
        let success = 0;
        let failed = 0;
        
        const newCustomers: Customer[] = [];
        
        customersToImport.forEach((customer) => {
          try {
            const id = generateUniqueId('CUST');
            newCustomers.push({
              ...customer,
              id,
              totalPurchases: customer.totalPurchases || 0,
              totalTransactions: customer.totalTransactions || 0,
              isActive: customer.isActive ?? true,
              createdAt: now,
              updatedAt: now,
            });
            success++;
          } catch (error) {
            failed++;
          }
        });
        
        set((state) => ({
          customers: [...newCustomers, ...state.customers],
        }));
        
        return { success, failed };
      },
      
      exportCustomers: () => {
        return get().customers;
      },
      
      getCustomerAnalytics: () => {
        const customers = get().customers;
        const activeCustomers = customers.filter(c => c.isActive);
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
        const totalTransactions = customers.reduce((sum, c) => sum + c.totalTransactions, 0);
        
        const topCustomers = [...customers]
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, 10);
        
        return {
          totalCustomers: customers.length,
          activeCustomers: activeCustomers.length,
          totalRevenue,
          averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
          topCustomers,
        };
      },
      
      initializeWithMockData: () => {
        const currentCustomers = get().customers;
        const hasHydrated = get().hasHydrated;
        // Only initialize if we've hydrated and there are no customers
        if (hasHydrated && currentCustomers.length === 0) {
          const mockCustomers = generateMockCustomers(20);
          const result = get().importCustomers(mockCustomers);
          console.log(`[MMKV] Initialized with ${result.success} mock customers`);
        }
      },
      
      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      },
    }),
    {
      name: 'customers-storage-mmkv',
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        console.log('[CustomerStore MMKV] Starting hydration...');
        return (state, error) => {
          if (error) {
            console.error('[CustomerStore MMKV] Hydration error:', error);
          } else {
            console.log('[CustomerStore MMKV] Hydration complete. Customers:', state?.customers?.length || 0);
            state?.setHasHydrated(true);
          }
        };
      },
      partialize: (state) => ({
        customers: state.customers,
        selectedCustomerId: state.selectedCustomerId,
        searchQuery: state.searchQuery,
        filterActive: state.filterActive,
      }),
    }
  )
);