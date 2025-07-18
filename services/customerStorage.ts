import { MMKV } from 'react-native-mmkv';
import { 
  Customer, 
  CustomerStats, 
  CustomerStorage, 
  CustomerWithStats,
  CustomerBackup 
} from '@/types/customer';
import { generateUniqueId } from '@/utils/helpers';

// Initialize MMKV instance for customer data
const storage = new MMKV({
  id: 'customer-storage',
  encryptionKey: 'quickbill-customers' // Optional encryption
});

// Storage keys
const STORAGE_KEY = 'customers_data';
const STORAGE_VERSION = '1.0';

class CustomerStorageService {
  private data: CustomerStorage;
  private initialized: boolean = false;

  constructor() {
    this.data = this.getDefaultStorage();
    this.initialize();
  }

  private getDefaultStorage(): CustomerStorage {
    return {
      customers: {},
      indexes: {
        byPhone: {},
        byEmail: {},
        byGst: {},
        recent: [],
        searchTokens: {}
      },
      stats: {},
      metadata: {
        version: STORAGE_VERSION,
        lastBackup: 0,
        totalCustomers: 0,
        lastModified: Date.now()
      }
    };
  }

  private initialize(): void {
    try {
      const stored = storage.getString(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomerStorage;
        // Verify version compatibility
        if (parsed.metadata?.version === STORAGE_VERSION) {
          this.data = parsed;
        } else {
          // Handle version migration if needed
          console.log('Storage version mismatch, using default');
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize customer storage:', error);
      this.data = this.getDefaultStorage();
      this.save();
    }
  }

  private save(): void {
    try {
      this.data.metadata.lastModified = Date.now();
      storage.set(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save customer storage:', error);
      throw error;
    }
  }

  private updateIndexes(customer: Customer, oldCustomer?: Customer): void {
    // Remove old indexes if updating
    if (oldCustomer) {
      if (oldCustomer.phone) delete this.data.indexes.byPhone[oldCustomer.phone];
      if (oldCustomer.email) delete this.data.indexes.byEmail[oldCustomer.email];
      if (oldCustomer.gstNumber) delete this.data.indexes.byGst[oldCustomer.gstNumber];
      this.removeFromSearchIndex(oldCustomer);
    }

    // Add new indexes
    if (customer.phone) {
      this.data.indexes.byPhone[customer.phone] = customer.id;
    }
    if (customer.email) {
      this.data.indexes.byEmail[customer.email] = customer.id;
    }
    if (customer.gstNumber) {
      this.data.indexes.byGst[customer.gstNumber] = customer.id;
    }
    this.addToSearchIndex(customer);
  }

  private addToSearchIndex(customer: Customer): void {
    // Create search tokens from customer name
    const tokens = this.createSearchTokens(customer.name);
    tokens.forEach(token => {
      if (!this.data.indexes.searchTokens[token]) {
        this.data.indexes.searchTokens[token] = [];
      }
      if (!this.data.indexes.searchTokens[token].includes(customer.id)) {
        this.data.indexes.searchTokens[token].push(customer.id);
      }
    });
  }

  private removeFromSearchIndex(customer: Customer): void {
    const tokens = this.createSearchTokens(customer.name);
    tokens.forEach(token => {
      if (this.data.indexes.searchTokens[token]) {
        this.data.indexes.searchTokens[token] = this.data.indexes.searchTokens[token]
          .filter(id => id !== customer.id);
        if (this.data.indexes.searchTokens[token].length === 0) {
          delete this.data.indexes.searchTokens[token];
        }
      }
    });
  }

  private createSearchTokens(text: string): string[] {
    // Create searchable tokens from text
    const words = text.toLowerCase().split(/\s+/);
    const tokens: string[] = [];
    
    words.forEach(word => {
      // Add the full word
      tokens.push(word);
      // Add prefixes for partial matching (min 2 chars)
      for (let i = 2; i <= word.length; i++) {
        tokens.push(word.substring(0, i));
      }
    });
    
    return [...new Set(tokens)]; // Remove duplicates
  }

  private updateRecent(customerId: string): void {
    // Remove if already in recent
    this.data.indexes.recent = this.data.indexes.recent.filter(id => id !== customerId);
    // Add to beginning
    this.data.indexes.recent.unshift(customerId);
    // Keep only last 20
    this.data.indexes.recent = this.data.indexes.recent.slice(0, 20);
  }

  // Public Methods

  createCustomer(
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdFrom'>,
    createdFrom: 'manual' | 'billing' | 'import' = 'manual'
  ): Customer {
    const id = generateUniqueId('CUST');
    const now = Date.now();
    
    const customer: Customer = {
      ...customerData,
      id,
      createdAt: now,
      updatedAt: now,
      createdFrom,
      isActive: customerData.isActive ?? true
    };

    // Check for duplicates
    if (customer.phone && this.data.indexes.byPhone[customer.phone]) {
      throw new Error('Customer with this phone number already exists');
    }

    // Add to storage
    this.data.customers[id] = customer;
    this.data.stats[id] = {
      totalPurchases: 0,
      totalTransactions: 0,
      averageOrderValue: 0
    };
    
    // Update indexes
    this.updateIndexes(customer);
    this.updateRecent(id);
    
    // Update metadata
    this.data.metadata.totalCustomers++;
    
    // Save to storage
    this.save();
    
    return customer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const existing = this.data.customers[id];
    if (!existing) {
      throw new Error('Customer not found');
    }

    // Check for duplicate phone if phone is being updated
    if (updates.phone && updates.phone !== existing.phone) {
      const existingId = this.data.indexes.byPhone[updates.phone];
      if (existingId && existingId !== id) {
        throw new Error('Another customer with this phone number already exists');
      }
    }

    const updated: Customer = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID cannot be changed
      createdAt: existing.createdAt, // Ensure creation date cannot be changed
      updatedAt: Date.now()
    };

    // Update indexes
    this.updateIndexes(updated, existing);
    
    // Update storage
    this.data.customers[id] = updated;
    this.save();
    
    return updated;
  }

  deleteCustomer(id: string): void {
    const customer = this.data.customers[id];
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Remove from indexes
    this.updateIndexes(customer, customer);
    
    // Remove from recent
    this.data.indexes.recent = this.data.indexes.recent.filter(rid => rid !== id);
    
    // Delete customer and stats
    delete this.data.customers[id];
    delete this.data.stats[id];
    
    // Update metadata
    this.data.metadata.totalCustomers--;
    
    // Save
    this.save();
  }

  getCustomer(id: string): CustomerWithStats | null {
    const customer = this.data.customers[id];
    if (!customer) return null;
    
    const stats = this.data.stats[id] || {
      totalPurchases: 0,
      totalTransactions: 0,
      averageOrderValue: 0
    };
    
    // Update recent access
    this.updateRecent(id);
    this.save();
    
    return { ...customer, stats };
  }

  getCustomerByPhone(phone: string): CustomerWithStats | null {
    const id = this.data.indexes.byPhone[phone];
    return id ? this.getCustomer(id) : null;
  }

  getAllCustomers(): CustomerWithStats[] {
    return Object.values(this.data.customers)
      .map(customer => ({
        ...customer,
        stats: this.data.stats[customer.id] || {
          totalPurchases: 0,
          totalTransactions: 0,
          averageOrderValue: 0
        }
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getRecentCustomers(limit: number = 10): CustomerWithStats[] {
    return this.data.indexes.recent
      .slice(0, limit)
      .map(id => this.getCustomer(id))
      .filter(Boolean) as CustomerWithStats[];
  }

  searchCustomers(query: string): CustomerWithStats[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.getAllCustomers();

    const results = new Map<string, CustomerWithStats>();
    
    // Search by exact phone
    if (/^\d+$/.test(searchTerm)) {
      Object.entries(this.data.indexes.byPhone).forEach(([phone, id]) => {
        if (phone.includes(searchTerm)) {
          const customer = this.getCustomer(id);
          if (customer) results.set(id, customer);
        }
      });
    }

    // Search by name tokens
    const tokens = this.createSearchTokens(searchTerm);
    tokens.forEach(token => {
      const customerIds = this.data.indexes.searchTokens[token] || [];
      customerIds.forEach(id => {
        const customer = this.getCustomer(id);
        if (customer) results.set(id, customer);
      });
    });

    // Search in email and GST
    Object.values(this.data.customers).forEach(customer => {
      if (
        (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
        (customer.gstNumber && customer.gstNumber.toLowerCase().includes(searchTerm))
      ) {
        const customerWithStats = this.getCustomer(customer.id);
        if (customerWithStats) results.set(customer.id, customerWithStats);
      }
    });

    return Array.from(results.values());
  }

  updateCustomerStats(customerId: string, purchaseAmount: number): void {
    const stats = this.data.stats[customerId];
    if (!stats) {
      this.data.stats[customerId] = {
        totalPurchases: purchaseAmount,
        totalTransactions: 1,
        lastPurchaseDate: Date.now(),
        averageOrderValue: purchaseAmount
      };
    } else {
      stats.totalPurchases += purchaseAmount;
      stats.totalTransactions += 1;
      stats.lastPurchaseDate = Date.now();
      stats.averageOrderValue = stats.totalPurchases / stats.totalTransactions;
    }
    
    // Update customer's updatedAt
    const customer = this.data.customers[customerId];
    if (customer) {
      customer.updatedAt = Date.now();
    }
    
    this.save();
  }

  exportBackup(): CustomerBackup {
    const customers = this.getAllCustomers();
    
    return {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      deviceInfo: {
        platform: 'react-native',
        appVersion: '1.0.0' // You can get this from your app config
      },
      metadata: {
        totalCustomers: customers.length,
        hasStats: true
      },
      customers
    };
  }

  importBackup(backup: CustomerBackup, mode: 'replace' | 'merge' = 'merge'): {
    success: number;
    failed: number;
    errors: string[];
  } {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    if (mode === 'replace') {
      // Clear existing data
      this.data = this.getDefaultStorage();
    }

    backup.customers.forEach((customerWithStats, index) => {
      try {
        const { stats, ...customer } = customerWithStats;
        
        // Check if customer already exists (by phone)
        if (customer.phone && this.data.indexes.byPhone[customer.phone]) {
          if (mode === 'merge') {
            // Update existing customer
            const existingId = this.data.indexes.byPhone[customer.phone];
            this.updateCustomer(existingId, customer);
            if (stats) {
              this.data.stats[existingId] = stats;
            }
          } else {
            throw new Error(`Customer with phone ${customer.phone} already exists`);
          }
        } else {
          // Create new customer
          const newCustomer = this.createCustomer(customer, 'import');
          if (stats) {
            this.data.stats[newCustomer.id] = stats;
          }
        }
        
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Row ${index + 1}: ${error.message}`);
      }
    });

    this.save();
    return result;
  }

  clearAllData(): void {
    this.data = this.getDefaultStorage();
    this.save();
  }

  getStorageInfo() {
    return {
      totalCustomers: this.data.metadata.totalCustomers,
      lastModified: new Date(this.data.metadata.lastModified),
      lastBackup: this.data.metadata.lastBackup ? new Date(this.data.metadata.lastBackup) : null,
      version: this.data.metadata.version,
      storageSize: JSON.stringify(this.data).length
    };
  }
}

// Export singleton instance
export const customerStorage = new CustomerStorageService();