import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from '@/utils/navigation';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  DollarSign,
  Save 
} from 'lucide-react-native';

export default function AddStaffScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter staff member name');
      return;
    }
    
    if (!role.trim()) {
      Alert.alert('Error', 'Please enter staff member role');
      return;
    }
    
    setIsSubmitting(true);
    
    // Mock save - in a real implementation, you would save to a staff store
    setTimeout(() => {
      Alert.alert(
        'Success',
        'Staff member added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Add Staff Member',
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
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            leftIcon={<User size={20} color={colors.primary} />}
            autoCapitalize="words"
          />
          
          <Input
            label="Role/Position"
            value={role}
            onChangeText={setRole}
            placeholder="e.g., Manager, Cashier, Sales Associate"
            leftIcon={<Briefcase size={20} color={colors.primary} />}
            autoCapitalize="words"
          />
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            leftIcon={<Phone size={20} color={colors.primary} />}
            keyboardType="phone-pad"
          />
          
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            leftIcon={<Mail size={20} color={colors.primary} />}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Join Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={joinDate}
                onChangeText={setJoinDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.gray}
              />
            </View>
          </View>
          
          <Input
            label="Monthly Salary (Optional)"
            value={salary}
            onChangeText={setSalary}
            placeholder="Enter monthly salary"
            leftIcon={<DollarSign size={20} color={colors.primary} />}
            keyboardType="decimal-pad"
          />
        </Card>
        
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            💡 Staff members will be able to access the POS system and generate bills once added.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.cancelButton}
        />
        
        <Button
          title="Save Staff Member"
          onPress={handleSave}
          disabled={isSubmitting}
          icon={<Save size={20} color={colors.white} />}
          style={styles.saveButton}
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Account for footer
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
    borderRadius: 8,
    paddingHorizontal: 12,
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
  noteContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 2,
  },
});