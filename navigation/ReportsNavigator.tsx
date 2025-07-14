import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SalesReportScreen from '../screens/reports/SalesReportScreen';
import ExpensesReportScreen from '../screens/reports/ExpensesReportScreen';
import InventoryReportScreen from '../screens/reports/InventoryReportScreen';
import ProfitLossReportScreen from '../screens/reports/ProfitLossReportScreen';
import TaxReportScreen from '../screens/reports/TaxReportScreen';

const Stack = createNativeStackNavigator();

export default function ReportsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReportsList" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="SalesReport" component={SalesReportScreen} options={{ title: 'Sales Report' }} />
      <Stack.Screen name="ExpensesReport" component={ExpensesReportScreen} options={{ title: 'Expenses Report' }} />
      <Stack.Screen name="InventoryReport" component={InventoryReportScreen} options={{ title: 'Inventory Report' }} />
      <Stack.Screen name="ProfitLossReport" component={ProfitLossReportScreen} options={{ title: 'Profit & Loss Report' }} />
      <Stack.Screen name="TaxReport" component={TaxReportScreen} options={{ title: 'Tax Report' }} />
    </Stack.Navigator>
  );
}