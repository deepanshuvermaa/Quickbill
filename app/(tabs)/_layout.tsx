import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { Home, Package, ShoppingCart, Receipt, Settings, Plus } from 'lucide-react-native';

export default function TabsLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 95 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 5,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        headerStyle: {
          backgroundColor: colors.white,
          height: Platform.OS === 'ios' ? 88 : 56, // Reduced header height
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          marginTop: Platform.OS === 'ios' ? -4 : 0, // Adjust title position
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing/index"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color }) => <ShoppingCart size={20} color={color} />,
          href: '/billing',
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Receipt size={20} color={color} />,
          href: '/history',
        }}
      />
      <Tabs.Screen
        name="items/index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <Package size={20} color={color} />,
          href: '/items',
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
          href: '/settings',
        }}
      />
      <Tabs.Screen
        name="items/[id]"
        options={{
          href: null, // Hide item details from tab bar
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          href: null, // Hide the items directory tab
        }}
      />
    </Tabs>
  );
}