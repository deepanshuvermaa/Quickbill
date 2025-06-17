import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useBillsStore } from '@/store/billsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PrinterSelectionModal } from '@/components/PrinterSelectionModal';
import { printOrShareBill } from '@/utils/print';
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Trash2, 
  User, 
  Phone, 
  Calendar, 
  CreditCard,
  Bluetooth
} from 'lucide-react-native';
import { 
  printBillToPrinter, 
  PrinterDevice,
  ensureBluetoothReady
} from '@/utils/bluetooth-print';
import { formatPaymentMethod } from '@/utils/helpers';

export default function BillDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bills, deleteBill, getBillById } = useBillsStore();
  const { businessInfo } = useSettingsStore();
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  
  const bill = getBillById(id);
  
  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Bill Not Found',
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
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Bill not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const formattedDate = new Date(bill.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteBill(bill.id);
            Alert.alert("Success", "Bill deleted successfully");
            router.back();
          }
        }
      ]
    );
  };
  
  const handlePrintShare = async () => {
    try {
      await printOrShareBill(bill);
    } catch (error) {
      Alert.alert("Error", "Failed to print/share bill");
    }
  };
  
  const handlePrintToBluetooth = async () => {
    if (Platform.OS === 'web') {
      handlePrintShare();
      return;
    }
    
    console.log('Print to Bluetooth button pressed');
    
    // Check if Bluetooth is enabled
    try {
      console.log('Checking if Bluetooth is ready...');
      setIsPrinting(true);
      
      const bluetoothReady = await ensureBluetoothReady();
      if (!bluetoothReady) {
        console.log('Bluetooth is not ready');
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
        setIsPrinting(false);
        return;
      }
      
      console.log('Bluetooth is ready, showing printer selection modal');
      // Show printer selection modal
      setShowPrinterModal(true);
    } catch (error) {
      console.error('Error preparing for Bluetooth printing:', error);
      Alert.alert(
        "Bluetooth Error",
        "There was an error accessing Bluetooth. Please make sure Bluetooth is enabled and try again."
      );
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handlePrinterSelected = async (printer: PrinterDevice) => {
    setShowPrinterModal(false);
    
    // Print the bill with the selected printer
    setIsPrinting(true);
    
    try {
      console.log(`Printing bill to ${printer.name}...`);
      const success = await printBillToPrinter(bill, printer);
      
      if (success) {
        console.log('Bill printed successfully');
        Alert.alert("Success", "Bill sent to printer successfully");
      } else {
        console.log('Failed to print bill');
        Alert.alert("Error", "Failed to print bill. Please check printer connection.");
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      Alert.alert("Error", "Failed to print bill. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: `Bill #${bill.id.substring(0, 8)}`,
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
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={Platform.OS === 'web' ? handlePrintShare : handlePrintToBluetooth}
              >
                {Platform.OS === 'web' ? (
                  <Printer size={24} color={colors.primary} />
                ) : (
                  <Bluetooth size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Trash2 size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Business Info Card */}
        <Card style={styles.businessCard}>
          <Text style={styles.businessName}>{businessInfo.name}</Text>
          <Text style={styles.businessAddress}>{businessInfo.address}</Text>
          {businessInfo.phone && (
            <Text style={styles.businessContact}>Phone: {businessInfo.phone}</Text>
          )}
          {businessInfo.email && (
            <Text style={styles.businessContact}>Email: {businessInfo.email}</Text>
          )}
          {businessInfo.taxId && (
            <Text style={styles.businessContact}>Tax ID: {businessInfo.taxId}</Text>
          )}
        </Card>
        
        {/* Bill Info Card */}
        <Card style={styles.billInfoCard}>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Calendar size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formattedDate}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <CreditCard size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>
                  {formatPaymentMethod(bill.paymentMethod)}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{bill.customerName}</Text>
              </View>
            </View>
            
            {bill.customerPhone && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Phone size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{bill.customerPhone}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>
        
        {/* Items Card */}
        <Card style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemHeaderText, styles.itemNameHeader]}>Item</Text>
            <Text style={[styles.itemHeaderText, styles.itemQuantityHeader]}>Qty</Text>
            <Text style={[styles.itemHeaderText, styles.itemPriceHeader]}>Price</Text>
            <Text style={[styles.itemHeaderText, styles.itemTotalHeader]}>Total</Text>
          </View>
          
          {bill.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
              <Text style={styles.itemQuantity}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
              <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{bill.subtotal.toFixed(2)}</Text>
            </View>
            
            {bill.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.discountValue}>-₹{bill.discount.toFixed(2)}</Text>
              </View>
            )}
            
            {bill.tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>₹{bill.tax.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{bill.total.toFixed(2)}</Text>
            </View>
          </View>
        </Card>
        
        {/* Notes Card */}
        {bill.notes && (
          <Card style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{bill.notes}</Text>
          </Card>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={isPrinting ? "Connecting to Printer..." : "Print to Bluetooth"}
            onPress={handlePrintToBluetooth}
            icon={isPrinting ? null : <Bluetooth size={18} color={colors.white} />}
            style={styles.bluetoothButton}
            disabled={isPrinting || Platform.OS === 'web'}
          >
            {isPrinting && (
              <ActivityIndicator size="small" color={colors.white} style={styles.printingIndicator} />
            )}
          </Button>
          
          <Button
            title="Share Bill"
            onPress={handlePrintShare}
            icon={<Share2 size={18} color={colors.white} />}
            style={styles.printButton}
          />
          
          <Button
            title="Delete Bill"
            onPress={handleDelete}
            variant="danger"
            icon={<Trash2 size={18} color={colors.white} />}
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
      
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 32 : 16,
  },
  businessCard: {
    marginBottom: 16,
    padding: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  businessContact: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  billInfoCard: {
    marginBottom: 16,
    padding: 16,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  itemsCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  itemHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  itemNameHeader: {
    flex: 3,
  },
  itemQuantityHeader: {
    flex: 1,
    textAlign: 'center',
  },
  itemPriceHeader: {
    flex: 2,
    textAlign: 'right',
  },
  itemTotalHeader: {
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  itemName: {
    flex: 3,
    fontSize: 16,
    color: colors.text,
  },
  itemQuantity: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 2,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  itemTotal: {
    flex: 2,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  summaryContainer: {
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  notesCard: {
    marginBottom: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    color: colors.text,
  },
  actionsContainer: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  bluetoothButton: {
    marginBottom: 12,
  },
  printButton: {
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 16,
  },
  printingIndicator: {
    marginRight: 8,
  },
});