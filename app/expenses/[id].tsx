import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useExpensesStore, Expense } from '@/store/expensesStore';
import { 
  Calendar, 
  DollarSign, 
  Tag, 
  CreditCard, 
  FileText, 
  ArrowLeft,
  Edit2,
  Trash2
} from 'lucide-react-native';

export default function ExpenseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getExpenseById, deleteExpense } = useExpensesStore();
  const [expense, setExpense] = useState<Expense | null>(null);
  
  useEffect(() => {
    if (id) {
      const foundExpense = getExpenseById(id);
      if (foundExpense) {
        setExpense(foundExpense);
      } else {
        Alert.alert("Error", "Expense not found");
        router.back();
      }
    }
  }, [id, getExpenseById]);
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            if (expense) {
              deleteExpense(expense.id);
              Alert.alert(
                "Success",
                "Expense deleted successfully",
                [
                  { 
                    text: "OK", 
                    onPress: () => router.back() 
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };
  
  if (!expense) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Expense Details',
            headerLeft: () => (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={colors.primary} />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Expense Details',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{expense.title}</Text>
          <Text style={styles.amount}>₹{expense.amount.toFixed(2)}</Text>
        </View>
        
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(expense.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Tag size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{expense.category}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <CreditCard size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}
              </Text>
            </View>
          </View>
          
          {expense.notes && (
            <>
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <FileText size={20} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{expense.notes}</Text>
                </View>
              </View>
            </>
          )}
        </Card>
        
        <View style={styles.actionsContainer}>
          <Button
            title="Edit"
            onPress={() => router.push(`/expenses/edit/${expense.id}`)}
            icon={<Edit2 size={18} color={colors.white} />}
            style={styles.editButton}
          />
          
          <Button
            title="Delete"
            onPress={handleDelete}
            icon={<Trash2 size={18} color={colors.white} />}
            style={styles.deleteButton}
            variant="danger"
          />
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  detailsCard: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
  },
});