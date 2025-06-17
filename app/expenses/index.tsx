import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  ChevronRight, 
  Trash2,
  ArrowLeft
} from 'lucide-react-native';
import { useExpensesStore } from '@/store/expensesStore';

export default function ExpensesScreen() {
  const router = useRouter();
  const { expenses, deleteExpense } = useExpensesStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expense.category && expense.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteExpense(id);
            Alert.alert("Success", "Expense deleted successfully");
          }
        }
      ]
    );
  };
  
  const renderExpenseItem = ({ item }: { item: any }) => (
    <Card style={styles.expenseCard}>
      <TouchableOpacity onPress={() => router.push(`/expenses/${item.id}`)}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseDescription} numberOfLines={1} ellipsizeMode="tail">
            {item.description}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => handleDeleteExpense(item.id)} 
              style={styles.actionButton}
            >
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
            <ChevronRight size={18} color={colors.gray} />
          </View>
        </View>
        
        <View style={styles.expenseInfo}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.textLight} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          
          {item.category && (
            <View style={styles.infoRow}>
              <Tag size={16} color={colors.textLight} style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.category}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.expenseFooter}>
          <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Expenses',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/expenses/add')}
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
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>
      
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>
            ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
          </Text>
        </Card>
      </View>
      
      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          message="Add your first expense to see it here"
          icon={<DollarSign size={64} color={colors.gray} />}
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title="No matching expenses"
          message="Try a different search term"
          icon={<Search size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.addButtonContainer}>
        <Button
          title="Add New Expense"
          onPress={() => router.push('/expenses/add')}
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
  summaryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  expenseInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.danger,
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