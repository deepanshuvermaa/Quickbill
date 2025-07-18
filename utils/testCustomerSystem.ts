import { customerStorage } from '@/services/customerStorage';
import { useCustomerStore } from '@/store/customerStore';

export const testCustomerSystem = () => {
  console.log('\n=== TESTING CUSTOMER SYSTEM ===\n');
  
  // Test 1: Create a customer
  console.log('Test 1: Creating a customer...');
  try {
    const customer = customerStorage.createCustomer({
      name: 'Test Customer',
      phone: '9876543210',
      email: 'test@example.com',
      address: '123 Test Street',
      gstNumber: '29ABCDE1234F1Z5',
      notes: 'This is a test customer',
      tags: ['vip', 'wholesale']
    });
    console.log('✅ Customer created:', customer);
  } catch (error) {
    console.error('❌ Failed to create customer:', error);
  }
  
  // Test 2: Search customers
  console.log('\nTest 2: Searching customers...');
  try {
    const results = customerStorage.searchCustomers('test');
    console.log('✅ Search results:', results.length, 'customers found');
  } catch (error) {
    console.error('❌ Failed to search customers:', error);
  }
  
  // Test 3: Get customer by phone
  console.log('\nTest 3: Getting customer by phone...');
  try {
    const customer = customerStorage.getCustomerByPhone('9876543210');
    console.log('✅ Customer found:', customer?.name);
  } catch (error) {
    console.error('❌ Failed to get customer by phone:', error);
  }
  
  // Test 4: Update customer stats
  console.log('\nTest 4: Updating customer stats...');
  try {
    const customers = customerStorage.getAllCustomers();
    if (customers.length > 0) {
      customerStorage.updateCustomerStats(customers[0].id, 1500);
      console.log('✅ Stats updated');
    }
  } catch (error) {
    console.error('❌ Failed to update stats:', error);
  }
  
  // Test 5: Check storage info
  console.log('\nTest 5: Storage info...');
  try {
    const info = customerStorage.getStorageInfo();
    console.log('✅ Storage info:', info);
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
};

// Function to add to customer screen for testing
export const addTestButton = () => {
  return {
    title: '🧪 Test System',
    onPress: testCustomerSystem
  };
};