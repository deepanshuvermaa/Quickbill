import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { useBillsStore } from '@/store/billsStore';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  BarChart, 
  Download,
  Share2,
  FileText,
  Package
} from 'lucide-react-native';
import { exportBillWiseReport, exportItemWiseReport } from '@/utils/report-generator';
import { printReportToBluetooth, formatSalesReport } from '@/utils/print-reports';
import { useSettingsStore } from '@/store/settingsStore';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { Printer } from 'lucide-react-native';

export default function SalesReportScreen() {
  const router = useRouter();
  const { bills } = useBillsStore();
  const { primaryPrinter, setPrimaryPrinter, businessInfo, paperSize } = useSettingsStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [reportType, setReportType] = useState<'bill-wise' | 'item-wise'>('bill-wise');
  
  // Get current date
  const now = new Date();
  
  // Calculate date ranges
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const yearStart = new Date(now.getFullYear(), 0, 1);
  
  // Filter bills based on selected period
  const getFilteredBills = () => {
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = weekStart;
        break;
      case 'month':
        startDate = monthStart;
        break;
      case 'year':
        startDate = yearStart;
        break;
      default:
        startDate = weekStart;
    }
    
    return bills.filter(bill => new Date(bill.createdAt) >= startDate);
  };
  
  const filteredBills = getFilteredBills();
  
  // Calculate total sales
  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  
  // Calculate average sale
  const averageSale = filteredBills.length > 0 
    ? totalSales / filteredBills.length 
    : 0;
  
  // Get top selling items
  const getTopSellingItems = () => {
    const itemMap = new Map<string, { name: string, quantity: number, total: number }>();
    
    filteredBills.forEach(bill => {
      bill.items.forEach(item => {
        const existingItem = itemMap.get(item.id);
        
        if (existingItem) {
          itemMap.set(item.id, {
            name: item.name,
            quantity: existingItem.quantity + item.quantity,
            total: existingItem.total + (item.price * item.quantity)
          });
        } else {
          itemMap.set(item.id, {
            name: item.name,
            quantity: item.quantity,
            total: item.price * item.quantity
          });
        }
      });
    });
    
    return Array.from(itemMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };
  
  const topSellingItems = getTopSellingItems();
  
  // Get sales by payment method
  const getSalesByPaymentMethod = () => {
    const paymentMap = new Map<string, number>();
    
    filteredBills.forEach(bill => {
      const method = bill.paymentMethod;
      const existingTotal = paymentMap.get(method) || 0;
      paymentMap.set(method, existingTotal + bill.total);
    });
    
    return Array.from(paymentMap.entries()).map(([method, total]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
      total
    }));
  };
  
  const salesByPaymentMethod = getSalesByPaymentMethod();
  
  // Format period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return 'This Week';
    }
  };

  // Handle bill-wise report export
  const handleBillWiseReport = async () => {
    setIsExporting(true);
    try {
      const success = await exportBillWiseReport(filteredBills, getPeriodLabel(), paperSize || '2inch');
      
      if (success) {
        Alert.alert(
          'Export Successful',
          'Bill-wise report has been generated and is ready to print/share.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to generate the bill-wise report. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        'An error occurred while generating the report.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle item-wise report export
  const handleItemWiseReport = async () => {
    setIsExporting(true);
    try {
      const success = await exportItemWiseReport(filteredBills, getPeriodLabel(), paperSize || '2inch');
      
      if (success) {
        Alert.alert(
          'Export Successful',
          'Item-wise report has been generated and is ready to print/share.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to generate the item-wise report. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        'An error occurred while generating the report.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Handle report export based on selected type
  const handleExportReport = async () => {
    if (reportType === 'bill-wise') {
      await handleBillWiseReport();
    } else {
      await handleItemWiseReport();
    }
  };
  
  // Handle Bluetooth printing
  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    
    try {
      // Calculate date range
      let startDate: Date;
      switch (selectedPeriod) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate = weekStart;
          break;
        case 'month':
          startDate = monthStart;
          break;
        case 'year':
          startDate = yearStart;
          break;
        default:
          startDate = weekStart;
      }
      
      // Get payment breakdown
      const paymentBreakdown: Record<string, number> = {};
      salesByPaymentMethod.forEach(pm => {
        paymentBreakdown[pm.method] = pm.total;
      });
      
      // Prepare report data
      const reportData = {
        businessName: businessInfo?.name,
        dateRange: { start: startDate, end: now },
        totalSales,
        totalOrders: filteredBills.length,
        avgOrderValue: averageSale,
        totalTax: filteredBills.reduce((sum, bill) => sum + (bill.tax || 0), 0),
        totalDiscount: filteredBills.reduce((sum, bill) => sum + (bill.discount || 0), 0),
        topProducts: topSellingItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          revenue: item.total
        })),
        paymentBreakdown
      };
      
      const success = await printReportToBluetooth(
        formatSalesReport(reportData, paperSize || '2inch'),
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
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Sales Report',
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
                onPress={handleExportReport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Download size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodOption,
              selectedPeriod === 'today' && styles.selectedPeriod
            ]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text 
              style={[
                styles.periodText,
                selectedPeriod === 'today' && styles.selectedPeriodText
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodOption,
              selectedPeriod === 'week' && styles.selectedPeriod
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text 
              style={[
                styles.periodText,
                selectedPeriod === 'week' && styles.selectedPeriodText
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodOption,
              selectedPeriod === 'month' && styles.selectedPeriod
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text 
              style={[
                styles.periodText,
                selectedPeriod === 'month' && styles.selectedPeriodText
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodOption,
              selectedPeriod === 'year' && styles.selectedPeriod
            ]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text 
              style={[
                styles.periodText,
                selectedPeriod === 'year' && styles.selectedPeriodText
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.reportTypeSelector}>
          <Text style={styles.reportTypeLabelText}>Report Type:</Text>
          <View style={styles.reportTypeOptions}>
            <TouchableOpacity
              style={[
                styles.reportTypeOption,
                reportType === 'bill-wise' && styles.selectedReportType
              ]}
              onPress={() => setReportType('bill-wise')}
            >
              <FileText size={16} color={reportType === 'bill-wise' ? colors.white : colors.primary} />
              <Text 
                style={[
                  styles.reportTypeText,
                  reportType === 'bill-wise' && styles.selectedReportTypeText
                ]}
              >
                Bill-wise
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.reportTypeOption,
                reportType === 'item-wise' && styles.selectedReportType
              ]}
              onPress={() => setReportType('item-wise')}
            >
              <Package size={16} color={reportType === 'item-wise' ? colors.white : colors.primary} />
              <Text 
                style={[
                  styles.reportTypeText,
                  reportType === 'item-wise' && styles.selectedReportTypeText
                ]}
              >
                Item-wise
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Calendar size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Period</Text>
            <Text style={styles.summaryValue}>{getPeriodLabel()}</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <BarChart size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>₹{totalSales.toFixed(2)}</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Average Sale</Text>
            <Text style={styles.summaryValue}>₹{averageSale.toFixed(2)}</Text>
          </Card>
        </View>
        
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          
          {topSellingItems.length === 0 ? (
            <Text style={styles.emptyText}>No sales data available</Text>
          ) : (
            topSellingItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
              </View>
            ))
          )}
        </Card>
        
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sales by Payment Method</Text>
          
          {salesByPaymentMethod.length === 0 ? (
            <Text style={styles.emptyText}>No sales data available</Text>
          ) : (
            salesByPaymentMethod.map((item, index) => (
              <View key={index} style={styles.paymentRow}>
                <Text style={styles.paymentMethod}>{item.method}</Text>
                <Text style={styles.paymentTotal}>₹{item.total.toFixed(2)}</Text>
              </View>
            ))
          )}
        </Card>
        
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {filteredBills.length === 0 ? (
            <Text style={styles.emptyText}>No transactions available</Text>
          ) : (
            filteredBills
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((bill) => (
                <TouchableOpacity 
                  key={bill.id}
                  style={styles.transactionRow}
                  onPress={() => router.push(`/bills/${bill.id}`)}
                >
                  <View>
                    <Text style={styles.transactionCustomer}>{bill.customerName}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(bill.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionItems}>{bill.items.length} items</Text>
                    <Text style={styles.transactionTotal}>₹{bill.total.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))
          )}
        </Card>
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
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedPeriod: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedPeriodText: {
    color: colors.white,
    fontWeight: '600',
  },
  reportTypeSelector: {
    marginBottom: 16,
  },
  reportTypeLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  reportTypeOptions: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 4,
  },
  reportTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectedReportType: {
    backgroundColor: colors.primary,
  },
  reportTypeText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  selectedReportTypeText: {
    color: colors.white,
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '31%',
    padding: 12,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textLight,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  paymentTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  transactionCustomer: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionItems: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  transactionTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});