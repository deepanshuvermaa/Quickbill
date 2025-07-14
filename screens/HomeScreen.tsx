import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Stack, useRouter } from '@react-navigation/native'; // Not needed in React Native CLI
import { colors } from '@/constants/colors';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TrialBanner } from '@/components/TrialBanner';
import { GuestBanner } from '@/components/GuestBanner';
import { useBillsStore } from '@/store/billsStore';
import { useItemsStore } from '@/store/itemsStore';
import { useCustomersStore } from '@/store/customersStore';
import { useExpensesStore } from '@/store/expensesStore';
import { 
  ShoppingBag, 
  Users, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar
} from 'lucide-react-native';
// Hamburger menu import removed
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  // // Hamburger menu hook removed // Commented out for now
  const { bills } = useBillsStore();
  const { items, initializeWithMockData } = useItemsStore();
  const { customers } = useCustomersStore();
  const { expenses } = useExpensesStore();
  
  // Initialize with mock data if no items exist
  useEffect(() => {
    if (items.length === 0) {
      initializeWithMockData();
    }
  }, [items.length, initializeWithMockData]);
  
  // Calculate total sales
  const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate profit
  const profit = totalSales - totalExpenses;
  
  // Get today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = bills
    .filter(bill => new Date(bill.createdAt) >= today)
    .reduce((sum, bill) => sum + bill.total, 0);
  
  // Get recent bills (last 5)
  const recentBills = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  // Get low stock items
  const lowStockItems = items
    .filter(item => item.stock && item.stock < 10)
    .slice(0, 5);
  
  // Handle navigation to reports
  const handleNavigateToReport = (reportType: string) => {
    // Check if the report screen exists
    if (reportType === 'sales' || reportType === 'inventory' || 
        reportType === 'expenses' || reportType === 'profit-loss') {
      navigation.navigate(`/reports/${reportType });
    } else {
      // Fallback to the main reports page
      navigation.navigate('Reports');
    }
  };
  
  return (
    <View style={styles.container}>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GuestBanner />
        <TrialBanner />
        
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Sales"
            value={`₹${totalSales.toFixed(2)}`}
            icon={<Receipt size={24} color={colors.primary} />}
            color={colors.primary}
            onPress={() => handleNavigateToReport('sales')}
          />
          
          <StatCard
            title="Items"
            value={items.length.toString()}
            icon={<ShoppingBag size={24} color={colors.primary} />}
            color={colors.primary}
            onPress={() => navigation.navigate('Items')}
          />
          
          <StatCard
            title="Customers"
            value={customers.length.toString()}
            icon={<Users size={24} color={colors.primary} />}
            color={colors.primary}
            onPress={() => navigation.navigate('Customers')}
          />
          
          <StatCard
            title="Expenses"
            value={`₹${totalExpenses.toFixed(2)}`}
            icon={<DollarSign size={24} color={colors.primary} />}
            color={colors.primary}
            onPress={() => navigation.navigate('Expenses')}
          />
        </View>
        
        <View style={styles.row}>
          <Card style={[styles.card, styles.profitCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Profit/Loss</Text>
              {profit >= 0 ? (
                <TrendingUp size={20} color={colors.success} />
              ) : (
                <TrendingDown size={20} color={colors.danger} />
              )}
            </View>
            
            <Text 
              style={[
                styles.profitValue, 
                profit >= 0 ? styles.profitPositive : styles.profitNegative
              ]}
            >
              {profit >= 0 ? '+' : ''}₹{profit.toFixed(2)}
            </Text>
            
            <TouchableOpacity 
              style={styles.viewReportButton}
              onPress={() => handleNavigateToReport('profit-loss')}
            >
              <Text style={styles.viewReportText}>View Report</Text>
            </TouchableOpacity>
          </Card>
          
          <Card style={[styles.card, styles.todaySalesCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Sales</Text>
              <Calendar size={20} color={colors.primary} />
            </View>
            
            <Text style={styles.todaySalesValue}>₹{todaySales.toFixed(2)}</Text>
            
            <TouchableOpacity 
              style={styles.viewReportButton}
              onPress={() => handleNavigateToReport('sales')}
            >
              <Text style={styles.viewReportText}>View Details</Text>
            </TouchableOpacity>
          </Card>
        </View>
        
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentBills.length === 0 ? (
            <Text style={styles.emptyText}>No recent bills</Text>
          ) : (
            recentBills.map(bill => (
              <TouchableOpacity 
                key={bill.id}
                style={styles.billItem}
                onPress={() => navigation.navigate('BillDetails', { id: bill.id })}
              >
                <View>
                  <Text style={styles.billCustomer}>{bill.customerName}</Text>
                  <Text style={styles.billDate}>
                    {new Date(bill.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                
                <View style={styles.billDetails}>
                  <Text style={styles.billItems}>{bill.items.length} items</Text>
                  <Text style={styles.billTotal}>₹{bill.total.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          
          <Button
            title="Create New Bill"
            onPress={() => navigation.navigate('Billing')}
            style={styles.createBillButton}
          />
        </Card>
        
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Low Stock Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Items')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {lowStockItems.length === 0 ? (
            <Text style={styles.emptyText}>No low stock items</Text>
          ) : (
            lowStockItems.map(item => (
              <TouchableOpacity 
                key={item.id}
                style={styles.stockItem}
                onPress={() => navigation.navigate('ItemDetails', { id: item.id })}
              >
                <View>
                  <Text style={styles.stockItemName}>{item.name}</Text>
                  <Text style={styles.stockItemCategory}>{item.category}</Text>
                </View>
                
                <View style={styles.stockDetails}>
                  <Text style={styles.stockItemPrice}>₹{item.price.toFixed(2)}</Text>
                  <Text style={styles.stockItemCount}>Stock: {item.stock}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          
          <Button
            title="Add New Item"
            onPress={() => navigation.navigate('AddItem')}
            variant="outline"
            style={styles.addItemButton}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 75 : 55, // Account for absolute positioned tab bar
    paddingTop: Platform.OS === 'ios' ? 88 : 56, // Account for header height
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    padding: 16,
  },
  profitCard: {
    marginRight: 8,
    backgroundColor: colors.white,
  },
  todaySalesCard: {
    marginLeft: 8,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  profitPositive: {
    color: colors.success,
  },
  profitNegative: {
    color: colors.danger,
  },
  todaySalesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  viewReportButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  viewReportText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 16,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  billCustomer: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  billDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  billDetails: {
    alignItems: 'flex-end',
  },
  billItems: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  createBillButton: {
    margin: 12,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  stockItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  stockItemCategory: {
    fontSize: 14,
    color: colors.textLight,
  },
  stockDetails: {
    alignItems: 'flex-end',
  },
  stockItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  stockItemCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
  },
  addItemButton: {
    margin: 12,
  },
});