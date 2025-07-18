import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Tag,
  FileText,
  X,
  Plus
} from 'lucide-react-native';
import { useCustomerStore } from '@/store/customerStore';
import { CustomerFormData } from '@/types/customer';
import { 
  validateCustomerForm, 
  validateField,
  cleanCustomerData,
  formatGSTNumber 
} from '@/utils/customerValidation';

export default function AddCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerId = params.id as string | undefined;
  const isEditMode = !!customerId;
  
  const { createCustomer, updateCustomer, getCustomer } = useCustomerStore();
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: '',
    tags: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Load customer data if editing
  useEffect(() => {
    if (isEditMode && customerId) {
      const customer = getCustomer(customerId);
      if (customer) {
        setFormData({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          gstNumber: customer.gstNumber || '',
          notes: customer.notes || '',
          tags: customer.tags || []
        });
      }
    }
  }, [isEditMode, customerId]);

  const handleFieldChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    
    // Real-time validation for critical fields
    if (field === 'phone' || field === 'email' || field === 'gstNumber') {
      const error = validateField(field, value);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    handleFieldChange('phone', cleaned);
  };

  const handleGSTChange = (value: string) => {
    // Format GST number as user types
    const formatted = value.toUpperCase().slice(0, 15);
    handleFieldChange('gstNumber', formatted);
  };

  const addTag = () => {
    if (tagInput.trim() && (!formData.tags || formData.tags.length < 10)) {
      const newTag = tagInput.trim();
      const currentTags = formData.tags || [];
      if (!currentTags.includes(newTag)) {
        handleFieldChange('tags', [...currentTags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags?.filter((_, i) => i !== index) || [];
    handleFieldChange('tags', newTags);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    // Validate form
    const validation = validateCustomerForm(formData);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      setIsSubmitting(false);
      Alert.alert('Validation Error', 'Please check the form and fix the errors');
      return;
    }
    
    try {
      const cleanedData = cleanCustomerData(formData);
      
      if (isEditMode && customerId) {
        updateCustomer(customerId, cleanedData);
        Alert.alert('Success', 'Customer updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const customer = createCustomer(cleanedData);
        Alert.alert('Success', 'Customer added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save customer';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: isEditMode ? 'Edit Customer' : 'Add Customer',
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
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <View style={[styles.inputContainer, errors.name && styles.errorInput]}>
                <User size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleFieldChange('name', value)}
                  placeholder="Enter customer name"
                  placeholderTextColor={colors.gray}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={[styles.inputContainer, errors.phone && styles.errorInput]}>
                <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={handlePhoneChange}
                  placeholder="10-digit phone number"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, errors.email && styles.errorInput]}>
                <Mail size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={[styles.inputContainer, errors.address && styles.errorInput]}>
                <MapPin size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.address}
                  onChangeText={(value) => handleFieldChange('address', value)}
                  placeholder="Enter address"
                  placeholderTextColor={colors.gray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>GST Number</Text>
              <View style={[styles.inputContainer, errors.gstNumber && styles.errorInput]}>
                <Tag size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.gstNumber}
                  onChangeText={handleGSTChange}
                  placeholder="15-character GST number"
                  placeholderTextColor={colors.gray}
                  maxLength={15}
                  autoCapitalize="characters"
                />
              </View>
              {errors.gstNumber && <Text style={styles.errorText}>{errors.gstNumber}</Text>}
              {formData.gstNumber && !errors.gstNumber && (
                <Text style={styles.helperText}>
                  Formatted: {formatGSTNumber(formData.gstNumber)}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <View style={[styles.inputContainer, errors.notes && styles.errorInput]}>
                <FileText size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.notes}
                  onChangeText={(value) => handleFieldChange('notes', value)}
                  placeholder="Add any notes about this customer"
                  placeholderTextColor={colors.gray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add a tag"
                  placeholderTextColor={colors.gray}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {formData.tags && formData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {formData.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(index)}>
                        <X size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.footer}>
        <Button
          title={isEditMode ? "Update Customer" : "Save Customer"}
          onPress={handleSave}
          disabled={isSubmitting}
          loading={isSubmitting}
          icon={<Save size={20} color={colors.white} />}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    paddingBottom: 16,
  },
  section: {
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: colors.textLight,
    fontSize: 14,
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  tagInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 6,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});