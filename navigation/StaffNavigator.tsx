import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaffScreen from '../screens/staff/StaffScreen';
import AddStaffScreen from '../screens/staff/AddStaffScreen';

const Stack = createNativeStackNavigator();

export default function StaffNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StaffList" component={StaffScreen} options={{ title: 'Staff' }} />
      <Stack.Screen name="AddStaff" component={AddStaffScreen} options={{ title: 'Add Staff' }} />
    </Stack.Navigator>
  );
}