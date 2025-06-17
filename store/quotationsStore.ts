import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '@/types';
import { generateUniqueId } from '@/utils/helpers';

export interface Quotation {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  validUntil: number; // timestamp
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface QuotationsState {
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt'>) => string;
  updateQuotation: (id: string, updates: Partial<Omit<Quotation, 'id' | 'createdAt'>>) => void;
  updateQuotationStatus: (id: string, status: 'pending' | 'accepted' | 'rejected') => void;
  deleteQuotation: (id: string) => void;
  getQuotationById: (id: string) => Quotation | undefined;
}

export const useQuotationsStore = create<QuotationsState>()(
  persist(
    (set, get) => ({
      quotations: [],
      
      addQuotation: (quotation) => {
        const now = Date.now();
        const id = generateUniqueId('quot');
        
        const newQuotation: Quotation = {
          ...quotation,
          id,
          createdAt: now,
        };
        
        set((state) => ({
          quotations: [newQuotation, ...state.quotations],
        }));
        
        return id;
      },
      
      updateQuotation: (id, updates) => {
        set((state) => ({
          quotations: state.quotations.map((quotation) => 
            quotation.id === id 
              ? { ...quotation, ...updates } 
              : quotation
          ),
        }));
      },
      
      updateQuotationStatus: (id, status) => {
        set((state) => ({
          quotations: state.quotations.map((quotation) => 
            quotation.id === id 
              ? { ...quotation, status } 
              : quotation
          ),
        }));
      },
      
      deleteQuotation: (id) => {
        set((state) => ({
          quotations: state.quotations.filter((quotation) => quotation.id !== id),
        }));
      },
      
      getQuotationById: (id) => {
        return get().quotations.find((quotation) => quotation.id === id);
      },
    }),
    {
      name: 'quotations-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);