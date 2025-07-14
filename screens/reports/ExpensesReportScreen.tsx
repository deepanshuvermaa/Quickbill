import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useExpensesStore } from '../../store/expensesStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Filter, 
  PieChart,
  DollarSign
} from 'lucide-react-native';
import { Expense } from '../../types';

// Helper function to format date
const formatDate = (date: number | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to group expenses by category
const groupExpensesByCategory = (expenses: Expense[]) => {
  const grouped = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        count: 0,
        expenses: [],
      };
    }
    acc[category].total += expense.amount;
    acc[category].count += 1;
    acc[category].expenses.push(expense);
    return acc;
  }, {} as Record<string, { total: number; count: number; expenses: Expense[] }>);
  
  return Object.entries(grouped).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    expenses: data.expenses,
  }));
};

// Helper function to get total expenses
const getTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// Helper function to get expense title
const getExpenseTitle = (expense: Expense): string => {
  if (expense.title) return expense.title;
  if (expense.description) return expense.description;
  return expense.category;
};

export default function ExpensesReportScreen() {
  const navigation = useNavigation<any>();
  const { expenses } = useExpensesStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week' | 'today'>('month');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Filter expenses based on time frame
  const getFilteredExpenses = (): Expense[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    
    return expenses.filter(expense => {
      const expenseDate = typeof expense.date === 'string' 
        ? new Date(expense.date).getTime() 
        : expense.date;
      
      switch (timeFrame) {
        case 'today':
          return expenseDate >= today;
        case 'week':
          return expenseDate >= weekAgo;
        case 'month':
          return expenseDate >= monthAgo;
        case 'all':
        default:
          return true;
      }
    });
  };
  
  const filteredExpenses = getFilteredExpenses();
  const groupedExpenses = groupExpensesByCategory(filteredExpenses);
  const totalExpenses = getTotalExpenses(filteredExpenses);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleExport = async () => {
    try {
      const { exportExpensesReport } = await import('../../utils/report-generator');
      const periodLabel = timeFrame === 'all' ? 'All Time' : timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1);
      const success = await exportExpensesReport(filteredExpenses, periodLabel);
      
      if (!success) {
        console.log('Export cancelled or failed');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expenses Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses Report</Text>
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleExport}
        >
          <Download size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>₹{totalExpenses.toFixed(2)}</Text>
          
          <View style={styles.timeFrameSelector}>
            <TouchableOpacity
              style={[
                styles.timeFrameOption,
                timeFrame === 'today' && styles.selectedTimeFrame
              ]}
              onPress={() => setTimeFrame('today')}
            >
              <Text 
                style={[
                  styles.timeFrameText,
                  timeFrame === 'today' && styles.selectedTimeFrameText
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeFrameOption,
                timeFrame === 'week' && styles.selectedTimeFrame
              ]}
              onPress={() => setTimeFrame('week')}
            >
              <Text 
                style={[
                  styles.timeFrameText,
                  timeFrame === 'week' && styles.selectedTimeFrameText
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeFrameOption,
                timeFrame === 'month' && styles.selectedTimeFrame
              ]}
              onPress={() => setTimeFrame('month')}
            >
              <Text 
                style={[
                  styles.timeFrameText,
                  timeFrame === 'month' && styles.selectedTimeFrameText
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeFrameOption,
                timeFrame === 'all' && styles.selectedTimeFrame
              ]}
              onPress={() => setTimeFrame('all')}
            >
              <Text 
                style={[
                  styles.timeFrameText,
                  timeFrame === 'all' && styles.selectedTimeFrameText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {filteredExpenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            message={`No expenses recorded for the selected time frame`}
            icon={<DollarSign size={64} color={colors.gray} />}
          />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expenses by Category</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
              </Text>
            </View>
            
            {groupedExpenses.map(({ category, total, count, expenses }) => (
              <Card key={category} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategoryExpanded(category)}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryCount}>
                      {count} {count === 1 ? 'expense' : 'expenses'}
                    </Text>
                  </View>
                  
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryTotal}>₹{total.toFixed(2)}</Text>
                    {expandedCategories.includes(category) ? (
                      <ChevronUp size={20} color={colors.text} />
                    ) : (
                      <ChevronDown size={20} color={colors.text} />
                    )}
                  </View>
                </TouchableOpacity>
                
                {expandedCategories.includes(category) && (
                  <View style={styles.expensesList}>
                    {expenses.map((expense) => (
                      <View key={expense.id} style={styles.expenseItem}>
                        <View style={styles.expenseLeft}>
                          <Text style={styles.expenseTitle}>
                            {getExpenseTitle(expense)}
                          </Text>
                          <View style={styles.expenseDetails}>
                            <Calendar size={12} color={colors.textLight} />
                            <Text style={styles.expenseDate}>
                              {formatDate(expense.date)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.expenseAmount}>
                          ₹{expense.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            ))}
          </>
        )}
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
  },
  exportButton: {
    padding: 8,
    marginRight: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  timeFrameSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: colors.grayLight,
    padding: 4,
  },
  timeFrameOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  selectedTimeFrame: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  timeFrameText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedTimeFrameText: {
    color: colors.text,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  categoryCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  expensesList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  expenseLeft: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDate: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});