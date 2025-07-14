import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { 
  UserCog, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  ChevronRight, 
  Trash2,
  ArrowLeft
} from 'lucide-react-native';

// Mock staff data
const mockStaff = [
  {
    id: '1',
    name: 'Rahul Sharma',
    role: 'Manager',
    phone: '+91 9876543210',
    email: 'rahul@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    joinDate: new Date('2022-01-15'),
  },
  {
    id: '2',
    name: 'Priya Patel',
    role: 'Cashier',
    phone: '+91 8765432109',
    email: 'priya@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    joinDate: new Date('2022-03-10'),
  },
  {
    id: '3',
    name: 'Amit Kumar',
    role: 'Sales Associate',
    phone: '+91 7654321098',
    email: 'amit@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    joinDate: new Date('2022-05-22'),
  },
];

export default function StaffScreen() {
  const navigation = useNavigation();
  const [staff, setStaff] = useState(mockStaff);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredStaff = staff.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.phone && person.phone.includes(searchQuery)) ||
    (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleDeleteStaff = (id: string) => {
    Alert.alert(
      "Delete Staff",
      "Are you sure you want to delete this staff member?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setStaff(staff.filter(person => person.id !== id));
            Alert.alert("Success", "Staff member deleted successfully");
          }
        }
      ]
    );
  };
  
  const renderStaffItem = ({ item }: { item: any }) => (
    <Card style={styles.staffCard}>
      <TouchableOpacity onPress={() => navigation.navigate(`/staff/${item.id}`)}>
        <View style={styles.staffHeader}>
          <View style={styles.staffInfo}>
            <Image 
              source={{ uri: item.avatar }} 
              style={styles.avatar} 
            />
            <View style={styles.staffDetails}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.staffRole}>{item.role}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => handleDeleteStaff(item.id)} 
              style={styles.actionButton}
            >
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
            <ChevronRight size={18} color={colors.gray} />
          </View>
        </View>
        
        <View style={styles.contactInfo}>
          {item.phone && (
            <View style={styles.contactRow}>
              <Phone size={16} color={colors.textLight} style={styles.contactIcon} />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
          
          {item.email && (
            <View style={styles.contactRow}>
              <Mail size={16} color={colors.textLight} style={styles.contactIcon} />
              <Text style={styles.contactText}>{item.email}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.staffFooter}>
          <Text style={styles.joinDate}>
            Joined: {item.joinDate.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Staff Management',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('/staff/add')}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>
      
      {staff.length === 0 ? (
        <EmptyState
          title="No staff members yet"
          message="Add your first staff member to see it here"
          icon={<UserCog size={64} color={colors.gray} />}
        />
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          title="No matching staff members"
          message="Try a different search term"
          icon={<Search size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          renderItem={renderStaffItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.addButtonContainer}>
        <Button
          title="Add New Staff Member"
          onPress={() => navigation.navigate('/staff/add')}
          icon={<Plus size={20} color={colors.white} />}
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  staffCard: {
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  staffDetails: {
    justifyContent: 'center',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 14,
    color: colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textLight,
  },
  staffFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  joinDate: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});