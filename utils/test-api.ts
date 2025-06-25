// Test API connectivity
import { testApiConnection, API_ENDPOINTS, apiCall } from './api';

export const runApiTests = async () => {
  console.log('🧪 Testing API connection to Railway backend...');
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await apiCall(API_ENDPOINTS.USAGE.HEALTH);
    console.log('✅ Health check passed:', healthResponse);
    
    // Test subscription plans endpoint
    console.log('Testing subscription plans endpoint...');
    const plansResponse = await apiCall(API_ENDPOINTS.SUBSCRIPTIONS.PLANS);
    console.log('✅ Subscription plans loaded:', plansResponse);
    
    console.log('🎉 All API tests passed! Your app is connected to Railway backend.');
    return true;
  } catch (error) {
    console.error('❌ API tests failed:', error);
    return false;
  }
};

// Test authentication flow
export const testAuthFlow = async () => {
  console.log('🔐 Testing authentication flow...');
  
  try {
    // Test registration
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      businessName: 'Test Business'
    };
    
    console.log('Testing user registration...');
    const registerResponse = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    
    console.log('✅ Registration successful:', registerResponse);
    
    // Test login
    console.log('Testing user login...');
    const loginResponse = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    
    console.log('✅ Login successful:', loginResponse);
    
    return true;
  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
    return false;
  }
};