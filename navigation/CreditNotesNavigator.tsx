import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreditNotesScreen from '../screens/credit-notes/CreditNotesScreen';
import AddCreditNoteScreen from '../screens/credit-notes/AddCreditNoteScreen';
import CreditNoteDetailsScreen from '../screens/credit-notes/CreditNoteDetailsScreen';

const Stack = createNativeStackNavigator();

export default function CreditNotesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CreditNotesList" component={CreditNotesScreen} options={{ title: 'Credit Notes' }} />
      <Stack.Screen name="AddCreditNote" component={AddCreditNoteScreen} options={{ title: 'Add Credit Note' }} />
      <Stack.Screen name="CreditNoteDetails" component={CreditNoteDetailsScreen} options={{ title: 'Credit Note Details' }} />
    </Stack.Navigator>
  );
}