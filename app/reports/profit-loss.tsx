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
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useBillsStore } from '@/store/billsStore';
import { useExpensesStore } from '@/store/expensesStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Filter, 
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react-native';
import { Bill, Expense } from '@/types';
import { printReportToBluetooth, formatProfitLossReport } from '@/utils/print-reports';
import { useSettingsStore } from '@/store/settingsStore';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { Printer } from 'lucide-react-native';
import { Alert } from 'react-native';

// Helper function to format date
const formatDate = (date: number | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to get expense title
const getExpenseTitle = (expense: Expense): string => {
  if (expense.title) return expense.title;
  if (expense.description) return expense.description;
  return expense.category;
};

export default function ProfitLossReportScreen() {
  const router = useRouter();
  const { bills } = useBillsStore();
  const { expenses } = useExpensesStore();
  const { primaryPrinter, setPrimaryPrinter, businessInfo, paperSize } = useSettingsStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week' | 'today'>('month');
  const [showSales, setShowSales] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  
  // Filter data based on time frame
  const getFilteredData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    
    const filteredBills = bills.filter(bill => {
      switch (timeFrame) {
        case 'today':
          return bill.createdAt >= today;
        case 'week':
          return bill.createdAt >= weekAgo;
        case 'month':
          return bill.createdAt >= monthAgo;
        case 'all':
        default:
          return true;
      }
    });
    
    const filteredExpenses = expenses.filter(expense => {
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
    
    return { filteredBills, filteredExpenses };
  };
  
  const { filteredBills, filteredExpenses } = getFilteredData();
  
  // Calculate totals
  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleExport = () => {
    // In a real app, this would export the report data
    console.log('Exporting profit/loss report...');
  };
  
  // Handle Bluetooth printing
  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    
    try {
      const { filteredBills, filteredExpenses } = getFilteredData();
      
      const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate date range
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      
      let startDate: Date;
      switch (timeFrame) {
        case 'today':
          startDate = new Date(today);
          break;
        case 'week':
          startDate = new Date(weekAgo);
          break;
        case 'month':
          startDate = new Date(monthAgo);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      // Revenue breakdown by payment method
      const revenueBreakdown: Record<string, number> = {};
      filteredBills.forEach(bill => {
        const method = bill.paymentMethod || 'cash';
        const methodName = method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
        revenueBreakdown[methodName] = (revenueBreakdown[methodName] || 0) + bill.total;
      });
      
      // Expense breakdown by category
      const expenseBreakdown: Record<string, number> = {};
      filteredExpenses.forEach(expense => {
        expenseBreakdown[expense.category] = (expenseBreakdown[expense.category] || 0) + expense.amount;
      });
      
      // Prepare report data
      const reportData = {
        businessName: businessInfo?.name,
        dateRange: timeFrame === 'all' ? undefined : { start: startDate, end: now },
        totalRevenue,
        totalExpenses,
        revenueBreakdown,
        expenseBreakdown
      };
      
      const success = await printReportToBluetooth(
        formatProfitLossReport(reportData, paperSize || '2inch'),
        primaryPrinter,
        () => setShowPrinterModal(true),
        paperSize || '2inch'
      );
      
      if (!success && !showPrinterModal) {
        Alert.alert('Print Failed', 'Unable to print the report. Please check your printer connection.');
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'An error occurred while printing the report.');
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handlePrinterSelected = async (printer: any) => {
    setShowPrinterModal(false);
    setPrimaryPrinter({
      id: printer.id,
      name: printer.name,
      address: printer.address
    });
    // Retry printing with the selected printer
    await handleBluetoothPrint();
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Profit & Loss',
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Profit & Loss',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={handleBluetoothPrint}
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Printer size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleExport}
              >
                <Download size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Net Profit</Text>
          <Text style={[
            styles.summaryAmount,
            netProfit >= 0 ? styles.profitAmount : styles.lossAmount
          ]}>
            ₹{netProfit.toFixed(2)}
          </Text>
          
          <View style={styles.profitMarginContainer}>
            {netProfit >= 0 ? (
              <TrendingUp size={16} color={colors.success} />
            ) : (
              <TrendingDown size={16} color={colors.danger} />
            )}
            <Text style={[
              styles.profitMarginText,
              netProfit >= 0 ? styles.profitText : styles.lossText
            ]}>
              {profitMargin.toFixed(2)}% Profit Margin
            </Text>
          </View>
          
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
        
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Receipt size={20} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>₹{totalSales.toFixed(2)}</Text>
            <Text style={styles.statCount}>
              {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}
            </Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={20} color={colors.danger} />
            </View>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>₹{totalExpenses.toFixed(2)}</Text>
            <Text style={styles.statCount}>
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
            </Text>
          </Card>
        </View>
        
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            style={styles.detailsHeader}
            onPress={() => setShowSales(!showSales)}
          >
            <View style={styles.detailsHeaderLeft}>
              <Receipt size={20} color={colors.primary} />
              <Text style={styles.detailsTitle}>Sales</Text>
            </View>
            {showSales ? (
              <ChevronUp size={20} color={colors.text} />
            ) : (
              <ChevronDown size={20} color={colors.text} />
            )}
          </TouchableOpacity>
          
          {showSales && (
            <Card style={styles.detailsCard}>
              {filteredBills.length === 0 ? (
                <View style={styles.emptyDetails}>
                  <Text style={styles.emptyText}>No sales in this period</Text>
                </View>
              ) : (
                filteredBills.map((bill) => (
                  <View key={bill.id} style={styles.detailItem}>
                    <View style={styles.detailItemLeft}>
                      <Text style={styles.detailItemTitle}>
                        {bill.invoiceNumber ? `Invoice #${bill.invoiceNumber}` : `Bill #${bill.id.substring(0, 8)}`}
                      </Text>
                      <View style={styles.detailItemInfo}>
                        <Calendar size={12} color={colors.textLight} />
                        <Text style={styles.detailItemDate}>
                          {formatDate(bill.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.detailItemAmount}>
                      ₹{bill.total.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          )}
          
          <TouchableOpacity
            style={[styles.detailsHeader, { marginTop: 16 }]}
            onPress={() => setShowExpenses(!showExpenses)}
          >
            <View style={styles.detailsHeaderLeft}>
              <DollarSign size={20} color={colors.danger} />
              <Text style={styles.detailsTitle}>Expenses</Text>
            </View>
            {showExpenses ? (
              <ChevronUp size={20} color={colors.text} />
            ) : (
              <ChevronDown size={20} color={colors.text} />
            )}
          </TouchableOpacity>
          
          {showExpenses && (
            <Card style={styles.detailsCard}>
              {filteredExpenses.length === 0 ? (
                <View style={styles.emptyDetails}>
                  <Text style={styles.emptyText}>No expenses in this period</Text>
                </View>
              ) : (
                filteredExpenses.map((expense) => (
                  <View key={expense.id} style={styles.detailItem}>
                    <View style={styles.detailItemLeft}>
                      <Text style={styles.detailItemTitle}>
                        {getExpenseTitle(expense)}
                      </Text>
                      <View style={styles.detailItemInfo}>
                        <Calendar size={12} color={colors.textLight} />
                        <Text style={styles.detailItemDate}>
                          {formatDate(expense.date)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.detailItemAmount}>
                      ₹{expense.amount.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          )}
        </View>
      </ScrollView>
      
      {/* Printer Selection Modal */}
      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={handlePrinterSelected}
      />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
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
    marginBottom: 8,
  },
  profitAmount: {
    color: colors.success,
  },
  lossAmount: {
    color: colors.danger,
  },
  profitMarginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profitMarginText: {
    fontSize: 14,
    marginLeft: 4,
  },
  profitText: {
    color: colors.success,
  },
  lossText: {
    color: colors.danger,
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
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 12,
    color: colors.textLight,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  detailsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  detailItemLeft: {
    flex: 1,
  },
  detailItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  detailItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItemDate: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
  detailItemAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  emptyDetails: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
  },
});