import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ItemsScreen from '../screens/items/ItemsScreen';
import AddItemScreen from '../screens/items/AddItemScreen';
import ItemDetailsScreen from '../screens/items/ItemDetailsScreen';

const Stack = createNativeStackNavigator();

export default function ItemsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ItemsList" component={ItemsScreen} options={{ title: 'Items' }} />
      <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ title: 'Item Details' }} />
    </Stack.Navigator>
  );
}