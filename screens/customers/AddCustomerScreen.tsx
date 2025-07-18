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
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useNavigation, useRoute } from '@react-navigation/native';
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
  DollarSign,
  Briefcase,
  FileText,
  X,
  Plus
} from 'lucide-react-native';
import { useCustomersStore, Customer } from '@/store/customersStore';
import { customerSchema, validateCustomer, formatPhoneNumber, formatGSTNumber } from '@/utils/validation/customerValidation';

interface RouteParams {
  customerId?: string;
}

export default function AddCustomerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const isEditMode = !!params?.customerId;
  
  const { addCustomer, updateCustomer, getCustomerById } = useCustomersStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    notes: '',
    customerType: 'regular' as 'regular' | 'wholesale' | 'vip',
    creditLimit: '',
    isActive: true,
    tags: [] as string[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  useEffect(() => {
    if (isEditMode && params.customerId) {
      const customer = getCustomerById(params.customerId);
      if (customer) {
        setFormData({
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          gstNumber: customer.gstNumber || '',
          notes: customer.notes || '',
          customerType: customer.customerType || 'regular',
          creditLimit: customer.creditLimit?.toString() || '',
          isActive: customer.isActive,
          tags: customer.tags || [],
        });
      }
    }
  }, [isEditMode, params.customerId]);
  
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    handleFieldChange('phone', cleaned);
  };
  
  const handleGSTChange = (value: string) => {
    const formatted = value.toUpperCase();
    handleFieldChange('gstNumber', formatted);
  };
  
  const handleCreditLimitChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    handleFieldChange('creditLimit', cleaned);
  };
  
  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 10) {
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        handleFieldChange('tags', [...formData.tags, newTag]);
      }
      setTagInput('');
    }
  };
  
  const removeTag = (index: number) => {
    handleFieldChange('tags', formData.tags.filter((_, i) => i !== index));
  };
  
  const handleSave = async () => {
    setIsSubmitting(true);
    
    const dataToValidate = {
      ...formData,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
    };
    
    const validation = await validateCustomer(dataToValidate);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      Alert.alert('Validation Error', 'Please check the form and fix the errors');
      return;
    }
    
    try {
      const customerData = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        gstNumber: formData.gstNumber || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };
      
      if (isEditMode && params.customerId) {
        updateCustomer(params.customerId, customerData);
        Alert.alert('Success', 'Customer updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.log('[AddCustomerScreen] Adding customer:', customerData);
        const customerId = addCustomer(customerData);
        console.log('[AddCustomerScreen] Customer added with ID:', customerId);
        Alert.alert('Success', 'Customer added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save customer');
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
              onPress={() => navigation.goBack()}
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
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.errorInput]}>
                <Phone size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={handlePhoneChange}
                  placeholder="10-13 digit phone number"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                  maxLength={13}
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
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Type</Text>
              <View style={styles.typeSelector}>
                {['regular', 'wholesale', 'vip'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      formData.customerType === type && styles.selectedType
                    ]}
                    onPress={() => handleFieldChange('customerType', type)}
                  >
                    <Text style={[
                      styles.typeText,
                      formData.customerType === type && styles.selectedTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Credit Limit</Text>
              <View style={[styles.inputContainer, errors.creditLimit && styles.errorInput]}>
                <DollarSign size={20} color={colors.primary} style={styles.inputIcon} />
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.creditLimit}
                  onChangeText={handleCreditLimitChange}
                  placeholder="0"
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                />
              </View>
              {errors.creditLimit && <Text style={styles.errorText}>{errors.creditLimit}</Text>}
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
                />
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {formData.tags.length > 0 && (
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
            
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active Customer</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => handleFieldChange('isActive', value)}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
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
  currencySymbol: {
    fontSize: 16,
    color: colors.text,
    marginRight: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedTypeText: {
    color: colors.white,
    fontWeight: '600',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});