import React, { useState } from 'react';
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
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useCreditNotesStore } from '@/store/creditNotesStore';
import { useBillsStore } from '@/store/billsStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ArrowLeft, User, Phone, FileText, DollarSign, Save } from 'lucide-react-native';

export default function AddCreditNoteScreen() {
  const router = useRouter();
  const { addCreditNote } = useCreditNotesStore();
  const { bills } = useBillsStore();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const [customerNameError, setCustomerNameError] = useState('');
  const [referenceIdError, setReferenceIdError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [reasonError, setReasonError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    // Validate customer name
    if (!customerName.trim()) {
      setCustomerNameError('Customer name is required');
      isValid = false;
    } else {
      setCustomerNameError('');
    }
    
    // Validate reference ID
    if (!referenceId.trim()) {
      setReferenceIdError('Reference ID is required');
      isValid = false;
    } else {
      setReferenceIdError('');
    }
    
    // Validate amount
    if (!amount.trim()) {
      setAmountError('Amount is required');
      isValid = false;
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setAmountError('Please enter a valid amount');
        isValid = false;
      } else {
        setAmountError('');
      }
    }
    
    // Validate reason
    if (!reason.trim()) {
      setReasonError('Reason is required');
      isValid = false;
    } else {
      setReasonError('');
    }
    
    return isValid;
  };
  
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const creditNoteId = addCreditNote({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        referenceType: 'Bill',
        referenceId: referenceId.trim(),
        amount: parseFloat(amount),
        reason: reason.trim(),
        notes: notes.trim(),
        createdAt: Date.now(),
      });
      
      Alert.alert(
        "Success",
        "Credit note created successfully!",
        [
          { 
            text: "OK", 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("Error creating credit note:", error);
      Alert.alert("Error", "Failed to create credit note. Please try again.");
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Create Credit Note',
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
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              error={customerNameError}
              leftIcon={<User size={18} color={colors.gray} />}
            />
            
            <Input
              label="Phone Number (Optional)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={colors.gray} />}
            />
          </Card>
          
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Credit Note Details</Text>
            
            <Input
              label="Reference Bill ID"
              value={referenceId}
              onChangeText={setReferenceId}
              placeholder="Enter bill ID"
              error={referenceIdError}
              leftIcon={<FileText size={18} color={colors.gray} />}
            />
            
            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              error={amountError}
              leftIcon={<DollarSign size={18} color={colors.gray} />}
            />
            
            <Input
              label="Reason"
              value={reason}
              onChangeText={setReason}
              placeholder="Enter reason for credit note"
              error={reasonError}
            />
            
            <Input
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add additional notes"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Card>
          
          <View style={styles.actionsContainer}>
            <Button
              title="Create Credit Note"
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
  card: {
    marginTop: 16,
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
});