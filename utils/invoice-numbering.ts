import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InvoiceNumberingSettings {
  format: 'date_based' | 'sequential' | 'custom';
  dateFormat: 'MMDD' | 'DDMM' | 'YYYYMMDD' | 'YYMMDD';
  resetDaily: boolean;
  resetMonthly: boolean;
  prefix: string;
  suffix: string;
  startNumber: number;
  minDigits: number; // Minimum digits for bill number (e.g., 3 for 001)
  separator: string; // Separator between parts (e.g., '-', '_', '')
}

export interface DailyCounter {
  date: string; // YYYY-MM-DD format
  count: number;
  lastBillNumber: string;
}

export interface MonthlyCounter {
  month: string; // YYYY-MM format
  count: number;
  lastBillNumber: string;
}

const STORAGE_KEYS = {
  SETTINGS: 'invoice_numbering_settings',
  DAILY_COUNTERS: 'daily_counters',
  MONTHLY_COUNTERS: 'monthly_counters',
  GLOBAL_COUNTER: 'global_counter'
};

export class InvoiceNumberingManager {
  private static instance: InvoiceNumberingManager;
  private settings: InvoiceNumberingSettings;
  
  // Default settings
  private defaultSettings: InvoiceNumberingSettings = {
    format: 'date_based',
    dateFormat: 'MMDD',
    resetDaily: true,
    resetMonthly: false,
    prefix: '',
    suffix: '',
    startNumber: 1,
    minDigits: 3,
    separator: '_'
  };

  private constructor() {
    this.settings = this.defaultSettings;
    this.loadSettings();
  }

  static getInstance(): InvoiceNumberingManager {
    if (!InvoiceNumberingManager.instance) {
      InvoiceNumberingManager.instance = new InvoiceNumberingManager();
    }
    return InvoiceNumberingManager.instance;
  }

