import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useBillsStore } from '@/store/billsStore';
import { useItemsStore } from '@/store/itemsStore';
import { BillCard } from '@/components/BillCard';
import { EmptyState } from '@/components/EmptyState';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { printOrShareBill } from '@/utils/print';
import { Receipt, Menu, Bluetooth } from 'lucide-react-native';
import { 
  PrinterDevice, 
  printBillToPrinter, 
  ensureBluetoothReady
} from '@/utils/bluetooth-print';
import { useHamburgerMenu } from '../../_layout';

export default function HistoryScreen() {
  const router = useRouter();
  const { toggleMenu } = useHamburgerMenu();
  const { bills, deleteBill, getBillById } = useBillsStore();
  const { updateItemStock } = useItemsStore();
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  
  const handlePrint = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    
    if (Platform.OS === 'web') {
      // For web, use the existing print functionality
      printOrShareBill(bill);
      return;
    }
    
    // Check if Bluetooth is enabled
    const bluetoothReady = await ensureBluetoothReady();
    if (!bluetoothReady) {
      Alert.alert(
        "Bluetooth Required",
        "Please enable Bluetooth to print receipts.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Settings", 
            onPress: () => {
              // In a real implementation, we would open Bluetooth settings
              console.log("Opening Bluetooth settings...");
            }
          }
        ]
      );
      return;
    }
    
    // Show printer selection modal directly
    setSelectedBill(billId);
    setShowPrinterModal(true);
  };
  
  const handlePrinterSelected = async (printer: PrinterDevice) => {
    setShowPrinterModal(false);
    
    if (!selectedBill) return;
    
    const bill = getBillById(selectedBill);
    if (!bill) return;
    
    try {
      const success = await printBillToPrinter(bill, printer);
      
      if (success) {
        Alert.alert("Success", "Bill sent to printer successfully");
      } else {
        Alert.alert("Error", "Failed to print bill. Please check printer connection.");
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      Alert.alert("Error", "Failed to print bill. Please try again.");
    } finally {
      setSelectedBill(null);
    }
  };
  
  const handleDeleteBill = (billId: string) => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            // Get the bill to restore inventory
            const bill = getBillById(billId);
            if (bill) {
              // Restore inventory stock for each item in the bill
              for (const item of bill.items) {
                updateItemStock(item.id, item.quantity); // Add back to stock
              }
            }
            
            // Delete the bill
            deleteBill(billId);
            Alert.alert("Success", "Bill deleted successfully and inventory restored");
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'Bill History',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={toggleMenu}
            >
              <Menu size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={styles.printerButton}
                onPress={() => router.push('/printer-settings')}
              >
                <Bluetooth size={24} color={colors.primary} />
              </TouchableOpacity>
            )
          )
        }} 
      />
      
      {bills.length === 0 ? (
        <EmptyState
          title="No bills yet"
          message="Create your first bill to see it here"
          icon={<Receipt size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(bill) => bill.id}
          renderItem={({ item: bill }) => (
            <BillCard
              bill={bill}
              onPress={() => router.push(`/bills/${bill.id}`)}
              onPrint={() => handlePrint(bill.id)}
              onShare={() => printOrShareBill(bill)}
              onDelete={() => handleDeleteBill(bill.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => {
          setShowPrinterModal(false);
          setSelectedBill(null);
        }}
        onPrinterSelected={handlePrinterSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 95 : 65, // Account for absolute positioned tab bar
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  printerButton: {
    padding: 8,
    marginRight: 8,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
});