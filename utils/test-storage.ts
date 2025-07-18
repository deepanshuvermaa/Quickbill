import AsyncStorage from '@react-native-async-storage/async-storage';

export const testAsyncStorage = async () => {
  console.log('=== Testing AsyncStorage ===');
  
  try {
    // Test 1: Simple write/read
    console.log('Test 1: Writing test data...');
    await AsyncStorage.setItem('test-key', 'test-value');
    
    console.log('Test 1: Reading test data...');
    const value = await AsyncStorage.getItem('test-key');
    console.log('Test 1: Read value:', value);
    console.log('Test 1:', value === 'test-value' ? '✅ PASSED' : '❌ FAILED');
    
    // Test 2: Complex object
    console.log('\nTest 2: Writing complex object...');
    const testObject = { name: 'Test', id: 123, date: Date.now() };
    await AsyncStorage.setItem('test-object', JSON.stringify(testObject));
    
    console.log('Test 2: Reading complex object...');
    const objectString = await AsyncStorage.getItem('test-object');
    const readObject = objectString ? JSON.parse(objectString) : null;
    console.log('Test 2: Read object:', readObject);
    console.log('Test 2:', readObject?.name === 'Test' ? '✅ PASSED' : '❌ FAILED');
    
    // Test 3: List all keys
    console.log('\nTest 3: Listing all storage keys...');
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All keys in storage:', allKeys);
    
    // Cleanup
    await AsyncStorage.removeItem('test-key');
    await AsyncStorage.removeItem('test-object');
    
    console.log('\n✅ AsyncStorage is working properly!');
    return true;
  } catch (error) {
    console.error('❌ AsyncStorage test failed:', error);
    return false;
  }
};