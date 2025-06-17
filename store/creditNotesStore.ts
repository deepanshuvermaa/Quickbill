import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '@/utils/helpers';

export interface CreditNote {
  id: string;
  customerName: string;
  customerPhone?: string;
  referenceType: 'Bill' | 'Quotation';
  referenceId: string;
  amount: number;
  reason: string;
  notes?: string;
  createdAt: number;
}

interface CreditNotesState {
  creditNotes: CreditNote[];
  addCreditNote: (creditNote: Omit<CreditNote, 'id' | 'createdAt'>) => string;
  updateCreditNote: (id: string, updates: Partial<Omit<CreditNote, 'id' | 'createdAt'>>) => void;
  deleteCreditNote: (id: string) => void;
  getCreditNoteById: (id: string) => CreditNote | undefined;
}

export const useCreditNotesStore = create<CreditNotesState>()(
  persist(
    (set, get) => ({
      creditNotes: [],
      
      addCreditNote: (creditNote) => {
        const now = Date.now();
        const id = generateUniqueId('cred');
        
        const newCreditNote: CreditNote = {
          ...creditNote,
          id,
          createdAt: now,
        };
        
        set((state) => ({
          creditNotes: [newCreditNote, ...state.creditNotes],
        }));
        
        return id;
      },
      
      updateCreditNote: (id, updates) => {
        set((state) => ({
          creditNotes: state.creditNotes.map((creditNote) => 
            creditNote.id === id 
              ? { ...creditNote, ...updates } 
              : creditNote
          ),
        }));
      },
      
      deleteCreditNote: (id) => {
        set((state) => ({
          creditNotes: state.creditNotes.filter((creditNote) => creditNote.id !== id),
        }));
      },
      
      getCreditNoteById: (id) => {
        return get().creditNotes.find((creditNote) => creditNote.id === id);
      },
    }),
    {
      name: 'credit-notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);