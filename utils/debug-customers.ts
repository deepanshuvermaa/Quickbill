import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomersStore } from '@/store/customersStore';

export const debugCustomerStorage = async () => {
  try {
    // Get raw storage data
    const rawData = await AsyncStorage.getItem('customers-storage');
    console.log('[DEBUG] Raw AsyncStorage data:', rawData);
    
    if (rawData) {
      const parsed = JSON.parse(rawData);
      console.log('[DEBUG] Parsed data:', parsed);
      console.log('[DEBUG] Customers count in storage:', parsed.state?.customers?.length || 0);
    }
    
    // Get current store state
    const storeState = useCustomersStore.getState();
    console.log('[DEBUG] Current store state:');
    console.log('[DEBUG] - Customers:', storeState.customers.length);
    console.log('[DEBUG] - Has Hydrated:', storeState.hasHydrated);
    console.log('[DEBUG] - Customers:', storeState.customers);
    
  } catch (error) {
    console.error('[DEBUG] Error reading storage:', error);
  }
};

export const clearCustomerStorage = async () => {
  try {
    await AsyncStorage.removeItem('customers-storage');
    console.log('[DEBUG] Customer storage cleared');
  } catch (error) {
    console.error('[DEBUG] Error clearing storage:', error);
  }
};

export const forceAddTestCustomer = () => {
  const store = useCustomersStore.getState();
  const testCustomer = {
    name: 'Test Customer ' + Date.now(),
    phone: '9999999999',
    email: 'test@example.com',
    isActive: true,
  };
  
  console.log('[DEBUG] Force adding test customer:', testCustomer);
  const id = store.addCustomer(testCustomer);
  console.log('[DEBUG] Test customer added with ID:', id);
  
  // Check state immediately
  const newState = useCustomersStore.getState();
  console.log('[DEBUG] Customers after force add:', newState.customers.length);
  console.log('[DEBUG] Customers list:', newState.customers);
};