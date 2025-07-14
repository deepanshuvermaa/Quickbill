import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuotationsScreen from '../screens/quotations/QuotationsScreen';
import AddQuotationScreen from '../screens/quotations/AddQuotationScreen';
import QuotationDetailsScreen from '../screens/quotations/QuotationDetailsScreen';

const Stack = createNativeStackNavigator();

export default function QuotationsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="QuotationsList" component={QuotationsScreen} options={{ title: 'Quotations' }} />
      <Stack.Screen name="AddQuotation" component={AddQuotationScreen} options={{ title: 'Add Quotation' }} />
      <Stack.Screen name="QuotationDetails" component={QuotationDetailsScreen} options={{ title: 'Quotation Details' }} />
    </Stack.Navigator>
  );
}