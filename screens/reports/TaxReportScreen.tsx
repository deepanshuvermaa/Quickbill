import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useBillsStore } from '../../store/billsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { generateTaxReport } from '../../utils/report-generator';
import { calculateItemTax } from '../../utils/tax-calculator';
import {
  FileText,
  Download,
  Calendar,
  ChevronLeft,
  TrendingUp,
  Receipt,
  DollarSign,
  ArrowLeft
} from 'lucide-react-native';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export default function TaxReportScreen() {
  const navigation = useNavigation<any>();
  const { bills } = useBillsStore();
  const { taxSettings } = useSettingsStore();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (selectedPeriod) {
      case 'daily':
        return {
          start: startOfDay.getTime(),
          end: endOfDay.getTime()
        };
      case 'weekly':
        const weekStart = new Date(startOfDay);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return {
          start: weekStart.getTime(),
          end: endOfDay.getTime()
        };
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: monthStart.getTime(),
          end: endOfDay.getTime()
        };
      case 'yearly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          start: yearStart.getTime(),
          end: endOfDay.getTime()
        };
      case 'custom':
        return {
          start: customStartDate.getTime(),
          end: customEndDate.getTime()
        };
      default:
        return {
          start: startOfDay.getTime(),
          end: endOfDay.getTime()
        };
    }
  };

  // Filter bills by date range
  const filteredBills = useMemo(() => {
    const { start, end } = getDateRange();
    return bills.filter(bill => bill.createdAt >= start && bill.createdAt <= end);
  }, [bills, selectedPeriod, customStartDate, customEndDate]);

  // Calculate tax breakdown
  const taxBreakdown = useMemo(() => {
    const breakdown = {
      totalSales: 0,
      totalTaxCollected: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      singleTax: 0,
      billCount: 0,
      taxableSales: 0,
      nonTaxableSales: 0,
      itemWiseTax: [] as Array<{
        itemName: string;
        quantity: number;
        amount: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
      }>
    };

    filteredBills.forEach(bill => {
      breakdown.billCount += 1;
      let billTaxTotal = 0;
      let billSubtotal = 0;

      // Calculate tax for each item
      bill.items.forEach(item => {
        const taxCalc = calculateItemTax(
          item.price,
          item.quantity,
          item.taxType,
          item.gstRate,
          item.igstRate
        );

        billSubtotal += taxCalc.itemAmount;
        billTaxTotal += taxCalc.taxAmount;
        
        breakdown.cgst += taxCalc.cgst;
        breakdown.sgst += taxCalc.sgst;
        breakdown.igst += taxCalc.igst;

        if (taxCalc.taxAmount > 0) {
          breakdown.taxableSales += taxCalc.itemAmount;
          
          // Add to item-wise breakdown
          breakdown.itemWiseTax.push({
            itemName: item.name,
            quantity: item.quantity,
            amount: taxCalc.itemAmount,
            cgst: taxCalc.cgst,
            sgst: taxCalc.sgst,
            igst: taxCalc.igst,
            totalTax: taxCalc.taxAmount
          });
        } else {
          breakdown.nonTaxableSales += taxCalc.itemAmount;
        }
      });

      // Apply discount proportionally if any
      if (bill.discount > 0 && billSubtotal > 0) {
        const discountRatio = bill.discount / billSubtotal;
        breakdown.taxableSales -= bill.discount * (breakdown.taxableSales / billSubtotal);
        breakdown.nonTaxableSales -= bill.discount * (breakdown.nonTaxableSales / billSubtotal);
      }

      breakdown.totalSales += billSubtotal + billTaxTotal - bill.discount;
      breakdown.totalTaxCollected += billTaxTotal;
    });

    return breakdown;
  }, [filteredBills]);

  const handleDownloadReport = async () => {
    try {
      const reportData = {
        period: selectedPeriod,
        dateRange: getDateRange(),
        taxSettings,
        breakdown: taxBreakdown,
        bills: filteredBills
      };

      await generateTaxReport(reportData);
      Alert.alert('Success', 'Tax report downloaded successfully!');
    } catch (error) {
      console.error('Error generating tax report:', error);
      Alert.alert('Error', 'Failed to generate tax report');
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const renderPeriodButton = (period: ReportPeriod, label: string) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.periodButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Report</Text>
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleDownloadReport}
        >
          <Download size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Selection */}
        <Card style={styles.periodCard}>
          <Text style={styles.sectionTitle}>Select Period</Text>
          <View style={styles.periodButtonsContainer}>
            {renderPeriodButton('daily', 'Daily')}
            {renderPeriodButton('weekly', 'Weekly')}
            {renderPeriodButton('monthly', 'Monthly')}
            {renderPeriodButton('yearly', 'Yearly')}
          </View>
        </Card>

        {/* Tax Summary */}
        {filteredBills.length === 0 ? (
          <EmptyState
            title="No bills found"
            message={`No bills found for the selected ${selectedPeriod} period`}
            icon={<Receipt size={64} color={colors.gray} />}
          />
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Tax Summary</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Sales</Text>
                  <Text style={styles.statValue}>{formatCurrency(taxBreakdown.totalSales)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tax Collected</Text>
                  <Text style={[styles.statValue, styles.taxValue]}>
                    {formatCurrency(taxBreakdown.totalTaxCollected)}
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Taxable Sales</Text>
                  <Text style={styles.statValue}>{formatCurrency(taxBreakdown.taxableSales)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Non-Taxable Sales</Text>
                  <Text style={styles.statValue}>{formatCurrency(taxBreakdown.nonTaxableSales)}</Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Bills</Text>
                  <Text style={styles.statValue}>{taxBreakdown.billCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg Tax/Bill</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(
                      taxBreakdown.billCount > 0 
                        ? taxBreakdown.totalTaxCollected / taxBreakdown.billCount 
                        : 0
                    )}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Tax Breakdown by Type */}
            {taxBreakdown.totalTaxCollected > 0 && (
              <Card style={styles.breakdownCard}>
                <Text style={styles.sectionTitle}>Tax Breakdown</Text>
                
                {taxBreakdown.cgst > 0 && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>CGST</Text>
                    <Text style={styles.taxAmount}>{formatCurrency(taxBreakdown.cgst)}</Text>
                  </View>
                )}
                
                {taxBreakdown.sgst > 0 && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>SGST</Text>
                    <Text style={styles.taxAmount}>{formatCurrency(taxBreakdown.sgst)}</Text>
                  </View>
                )}
                
                {taxBreakdown.igst > 0 && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>IGST</Text>
                    <Text style={styles.taxAmount}>{formatCurrency(taxBreakdown.igst)}</Text>
                  </View>
                )}
                
                <View style={[styles.taxRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Tax</Text>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(taxBreakdown.totalTaxCollected)}
                  </Text>
                </View>
              </Card>
            )}
            
            {/* Item-wise Tax Summary */}
            {taxBreakdown.itemWiseTax.length > 0 && (
              <Card style={styles.itemTaxCard}>
                <Text style={styles.sectionTitle}>Item-wise Tax Details</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCell, styles.itemNameCell]}>Item</Text>
                      <Text style={[styles.tableCell, styles.qtyCell]}>Qty</Text>
                      <Text style={[styles.tableCell, styles.amountCell]}>Amount</Text>
                      <Text style={[styles.tableCell, styles.taxCell]}>CGST</Text>
                      <Text style={[styles.tableCell, styles.taxCell]}>SGST</Text>
                      <Text style={[styles.tableCell, styles.taxCell]}>IGST</Text>
                      <Text style={[styles.tableCell, styles.totalTaxCell]}>Total Tax</Text>
                    </View>
                    {taxBreakdown.itemWiseTax.slice(0, 10).map((item, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.itemNameCell]} numberOfLines={1}>
                          {item.itemName}
                        </Text>
                        <Text style={[styles.tableCell, styles.qtyCell]}>{item.quantity}</Text>
                        <Text style={[styles.tableCell, styles.amountCell]}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <Text style={[styles.tableCell, styles.taxCell]}>
                          {item.cgst > 0 ? formatCurrency(item.cgst) : '-'}
                        </Text>
                        <Text style={[styles.tableCell, styles.taxCell]}>
                          {item.sgst > 0 ? formatCurrency(item.sgst) : '-'}
                        </Text>
                        <Text style={[styles.tableCell, styles.taxCell]}>
                          {item.igst > 0 ? formatCurrency(item.igst) : '-'}
                        </Text>
                        <Text style={[styles.tableCell, styles.totalTaxCell]}>
                          {formatCurrency(item.totalTax)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {taxBreakdown.itemWiseTax.length > 10 && (
                  <Text style={styles.moreItemsText}>
                    And {taxBreakdown.itemWiseTax.length - 10} more items...
                  </Text>
                )}
              </Card>
            )}

            {/* Download Button */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadReport}
            >
              <Download size={20} color={colors.white} />
              <Text style={styles.downloadButtonText}>Download Tax Report</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  periodCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  periodButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
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
  },
  taxValue: {
    color: colors.primary,
  },
  breakdownCard: {
    marginBottom: 16,
    padding: 16,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  taxAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  backButton: {
    padding: 8,
  },
  exportButton: {
    padding: 8,
  },
  itemTaxCard: {
    marginBottom: 16,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.grayLight,
    paddingVertical: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
  itemNameCell: {
    width: 120,
    color: colors.text,
  },
  qtyCell: {
    width: 40,
    textAlign: 'center',
    color: colors.text,
  },
  amountCell: {
    width: 80,
    textAlign: 'right',
    color: colors.text,
  },
  taxCell: {
    width: 70,
    textAlign: 'right',
    color: colors.text,
  },
  totalTaxCell: {
    width: 80,
    textAlign: 'right',
    color: colors.primary,
    fontWeight: '600',
  },
  moreItemsText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});