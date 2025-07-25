import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { 
  Store, 
  Phone, 
  Mail, 
  FileText, 
  Printer, 
  Percent, 
  HelpCircle, 
  Info, 
  LogOut,
  ChevronRight,
  Menu,
  Hash
} from 'lucide-react-native';
import { useHamburgerMenu } from '../../_layout';
import { forceRefreshSubscription } from '@/utils/subscription-refresh';
import { RefreshCw, CreditCard } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { toggleMenu } = useHamburgerMenu();
  const { 
    businessInfo, 
    defaultTaxRate,
    primaryPrinter, 
    updateBusinessInfo, 
    setDefaultTaxRate,
    setPrimaryPrinter 
  } = useSettingsStore();
  
  const { logout, isAuthenticated, subscription } = useAuthStore();
  
  const handleSaveBusinessInfo = () => {
    Alert.alert("Success", "Business information updated successfully");
  };
  
  const handleSaveTaxRate = () => {
    Alert.alert("Success", "Default tax rate updated successfully");
  };
  
  const handleDisconnectPrinter = () => {
    if (!primaryPrinter) return;
    
    Alert.alert(
      "Disconnect Printer",
      `Are you sure you want to disconnect from "${primaryPrinter.name}"? You will need to select a printer again when printing.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disconnect", 
          style: "destructive",
          onPress: () => {
            setPrimaryPrinter(null);
            Alert.alert("Success", "Primary printer disconnected successfully");
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            logout();
            // AuthGuard will handle the redirect to login screen
          }
        }
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={toggleMenu}
            >
              <Menu size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.inputContainer}>
            <Store size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Business Name"
              value={businessInfo.name}
              onChangeText={(text) => updateBusinessInfo({ name: text })}
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <FileText size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Business Address"
              value={businessInfo.address}
              onChangeText={(text) => updateBusinessInfo({ address: text })}
              placeholderTextColor={colors.gray}
              multiline
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Phone size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={businessInfo.phone}
              onChangeText={(text) => updateBusinessInfo({ phone: text })}
              keyboardType="phone-pad"
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={businessInfo.email}
              onChangeText={(text) => updateBusinessInfo({ email: text })}
              keyboardType="email-address"
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <FileText size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tax ID / GST Number"
              value={businessInfo.taxId}
              onChangeText={(text) => updateBusinessInfo({ taxId: text })}
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <Button
            title="Save Business Information"
            onPress={handleSaveBusinessInfo}
            style={styles.saveButton}
          />
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/tax-settings')}
          >
            <View style={styles.settingItemLeft}>
              <Percent size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>GST Configuration</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <View style={styles.inputContainer}>
            <Percent size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Quick Tax Rate (%)"
              value={defaultTaxRate.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                setDefaultTaxRate(Math.min(100, Math.max(0, value)));
              }}
              keyboardType="numeric"
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <Button
            title="Save Tax Settings"
            onPress={handleSaveTaxRate}
            style={styles.saveButton}
          />
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Printer Settings</Text>
          
          {primaryPrinter && (
            <View style={styles.primaryPrinterContainer}>
              <View style={styles.settingItemLeft}>
                <Printer size={20} color={colors.success} style={styles.settingIcon} />
                <View>
                  <Text style={styles.settingText}>Primary Printer</Text>
                  <Text style={styles.printerName}>{primaryPrinter.name}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={handleDisconnectPrinter}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/printer-settings')}
          >
            <View style={styles.settingItemLeft}>
              <Printer size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>
                {primaryPrinter ? 'Change Bluetooth Printer' : 'Manage Bluetooth Printers'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/invoice-settings')}
          >
            <View style={styles.settingItemLeft}>
              <Hash size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Invoice Numbering</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/subscription')}
          >
            <View style={styles.settingItemLeft}>
              <CreditCard size={20} color={colors.primary} style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>Manage Subscription</Text>
                {subscription && (
                  <Text style={styles.subscriptionInfo}>
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} - {subscription.status}
                  </Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={async () => {
              Alert.alert(
                'Refresh Subscription',
                'This will refresh your subscription data. You may need to log in again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Refresh', 
                    onPress: () => forceRefreshSubscription()
                  }
                ]
              );
            }}
          >
            <View style={styles.settingItemLeft}>
              <RefreshCw size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Refresh Subscription Data</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              // TODO: Implement help screen
              Alert.alert('Help', 'Help section coming soon!');
            }}
          >
            <View style={styles.settingItemLeft}>
              <HelpCircle size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert("About", "Billing App v1.0.0\n© 2023 All Rights Reserved")}
          >
            <View style={styles.settingItemLeft}>
              <Info size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>About</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </Card>
        
        {isAuthenticated && (
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            icon={<LogOut size={18} color={colors.white} />}
            style={styles.logoutButton}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  primaryPrinterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  printerName: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disconnectText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  subscriptionInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
});