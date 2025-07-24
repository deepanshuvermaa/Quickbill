import React, { useState, useCallback, createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { AuthGuard } from '@/components/AuthGuard';

// Create a context for the hamburger menu
interface HamburgerMenuContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const HamburgerMenuContext = createContext<HamburgerMenuContextType>({
  isMenuOpen: false,
  toggleMenu: () => {},
  closeMenu: () => {},
});

// Hook to use the hamburger menu context
export const useHamburgerMenu = () => useContext(HamburgerMenuContext);

export default function RootLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const [loaded] = useFonts({
    // Add any custom fonts here if needed
  });

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <HamburgerMenuContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
        <AuthGuard>
          <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" backgroundColor={colors.white} translucent={false} />
            <Stack
            screenOptions={{
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
              headerShadowVisible: false,
              headerLeft: () => (
                <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                  <Menu size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="auth/login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="auth/register"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="auth/forgot-password"
            options={{
              headerTitle: 'Reset Password',
            }}
          />
          <Stack.Screen
            name="subscription"
            options={{
              headerTitle: 'Subscription Plans',
              headerBackVisible: true,
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerTitle: 'Modal',
            }}
          />
          <Stack.Screen
            name="bills/[id]"
            options={{
              headerTitle: 'Bill Details',
            }}
          />
          <Stack.Screen
            name="printer-settings"
            options={{
              headerTitle: 'Printer Settings',
            }}
          />
          <Stack.Screen
            name="quotations/index"
            options={{
              headerTitle: 'Quotations',
            }}
          />
          <Stack.Screen
            name="quotations/add"
            options={{
              headerTitle: 'Create Quotation',
            }}
          />
          <Stack.Screen
            name="quotations/[id]"
            options={{
              headerTitle: 'Quotation Details',
            }}
          />
          <Stack.Screen
            name="credit-notes/index"
            options={{
              headerTitle: 'Credit Notes',
            }}
          />
          <Stack.Screen
            name="credit-notes/add"
            options={{
              headerTitle: 'Create Credit Note',
            }}
          />
          <Stack.Screen
            name="credit-notes/[id]"
            options={{
              headerTitle: 'Credit Note Details',
            }}
          />
          <Stack.Screen
            name="customers/index"
            options={{
              headerTitle: 'Customers',
            }}
          />
          <Stack.Screen
            name="customers/add"
            options={{
              headerTitle: 'Add Customer',
            }}
          />
          <Stack.Screen
            name="customers/[id]"
            options={{
              headerTitle: 'Customer Details',
            }}
          />
          <Stack.Screen
            name="customers/edit/[id]"
            options={{
              headerTitle: 'Edit Customer',
            }}
          />
          <Stack.Screen
            name="expenses/index"
            options={{
              headerTitle: 'Expenses',
            }}
          />
          <Stack.Screen
            name="expenses/add"
            options={{
              headerTitle: 'Add Expense',
            }}
          />
          <Stack.Screen
            name="expenses/[id]"
            options={{
              headerTitle: 'Expense Details',
            }}
          />
          <Stack.Screen
            name="expenses/edit/[id]"
            options={{
              headerTitle: 'Edit Expense',
            }}
          />
          <Stack.Screen
            name="reports/index"
            options={{
              headerTitle: 'Reports',
            }}
          />
          <Stack.Screen
            name="reports/sales"
            options={{
              headerTitle: 'Sales Report',
            }}
          />
          <Stack.Screen
            name="reports/profit-loss"
            options={{
              headerTitle: 'Profit & Loss',
            }}
          />
          <Stack.Screen
            name="reports/inventory"
            options={{
              headerTitle: 'Inventory Report',
            }}
          />
          <Stack.Screen
            name="reports/expenses"
            options={{
              headerTitle: 'Expense Report',
            }}
          />
          <Stack.Screen
            name="staff/index"
            options={{
              headerTitle: 'Staff',
            }}
          />
          <Stack.Screen
            name="(tabs)/items/add"
            options={{
              headerTitle: 'Add Item',
            }}
          />
          <Stack.Screen
            name="(tabs)/items/[id]"
            options={{
              headerTitle: 'Item Details',
            }}
          />
          </Stack>
          <HamburgerMenu isVisible={isMenuOpen} onClose={closeMenu} />
        </SafeAreaView>
        </AuthGuard>
      </HamburgerMenuContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
});