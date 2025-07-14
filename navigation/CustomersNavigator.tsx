import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomersScreen from '../screens/customers/CustomersScreen';
import AddCustomerScreen from '../screens/customers/AddCustomerScreen';
import CustomerDetailsScreen from '../screens/customers/CustomerDetailsScreen';
import EditCustomerScreen from '../screens/customers/EditCustomerScreen';

const Stack = createNativeStackNavigator();

export default function CustomersNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Add Customer' }} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} options={{ title: 'Customer Details' }} />
      <Stack.Screen name="EditCustomer" component={EditCustomerScreen} options={{ title: 'Edit Customer' }} />
    </Stack.Navigator>
  );
}