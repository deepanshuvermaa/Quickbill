import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import BillingScreen from '../screens/billing/BillingScreen';
import ItemsNavigator from './ItemsNavigator';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Import other screens
import BillDetailsScreen from '../screens/bills/BillDetailsScreen';
import CustomersNavigator from './CustomersNavigator';
import ExpensesNavigator from './ExpensesNavigator';
import QuotationsNavigator from './QuotationsNavigator';
import CreditNotesNavigator from './CreditNotesNavigator';
import ReportsNavigator from './ReportsNavigator';
import StaffNavigator from './StaffNavigator';
import PrinterSettingsScreen from '../screens/settings/PrinterSettingsScreen';
import InvoiceSettingsScreen from '../screens/settings/InvoiceSettingsScreen';
import TaxSettingsScreen from '../screens/settings/TaxSettingsScreen';
import SubscriptionPlansScreen from '../screens/subscription/SubscriptionPlansScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Billing') {
            iconName = 'shopping-cart';
          } else if (route.name === 'Items') {
            iconName = 'package';
          } else if (route.name === 'History') {
            iconName = 'clock';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Billing" component={BillingScreen} />
      <Tab.Screen name="Items" component={ItemsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="BillDetails" component={BillDetailsScreen} />
      <Stack.Screen name="Customers" component={CustomersNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Expenses" component={ExpensesNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Quotations" component={QuotationsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CreditNotes" component={CreditNotesNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Reports" component={ReportsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Staff" component={StaffNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
      <Stack.Screen name="InvoiceSettings" component={InvoiceSettingsScreen} />
      <Stack.Screen name="TaxSettings" component={TaxSettingsScreen} />
      <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
    </Stack.Navigator>
  );
}