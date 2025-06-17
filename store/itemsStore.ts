import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item } from '@/types';
import { mockItems } from '@/utils/mockData';

interface ItemsState {
  items: Item[];
  
  // Actions
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  getItemById: (id: string) => Item | undefined;
  initializeWithMockData: () => void;
  
  // Stock management
  updateItemStock: (id: string, change: number) => void;
  checkStockAvailability: (id: string, quantity: number) => { 
    available: boolean; 
    currentStock?: number;
  };
}

export const useItemsStore = create<ItemsState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => ({
          items: [...state.items, item],
        }));
      },
      
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
          ),
        }));
      },
      
      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      getItemById: (id) => {
        return get().items.find((item) => item.id === id);
      },
      
      initializeWithMockData: () => {
        set({ items: mockItems });
      },
      
      updateItemStock: (id, change) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id && typeof item.stock === 'number') {
              // Ensure stock doesn't go below 0
              const newStock = Math.max(0, item.stock + change);
              return { ...item, stock: newStock, updatedAt: Date.now() };
            }
            return item;
          }),
        }));
      },
      
      checkStockAvailability: (id, quantity) => {
        const item = get().items.find((item) => item.id === id);
        
        // If item doesn't exist or stock is not tracked (undefined), assume available
        if (!item || typeof item.stock !== 'number') {
          return { available: true };
        }
        
        // Check if we have enough stock
        return { 
          available: item.stock >= quantity,
          currentStock: item.stock
        };
      },
    }),
    {
      name: 'items-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);