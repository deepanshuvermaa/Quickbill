import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  logo?: string;
}

interface PrimaryPrinter {
  id: string;
  name: string;
  address: string;
}

interface TaxConfig {
  gstNumber: string;
  cgst: number;
  sgst: number;
  igst: number;
  isDefault: boolean;
  includeGSTNumber: boolean;
}

interface SettingsState {
  businessInfo: BusinessInfo;
  defaultTaxRate: number;
  primaryPrinter: PrimaryPrinter | null;
  taxConfig: TaxConfig | null;
  
  updateBusinessInfo: (info: Partial<BusinessInfo>) => void;
  setDefaultTaxRate: (rate: number) => void;
  setPrimaryPrinter: (printer: PrimaryPrinter | null) => void;
  updateTaxConfig: (config: TaxConfig) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      businessInfo: {
        name: "My Business",
        address: "123 Business St, City",
        phone: "",
        email: "",
        taxId: "",
      },
      defaultTaxRate: 0,
      primaryPrinter: null,
      taxConfig: null,
      
      updateBusinessInfo: (info) => {
        set((state) => ({
          businessInfo: { ...state.businessInfo, ...info },
        }));
      },
      
      setDefaultTaxRate: (rate) => {
        set({ defaultTaxRate: rate });
      },
      
      setPrimaryPrinter: (printer) => {
        set({ primaryPrinter: printer });
      },
      
      updateTaxConfig: (config) => {
        set({ taxConfig: config });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);