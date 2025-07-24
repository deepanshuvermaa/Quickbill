import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { navigateToSubscription } from '@/utils/subscription-navigation';
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Receipt,
  Calendar,
  Printer,
  Store,
  UserPlus,
  X,
  Lock,
  LogIn,
} from 'lucide-react-native';

interface HamburgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HamburgerMenu = ({ isVisible, onClose }: HamburgerMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isGuestMode, hasAccess, logout } = useAuthStore();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsMenuVisible(false);
      });
    }
  }, [isVisible, slideAnim]);

  const handleNavigate = (path: string, feature?: string) => {
    onClose();
    
    // Debug: console.log('HamburgerMenu navigate:', { path, feature, isGuestMode, hasAccess: feature ? hasAccess(feature) : 'N/A' });
    
    // Check if guest has access to this feature
    if (isGuestMode && feature && !hasAccess(feature)) {
      // Redirect to login instead
      // Debug: console.log('Redirecting guest to login');
      router.push('/auth/login' as any);
      return;
    }
    
    router.push(path as any);
  };
  
  const handleLogout = () => {
    onClose();
    logout();
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  // If the menu is not visible and not animating, don't render anything
  if (!isMenuVisible && !isVisible) {
    return null;
  }

  const menuWidth = Math.min(320, Dimensions.get('window').width * 0.85);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.menuContainer,
          {
            width: menuWidth,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-menuWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.appName}>QuickBill</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
          <MenuItem
            icon={<Home size={20} color={isActive('/(tabs)') ? colors.primary : colors.text} />}
            label="Dashboard"
            isActive={isActive('/(tabs)')}
            onPress={() => handleNavigate('/(tabs)')}
          />
          
          <MenuItem
            icon={<ShoppingCart size={20} color={isActive('/(tabs)/billing') ? colors.primary : colors.text} />}
            label="Billing"
            isActive={isActive('/(tabs)/billing')}
            onPress={() => handleNavigate('/(tabs)/billing')}
          />
          
          <MenuItem
            icon={<Receipt size={20} color={isActive('/(tabs)/history') ? colors.primary : colors.text} />}
            label="Bill History"
            isActive={isActive('/(tabs)/history')}
            onPress={() => handleNavigate('/(tabs)/history', 'history')}
            isRestricted={!hasAccess('history')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<Package size={20} color={isActive('/(tabs)/items') ? colors.primary : colors.text} />}
            label="Items"
            isActive={isActive('/(tabs)/items')}
            onPress={() => handleNavigate('/(tabs)/items', 'items_view')}
            isRestricted={false} // Guests can view items
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<FileText size={20} color={isActive('/quotations') ? colors.primary : colors.text} />}
            label="Quotations"
            isActive={isActive('/quotations')}
            onPress={() => handleNavigate('/quotations', 'quotations')}
            isRestricted={!hasAccess('quotations')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<CreditCard size={20} color={isActive('/credit-notes') ? colors.primary : colors.text} />}
            label="Credit Notes"
            isActive={isActive('/credit-notes')}
            onPress={() => handleNavigate('/credit-notes', 'credit_notes')}
            isRestricted={!hasAccess('credit_notes')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<Users size={20} color={isActive('/customers') ? colors.primary : colors.text} />}
            label="Customers"
            isActive={isActive('/customers')}
            onPress={() => handleNavigate('/customers', 'customers')}
            isRestricted={!hasAccess('customers')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<Calendar size={20} color={isActive('/expenses') ? colors.primary : colors.text} />}
            label="Expenses"
            isActive={isActive('/expenses')}
            onPress={() => handleNavigate('/expenses', 'expenses')}
            isRestricted={!hasAccess('expenses')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<UserPlus size={20} color={isActive('/staff') ? colors.primary : colors.text} />}
            label="Staff"
            isActive={isActive('/staff')}
            onPress={() => handleNavigate('/staff', 'staff')}
            isRestricted={!hasAccess('staff')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<BarChart3 size={20} color={isActive('/reports') ? colors.primary : colors.text} />}
            label="Reports"
            isActive={isActive('/reports')}
            onPress={() => handleNavigate('/reports', 'reports')}
            isRestricted={!hasAccess('reports')}
            isGuestMode={isGuestMode}
          />
          
          {Platform.OS !== 'web' && (
            <MenuItem
              icon={<Printer size={20} color={isActive('/printer-settings') ? colors.primary : colors.text} />}
              label="Printer Settings"
              isActive={isActive('/printer-settings')}
              onPress={() => handleNavigate('/printer-settings')}
            />
          )}
          
          <MenuItem
            icon={<Settings size={20} color={isActive('/(tabs)/settings') ? colors.primary : colors.text} />}
            label="Settings"
            isActive={isActive('/(tabs)/settings')}
            onPress={() => handleNavigate('/(tabs)/settings', 'settings')}
            isRestricted={!hasAccess('settings')}
            isGuestMode={isGuestMode}
          />
          
          <MenuItem
            icon={<CreditCard size={20} color={isActive('/auth/subscription') ? colors.primary : colors.text} />}
            label="Subscription Plans"
            isActive={isActive('/auth/subscription')}
            onPress={() => {
              onClose();
              navigateToSubscription();
            }}
          />
          
          <View style={styles.divider} />
          
          {isGuestMode && (
            <MenuItem
              icon={<LogIn size={20} color={colors.primary} />}
              label="Login to Access All Features"
              isActive={false}
              labelStyle={{ color: colors.primary, fontWeight: '600' }}
              onPress={() => {
                // Debug: console.log('HamburgerMenu login button pressed');
                onClose();
                router.push('/auth/login' as any);
              }}
            />
          )}
          
          <MenuItem
            icon={<HelpCircle size={20} color={colors.text} />}
            label="Help & Support"
            isActive={false}
            onPress={() => {}}
          />
          
          {!isGuestMode && (
            <MenuItem
              icon={<LogOut size={20} color={colors.danger} />}
              label="Logout"
              isActive={false}
              labelStyle={{ color: colors.danger }}
              onPress={handleLogout}
            />
          )}
        </ScrollView>
        
        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
  labelStyle?: object;
  isRestricted?: boolean;
  isGuestMode?: boolean;
}

const MenuItem = ({ 
  icon, 
  label, 
  isActive, 
  onPress, 
  labelStyle,
  isRestricted = false,
  isGuestMode = false
}: MenuItemProps) => {
  const itemStyle = isRestricted && isGuestMode ? styles.restrictedMenuItem : styles.menuItem;
  const activeStyle = isActive && !isRestricted ? styles.activeMenuItem : null;
  
  return (
    <TouchableOpacity
      style={[itemStyle, activeStyle]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        {isRestricted && isGuestMode ? (
          <Lock size={20} color={colors.textLight} />
        ) : (
          icon
        )}
        <Text style={[
          styles.menuItemLabel, 
          isActive && styles.activeMenuItemLabel, 
          isRestricted && isGuestMode && styles.restrictedMenuItemLabel,
          labelStyle
        ]}>
          {label}
        </Text>
      </View>
      
      {isRestricted && isGuestMode ? (
        <Text style={styles.loginText}>Login</Text>
      ) : (
        <ChevronRight size={16} color={isActive ? colors.primary : colors.gray} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  menuItemLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  activeMenuItem: {
    backgroundColor: `${colors.primary}10`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  activeMenuItemLabel: {
    color: colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: colors.textLight,
  },
  restrictedMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    opacity: 0.6,
  },
  restrictedMenuItemLabel: {
    color: colors.textLight,
  },
  loginText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});