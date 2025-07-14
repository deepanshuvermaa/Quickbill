import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useExpensesStore } from '@/store/expensesStore';
import { Calendar, DollarSign, Tag, CreditCard, FileText, ArrowLeft } from 'lucide-react-native';

const CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Shopping', 
  'Utilities', 'Health', 'Education', 'Travel', 'Other'
];

const PAYMENT_METHODS = [
  'cash', 'credit card', 'debit card', 'upi', 'bank transfer', 'other'
];

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const { addExpense } = useExpensesStore();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      addExpense({
        title,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        category,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      
      Alert.alert(
        "Success",
        "Expense added successfully",
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Add Expense',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What did you spend on?"
          error={errors.title}
          leftIcon={<FileText size={20} color={colors.gray} />}
        />
        
        <Input
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
          error={errors.amount}
          leftIcon={<DollarSign size={20} color={colors.gray} />}
        />
        
        <Text style={styles.sectionTitle}>Category</Text>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                category === cat && styles.selectedCategoryChip
              ]}
              onPress={() => setCategory(cat)}
            >
              <Tag 
                size={16} 
                color={category === cat ? colors.white : colors.gray} 
                style={styles.categoryIcon} 
              />
              <Text 
                style={[
                  styles.categoryText,
                  category === cat && styles.selectedCategoryText
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {errors.paymentMethod && <Text style={styles.errorText}>{errors.paymentMethod}</Text>}
        <View style={styles.paymentMethodsContainer}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentMethodChip,
                paymentMethod === method && styles.selectedPaymentMethodChip
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <CreditCard 
                size={16} 
                color={paymentMethod === method ? colors.white : colors.gray}
                style={styles.paymentMethodIcon} 
              />
              <Text 
                style={[
                  styles.paymentMethodText,
                  paymentMethod === method && styles.selectedPaymentMethodText
                ]}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Input
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional details"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          leftIcon={<FileText size={20} color={colors.gray} />}
        />
        
        <Button
          title="Add Expense"
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedCategoryText: {
    color: colors.white,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPaymentMethodChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodIcon: {
    marginRight: 4,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedPaymentMethodText: {
    color: colors.white,
  },
  submitButton: {
    marginTop: 24,
  },
});