  // Load settings from storage
  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        this.settings = { ...this.defaultSettings, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Failed to load invoice numbering settings:', error);
    }
  }

  // Save settings to storage
  async saveSettings(settings: Partial<InvoiceNumberingSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save invoice numbering settings:', error);
    }
  }

  // Get current settings
  getSettings(): InvoiceNumberingSettings {
    return { ...this.settings };
  }

  // Generate next invoice number
  async generateInvoiceNumber(): Promise<string> {
    try {
      switch (this.settings.format) {
        case 'date_based':
          return await this.generateDateBasedNumber();
        case 'sequential':
          return await this.generateSequentialNumber();
        case 'custom':
          return await this.generateCustomNumber();
        default:
          return await this.generateDateBasedNumber();
      }
    } catch (error) {
      console.error('Failed to generate invoice number:', error);
      // Fallback to simple timestamp-based
      return `INV_${Date.now().toString().slice(-6)}`;
    }
  }

  // Generate date-based invoice number (e.g., 1225_001)
  private async generateDateBasedNumber(): Promise<string> {
    const now = new Date();
    const dateStr = this.formatDate(now);
    const key = this.settings.resetDaily ? 
      now.toISOString().split('T')[0] : // YYYY-MM-DD
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

    let counter: number;
    
    if (this.settings.resetDaily) {
      counter = await this.getDailyCounter(key);
    } else if (this.settings.resetMonthly) {
      counter = await this.getMonthlyCounter(key);
    } else {
      counter = await this.getGlobalCounter();
    }

    const billNumber = String(counter).padStart(this.settings.minDigits, '0');
    
    // Update counter
    if (this.settings.resetDaily) {
      await this.updateDailyCounter(key, counter);
    } else if (this.settings.resetMonthly) {
      await this.updateMonthlyCounter(key, counter);
    } else {
      await this.updateGlobalCounter(counter);
    }

    return this.buildInvoiceNumber(dateStr, billNumber);
  }

  // Generate sequential invoice number (e.g., INV-00001)
  private async generateSequentialNumber(): Promise<string> {
    const counter = await this.getGlobalCounter();
    const billNumber = String(counter).padStart(this.settings.minDigits, '0');
    await this.updateGlobalCounter(counter);
    
    return this.buildInvoiceNumber('', billNumber);
  }

  // Generate custom format invoice number
  private async generateCustomNumber(): Promise<string> {
    // For custom format, use current settings as base
    return await this.generateDateBasedNumber();
  }

  // Format date according to settings
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (this.settings.dateFormat) {
      case 'MMDD':
        return `${month}${day}`;
      case 'DDMM':
        return `${day}${month}`;
      case 'YYYYMMDD':
        return `${year}${month}${day}`;
      case 'YYMMDD':
        return `${String(year).slice(-2)}${month}${day}`;
      default:
        return `${month}${day}`;
    }
  }

  // Build final invoice number with prefix, suffix, and separators
  private buildInvoiceNumber(datePart: string, billNumber: string): string {
    const parts: string[] = [];

    if (this.settings.prefix) {
      parts.push(this.settings.prefix);
    }

    if (datePart) {
      parts.push(datePart);
    }

    parts.push(billNumber);

    if (this.settings.suffix) {
      parts.push(this.settings.suffix);
    }

    return parts.join(this.settings.separator);
  }

  // Daily counter management
  private async getDailyCounter(date: string): Promise<number> {
    try {
      const countersJson = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COUNTERS);
      const counters: Record<string, DailyCounter> = countersJson ? JSON.parse(countersJson) : {};
      
      if (counters[date]) {
        return counters[date].count + 1;
      } else {
        return this.settings.startNumber;
      }
    } catch (error) {
      console.error('Failed to get daily counter:', error);
      return this.settings.startNumber;
    }
  }

  private async updateDailyCounter(date: string, newCount: number): Promise<void> {
    try {
      const countersJson = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COUNTERS);
      const counters: Record<string, DailyCounter> = countersJson ? JSON.parse(countersJson) : {};
      
      counters[date] = {
        date,
        count: newCount,
        lastBillNumber: String(newCount).padStart(this.settings.minDigits, '0')
      };

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_COUNTERS, JSON.stringify(counters));
    } catch (error) {
      console.error('Failed to update daily counter:', error);
    }
  }

  // Monthly counter management
  private async getMonthlyCounter(month: string): Promise<number> {
    try {
      const countersJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_COUNTERS);
      const counters: Record<string, MonthlyCounter> = countersJson ? JSON.parse(countersJson) : {};
      
      if (counters[month]) {
        return counters[month].count + 1;
      } else {
        return this.settings.startNumber;
      }
    } catch (error) {
      console.error('Failed to get monthly counter:', error);
      return this.settings.startNumber;
    }
  }

  private async updateMonthlyCounter(month: string, newCount: number): Promise<void> {
    try {
      const countersJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_COUNTERS);
      const counters: Record<string, MonthlyCounter> = countersJson ? JSON.parse(countersJson) : {};
      
      counters[month] = {
        month,
        count: newCount,
        lastBillNumber: String(newCount).padStart(this.settings.minDigits, '0')
      };

      await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_COUNTERS, JSON.stringify(counters));
    } catch (error) {
      console.error('Failed to update monthly counter:', error);
    }
  }

  // Global counter management
  private async getGlobalCounter(): Promise<number> {
    try {
      const counterStr = await AsyncStorage.getItem(STORAGE_KEYS.GLOBAL_COUNTER);
      const counter = counterStr ? parseInt(counterStr, 10) : this.settings.startNumber - 1;
      return counter + 1;
    } catch (error) {
      console.error('Failed to get global counter:', error);
      return this.settings.startNumber;
    }
  }

  private async updateGlobalCounter(newCount: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GLOBAL_COUNTER, String(newCount));
    } catch (error) {
      console.error('Failed to update global counter:', error);
    }
  }

  // Preview what the next invoice number will look like
  async previewNextInvoiceNumber(): Promise<string> {
    // Generate without updating counters
    const now = new Date();
    const dateStr = this.formatDate(now);
    const key = this.settings.resetDaily ? 
      now.toISOString().split('T')[0] : 
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let nextCounter: number;
    
    if (this.settings.format === 'sequential') {
      const currentGlobal = await this.getGlobalCounter();
      nextCounter = currentGlobal;
    } else if (this.settings.resetDaily) {
      nextCounter = await this.getDailyCounter(key);
    } else if (this.settings.resetMonthly) {
      nextCounter = await this.getMonthlyCounter(key);
    } else {
      nextCounter = await this.getGlobalCounter();
    }

    const billNumber = String(nextCounter).padStart(this.settings.minDigits, '0');
    
    if (this.settings.format === 'sequential') {
      return this.buildInvoiceNumber('', billNumber);
    } else {
      return this.buildInvoiceNumber(dateStr, billNumber);
    }
  }

  // Reset counters (admin function)
  async resetCounters(type: 'daily' | 'monthly' | 'global' | 'all'): Promise<void> {
    try {
      switch (type) {
        case 'daily':
          await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_COUNTERS);
          break;
        case 'monthly':
          await AsyncStorage.removeItem(STORAGE_KEYS.MONTHLY_COUNTERS);
          break;
        case 'global':
          await AsyncStorage.removeItem(STORAGE_KEYS.GLOBAL_COUNTER);
          break;
        case 'all':
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.DAILY_COUNTERS,
            STORAGE_KEYS.MONTHLY_COUNTERS,
            STORAGE_KEYS.GLOBAL_COUNTER
          ]);
          break;
      }
    } catch (error) {
      console.error('Failed to reset counters:', error);
    }
  }

  // Get statistics
  async getStatistics(): Promise<{
    todayCount: number;
    monthCount: number;
    totalCount: number;
    lastInvoiceNumber: string;
  }> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [dailyCountersJson, monthlyCountersJson, globalCounter] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_COUNTERS),
        AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_COUNTERS),
        AsyncStorage.getItem(STORAGE_KEYS.GLOBAL_COUNTER)
      ]);

      const dailyCounters: Record<string, DailyCounter> = dailyCountersJson ? JSON.parse(dailyCountersJson) : {};
      const monthlyCounters: Record<string, MonthlyCounter> = monthlyCountersJson ? JSON.parse(monthlyCountersJson) : {};
      const total = globalCounter ? parseInt(globalCounter, 10) : 0;

      return {
        todayCount: dailyCounters[today]?.count || 0,
        monthCount: monthlyCounters[thisMonth]?.count || 0,
        totalCount: total,
        lastInvoiceNumber: await this.previewNextInvoiceNumber()
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        todayCount: 0,
        monthCount: 0,
        totalCount: 0,
        lastInvoiceNumber: 'Error'
      };
    }
  }
}

// Export singleton instance
export const invoiceNumbering = InvoiceNumberingManager.getInstance();

// Convenience functions
export const generateInvoiceNumber = async (): Promise<string> => {
  return await invoiceNumbering.generateInvoiceNumber();
};

export const previewInvoiceNumber = async (): Promise<string> => {
  return await invoiceNumbering.previewNextInvoiceNumber();
};

export const getInvoiceSettings = (): InvoiceNumberingSettings => {
  return invoiceNumbering.getSettings();
};

export const updateInvoiceSettings = async (settings: Partial<InvoiceNumberingSettings>): Promise<void> => {
  return await invoiceNumbering.saveSettings(settings);
};