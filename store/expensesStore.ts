import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, PaymentMethod } from '@/types';
import { generateUniqueId } from '@/utils/helpers';

interface ExpensesState {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => string;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpenseById: (id: string) => Expense | undefined;
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      
      addExpense: (expense) => {
        const now = Date.now();
        const id = generateUniqueId('expense');
        
        const newExpense: Expense = {
          ...expense,
          id,
          createdAt: now,
        };
        
        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }));
        
        return id;
      },
      
      updateExpense: (id, updatedExpense) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...updatedExpense } : expense
          ),
        }));
      },
      
      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },
      
      getExpenseById: (id) => {
        return get().expenses.find((expense) => expense.id === id);
      },
    }),
    {
      name: 'expenses-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);