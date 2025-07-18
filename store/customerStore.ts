import { create } from 'zustand';
import { customerStorage } from '@/services/customerStorage';
import { 
  Customer, 
  CustomerWithStats, 
  CustomerFormData,
  CustomerBackup 
} from '@/types/customer';

interface CustomerStore {
  // State
  customers: CustomerWithStats[];
  recentCustomers: CustomerWithStats[];
  selectedCustomerId: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions - Customer CRUD
  createCustomer: (
    data: CustomerFormData, 
    createdFrom?: 'manual' | 'billing' | 'import'
  ) => Customer;
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => CustomerWithStats | null;
  getCustomerByPhone: (phone: string) => CustomerWithStats | null;

  // Actions - Search and Filter
  searchCustomers: (query: string) => void;
  getSearchResults: (query: string) => CustomerWithStats[];
  loadAllCustomers: () => void;
  loadRecentCustomers: () => void;
  setSelectedCustomer: (id: string | null) => void;

  // Actions - Stats
  updateCustomerStats: (customerId: string, purchaseAmount: number) => void;

  // Actions - Import/Export
  exportBackup: () => CustomerBackup;
  importBackup: (
    backup: CustomerBackup, 
    mode?: 'replace' | 'merge'
  ) => { success: number; failed: number; errors: string[] };
  clearAllData: () => void;

  // Utility
  getStorageInfo: () => {
    totalCustomers: number;
    lastModified: Date;
    lastBackup: Date | null;
    version: string;
    storageSize: number;
  };
  setError: (error: string | null) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  // Initial state
  customers: [],
  recentCustomers: [],
  selectedCustomerId: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  // Customer CRUD Operations
  createCustomer: (data, createdFrom = 'manual') => {
    try {
      const customer = customerStorage.createCustomer(data, createdFrom);
      
      // Refresh the customer list
      get().loadAllCustomers();
      get().loadRecentCustomers();
      
      return customer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateCustomer: (id, data) => {
    try {
      customerStorage.updateCustomer(id, data);
      
      // Refresh the customer list
      get().loadAllCustomers();
      get().loadRecentCustomers();
      
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteCustomer: (id) => {
    try {
      customerStorage.deleteCustomer(id);
      
      // Clear selection if deleted customer was selected
      if (get().selectedCustomerId === id) {
        set({ selectedCustomerId: null });
      }
      
      // Refresh the customer list
      get().loadAllCustomers();
      get().loadRecentCustomers();
      
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
      set({ error: errorMessage });
      throw error;
    }
  },

  getCustomer: (id) => {
    try {
      return customerStorage.getCustomer(id);
    } catch (error) {
      console.error('Failed to get customer:', error);
      return null;
    }
  },

  getCustomerByPhone: (phone) => {
    try {
      return customerStorage.getCustomerByPhone(phone);
    } catch (error) {
      console.error('Failed to get customer by phone:', error);
      return null;
    }
  },

  // Search and Filter
  searchCustomers: (query) => {
    set({ searchQuery: query, isLoading: true });
    
    try {
      const results = query.trim() 
        ? customerStorage.searchCustomers(query)
        : customerStorage.getAllCustomers();
      
      set({ 
        customers: results,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({ 
        isLoading: false,
        error: 'Failed to search customers'
      });
    }
  },

  getSearchResults: (query) => {
    try {
      return query.trim() 
        ? customerStorage.searchCustomers(query)
        : customerStorage.getAllCustomers();
    } catch (error) {
      console.error('Failed to get search results:', error);
      return [];
    }
  },

  loadAllCustomers: () => {
    set({ isLoading: true });
    
    try {
      const customers = customerStorage.getAllCustomers();
      set({ 
        customers,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({ 
        isLoading: false,
        error: 'Failed to load customers'
      });
    }
  },

  loadRecentCustomers: () => {
    try {
      const recentCustomers = customerStorage.getRecentCustomers(10);
      set({ recentCustomers });
    } catch (error) {
      console.error('Failed to load recent customers:', error);
    }
  },

  setSelectedCustomer: (id) => {
    set({ selectedCustomerId: id });
  },

  // Stats
  updateCustomerStats: (customerId, purchaseAmount) => {
    try {
      customerStorage.updateCustomerStats(customerId, purchaseAmount);
      
      // Refresh if this customer is in current view
      const { customers, selectedCustomerId } = get();
      if (customers.some(c => c.id === customerId) || selectedCustomerId === customerId) {
        get().loadAllCustomers();
        get().loadRecentCustomers();
      }
    } catch (error) {
      console.error('Failed to update customer stats:', error);
    }
  },

  // Import/Export
  exportBackup: () => {
    return customerStorage.exportBackup();
  },

  importBackup: (backup, mode = 'merge') => {
    const result = customerStorage.importBackup(backup, mode);
    
    // Refresh the customer list
    get().loadAllCustomers();
    get().loadRecentCustomers();
    
    return result;
  },

  clearAllData: () => {
    customerStorage.clearAllData();
    set({
      customers: [],
      recentCustomers: [],
      selectedCustomerId: null,
      searchQuery: '',
      error: null
    });
  },

  // Utility
  getStorageInfo: () => {
    return customerStorage.getStorageInfo();
  },

  setError: (error) => {
    set({ error });
  }
}));

// Initialize store with data on app start
export const initializeCustomerStore = () => {
  const store = useCustomerStore.getState();
  store.loadAllCustomers();
  store.loadRecentCustomers();
};