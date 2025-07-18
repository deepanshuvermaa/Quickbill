// Customer related type definitions

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  createdAt: number;
  updatedAt: number;
  createdFrom: 'manual' | 'billing' | 'import';
  isActive: boolean;
  notes?: string;
  tags?: string[];
}

export interface CustomerStats {
  totalPurchases: number;
  totalTransactions: number;
  lastPurchaseDate?: number;
  averageOrderValue: number;
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  tags?: string[];
}

export interface CustomerSearchResult {
  customer: Customer;
  matchScore: number;
  matchedField: 'name' | 'phone' | 'email' | 'gst';
}

export interface CustomerStorage {
  customers: Record<string, Customer>;
  indexes: {
    byPhone: Record<string, string>; // phone -> customerId
    byEmail: Record<string, string>; // email -> customerId
    byGst: Record<string, string>; // gst -> customerId
    recent: string[]; // recently used customer IDs (max 20)
    searchTokens: Record<string, string[]>; // searchToken -> customerIds
  };
  stats: Record<string, CustomerStats>; // customerId -> stats
  metadata: {
    version: string;
    lastBackup: number;
    totalCustomers: number;
    lastModified: number;
  };
}

export interface CustomerBackup {
  version: string;
  exportDate: string;
  deviceInfo: {
    platform: string;
    appVersion: string;
  };
  metadata: {
    totalCustomers: number;
    hasStats: boolean;
  };
  customers: CustomerWithStats[];
}