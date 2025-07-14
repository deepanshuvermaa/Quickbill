import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { useBillsStore } from '@/store/billsStore';
import { useItemsStore } from '@/store/itemsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BillCard } from '@/components/BillCard';
import { EmptyState } from '@/components/EmptyState';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { printOrShareBill } from '@/utils/print';
import { Receipt, Bluetooth } from 'lucide-react-native';
import { 
  PrinterDevice, 
  printBillToPrinter, 
  ensureBluetoothReady,
  testPrinterConnection
} from '@/utils/bluetooth-print';
// Hamburger menu import removed

export default function HistoryScreen() {
  const navigation = useNavigation();
  // Hamburger menu hook removed
  const { bills, deleteBill, getBillById } = useBillsStore();
  const { updateItemStock } = useItemsStore();
  const { primaryPrinter, setPrimaryPrinter } = useSettingsStore();
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
    
    // Check if there's a primary printer set
    if (primaryPrinter) {
      // Test connection to primary printer
      const connectionWorking = await testPrinterConnection(primaryPrinter);
      
      if (connectionWorking) {
        // Print directly to primary printer
        try {
          const success = await printBillToPrinter(bill, primaryPrinter);
          
          if (success) {
            Alert.alert("Success", `Bill sent to ${primaryPrinter.name} successfully`);
          } else {
            // Connection failed, show options
            Alert.alert(
              "Print Failed",
              `Failed to print to ${primaryPrinter.name}. Would you like to select a different printer?`,
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Select Printer", 
                  onPress: () => {
                    setSelectedBill(billId);
                    setShowPrinterModal(true);
                  }
                }
              ]
            );
          }
        } catch (error) {
          console.error('Error printing to primary printer:', error);
          Alert.alert(
            "Print Error",
            `Error printing to ${primaryPrinter.name}. Would you like to select a different printer?`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Select Printer", 
                onPress: () => {
                  setSelectedBill(billId);
                  setShowPrinterModal(true);
                }
              }
            ]
          );
        }
      } else {
        // Primary printer not available, show options
        Alert.alert(
          "Printer Unavailable",
          `Primary printer "${primaryPrinter.name}" is not available. Would you like to select a different printer?`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Select Printer", 
              onPress: () => {
                setSelectedBill(billId);
                setShowPrinterModal(true);
              }
            }
          ]
        );
      }
    } else {
      // No primary printer set, show printer selection modal
      setSelectedBill(billId);
      setShowPrinterModal(true);
    }
  };
  
  const handlePrinterSelected = async (printer: PrinterDevice) => {
    setShowPrinterModal(false);
    
    if (!selectedBill) return;
    
    const bill = getBillById(selectedBill);
    if (!bill) return;
    
    try {
      const success = await printBillToPrinter(bill, printer);
      
      if (success) {
        // Set this printer as the primary printer for future use
        setPrimaryPrinter({
          id: printer.id,
          name: printer.name,
          address: printer.address
        });
        
        Alert.alert(
          "Success", 
          `Bill sent to ${printer.name} successfully.\n\nThis printer has been set as your primary printer for future printing.`
        );
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
    <View style={styles.container}>
      
            </TouchableOpacity>
          ),
          headerRight: () => (
            Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={styles.printerButton}
                onPress={() => navigation.navigate('PrinterSettings')}
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
              onPress={() => navigation.navigate('BillDetails', { id: bill.id })}
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
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