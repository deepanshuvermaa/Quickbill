import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomersStore } from '@/store/customersStore';

export const runCompleteDiagnostics = async () => {
  console.log('\n=== RUNNING COMPLETE STORAGE DIAGNOSTICS ===\n');
  
  // Test 1: Basic AsyncStorage functionality
  console.log('📱 Test 1: AsyncStorage Basic Operations');
  try {
    await AsyncStorage.setItem('test-key', 'test-value');
    const testValue = await AsyncStorage.getItem('test-key');
    console.log('✅ AsyncStorage basic test:', testValue === 'test-value' ? 'PASSED' : 'FAILED');
    await AsyncStorage.removeItem('test-key');
  } catch (error) {
    console.log('❌ AsyncStorage basic test FAILED:', error);
  }
  
  // Test 2: Check all storage keys
  console.log('\n📦 Test 2: All Storage Keys');
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('Storage keys found:', allKeys);
    
    // Check customers-storage specifically
    const customersData = await AsyncStorage.getItem('customers-storage');
    if (customersData) {
      const parsed = JSON.parse(customersData);
      console.log('customers-storage exists:', true);
      console.log('customers count in storage:', parsed.state?.customers?.length || 0);
      console.log('storage version:', parsed.version);
    } else {
      console.log('customers-storage exists:', false);
    }
  } catch (error) {
    console.log('❌ Storage keys check FAILED:', error);
  }
  
  // Test 3: Store state check
  console.log('\n🏪 Test 3: Zustand Store State');
  const state = useCustomersStore.getState();
  console.log('Store hydrated:', state.hasHydrated);
  console.log('Store customers count:', state.customers.length);
  console.log('First customer:', state.customers[0] || 'No customers');
  
  // Test 4: Direct storage write test
  console.log('\n💾 Test 4: Direct Storage Write Test');
  try {
    const testData = {
      state: {
        customers: [{
          id: 'TEST-001',
          name: 'Direct Test Customer',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      },
      version: 0
    };
    
    await AsyncStorage.setItem('test-customers-storage', JSON.stringify(testData));
    const readBack = await AsyncStorage.getItem('test-customers-storage');
    const parsed = JSON.parse(readBack!);
    console.log('✅ Direct write test:', parsed.state.customers[0].name === 'Direct Test Customer' ? 'PASSED' : 'FAILED');
    await AsyncStorage.removeItem('test-customers-storage');
  } catch (error) {
    console.log('❌ Direct write test FAILED:', error);
  }
  
  // Test 5: Platform-specific checks
  console.log('\n📱 Test 5: Platform Checks');
  console.log('Platform:', Platform.OS);
  console.log('AsyncStorage implementation:', AsyncStorage.constructor.name);
  
  console.log('\n=== DIAGNOSTICS COMPLETE ===\n');
};

// Force sync storage state
export const forceSyncStorage = async () => {
  console.log('🔄 Forcing storage sync...');
  const state = useCustomersStore.getState();
  
  try {
    const storageData = {
      state: {
        customers: state.customers,
        selectedCustomerId: state.selectedCustomerId,
        searchQuery: state.searchQuery,
        filterActive: state.filterActive,
        hasHydrated: true
      },
      version: 0
    };
    
    await AsyncStorage.setItem('customers-storage', JSON.stringify(storageData));
    console.log('✅ Storage sync complete');
    
    // Verify
    const readBack = await AsyncStorage.getItem('customers-storage');
    const parsed = JSON.parse(readBack!);
    console.log('Verified customers in storage:', parsed.state.customers.length);
  } catch (error) {
    console.error('❌ Storage sync failed:', error);
  }
};

// Clear and reset storage
export const resetStorage = async () => {
  console.log('🗑️ Resetting storage...');
  try {
    await AsyncStorage.removeItem('customers-storage');
    console.log('✅ Storage cleared');
    
    // Reset store state
    useCustomersStore.setState({
      customers: [],
      selectedCustomerId: undefined,
      searchQuery: '',
      filterActive: true,
      hasHydrated: false
    });
    
    console.log('✅ Store state reset');
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
};

import { Platform } from 'react-native';