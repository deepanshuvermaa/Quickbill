import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { Home, Package, ShoppingCart, Receipt, Settings } from 'lucide-react-native';

export default function TabsLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing/index"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
          href: '/billing', // Explicitly map to the billing route
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Receipt size={24} color={color} />,
          href: '/history', // Explicitly map to the history route
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          href: '/settings', // Explicitly map to the settings route
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          href: null, // This will hide the items tab from the tab bar
        }}
      />
    </Tabs>
  );
}