import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useCustomersStore } from '@/store/customersStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ArrowLeft, User, Phone, Mail, MapPin, Save } from 'lucide-react-native';

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, updateCustomer } = useCustomersStore();
  
  const customer = customers.find(c => c.id === id);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    }
  }, [customer]);
  
  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Customer Not Found',
            headerLeft: () => (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Customer not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const validateForm = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Customer name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate phone (optional but must be valid if provided)
    if (phone.trim() && !/^[0-9+\-\s]{10,15}$/.test(phone.trim())) {
      setPhoneError('Please enter a valid phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    // Validate email (optional but must be valid if provided)
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    return isValid;
  };
  
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      updateCustomer(customer.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
      
      Alert.alert(
        "Success",
        "Customer updated successfully!",
        [
          { 
            text: "OK", 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("Error updating customer:", error);
      Alert.alert("Error", "Failed to update customer. Please try again.");
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Edit Customer',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <Card>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
            <Input
              label="Customer Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter customer name"
              error={nameError}
              leftIcon={<User size={18} color={colors.gray} />}
            />
            
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              error={phoneError}
              leftIcon={<Phone size={18} color={colors.gray} />}
            />
            
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              leftIcon={<Mail size={18} color={colors.gray} />}
            />
            
            <Input
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              leftIcon={<MapPin size={18} color={colors.gray} />}
            />
            
            <Input
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this customer"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Card>
          
          <View style={styles.actionsContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              icon={<Save size={18} color={colors.white} />}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 16,
  },
});