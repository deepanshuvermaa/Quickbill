import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/settingsStore';
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
  ArrowLeft,
  Menu
} from 'lucide-react-native';
import { useHamburgerMenu } from '../../_layout';

export default function SettingsScreen() {
  const router = useRouter();
  const { toggleMenu } = useHamburgerMenu();
  const { 
    businessInfo, 
    defaultTaxRate, 
    updateBusinessInfo, 
    setDefaultTaxRate 
  } = useSettingsStore();
  
  const handleSaveBusinessInfo = () => {
    Alert.alert("Success", "Business information updated successfully");
  };
  
  const handleSaveTaxRate = () => {
    Alert.alert("Success", "Default tax rate updated successfully");
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
            // In a real app, we would clear auth state here
            Alert.alert("Logged Out", "You have been logged out successfully");
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          
          <View style={styles.inputContainer}>
            <Percent size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Default Tax Rate (%)"
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
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/printer-settings')}
          >
            <View style={styles.settingItemLeft}>
              <Printer size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Manage Bluetooth Printers</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help')}
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
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          icon={<LogOut size={18} color={colors.white} />}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 90 : 60, // Account for absolute positioned tab bar
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
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
    marginTop: 8,
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
});