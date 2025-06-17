import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Platform,
  Switch,
  Alert
} from 'react-native';
import { colors } from '@/constants/colors';
import { Button } from './Button';
import { 
  Printer, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Search,
  Zap
} from 'lucide-react-native';
import { 
  PrinterDevice, 
  scanForPrinters, 
  scanForAllBluetoothDevices,
  connectToPrinter,
  ensureBluetoothReady,
  pairWithDevice
} from '@/utils/bluetooth-print';

interface PrinterSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onPrinterSelected: (printer: PrinterDevice) => void;
}

export const PrinterSelectionModal = ({ 
  visible, 
  onClose, 
  onPrinterSelected
}: PrinterSelectionModalProps) => {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [allDevices, setAllDevices] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPairing, setIsPairing] = useState<string | null>(null);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (visible) {
      console.log('PrinterSelectionModal opened, starting scan');
      scanForAvailablePrinters();
    } else {
      // Reset state when modal is closed
      setSelectedPrinter(null);
      setError(null);
    }
  }, [visible]);
  
  useEffect(() => {
    if (visible && showAllDevices) {
      scanForAllDevices();
    } else if (visible) {
      scanForAvailablePrinters();
    }
  }, [showAllDevices, visible]);
  
  const scanForAvailablePrinters = async () => {
    if (Platform.OS === 'web') {
      setError("Bluetooth printing is not available on web browsers.");
      return;
    }
    
    setIsScanning(true);
    setError(null);
    
    try {
      console.log('Scanning for available printers...');
      // Ensure Bluetooth is ready
      const bluetoothReady = await ensureBluetoothReady();
      if (!bluetoothReady) {
        console.log('Bluetooth is not ready');
        setError("Bluetooth is not available or permissions were denied.");
        setIsScanning(false);
        return;
      }
      
      // Scan for printers
      console.log('Starting printer scan...');
      const availablePrinters = await scanForPrinters();
      console.log(`Found ${availablePrinters.length} printers`);
      setPrinters(availablePrinters);
      
      if (availablePrinters.length === 0) {
        setError("No printers found. Make sure your printer is turned on and in discovery mode.");
      }
    } catch (error) {
      console.error('Error scanning for printers:', error);
      setError("Failed to scan for printers. Please try again.");
      
      // For testing, generate some simulated printers
      const simulatedPrinters: PrinterDevice[] = [
        {
          id: 'sim1',
          name: 'Thermal Printer (Simulated)',
          address: '00:11:22:33:44:55',
          paired: false,
          connected: false,
          type: 'thermal',
          paperWidth: '58mm'
        },
        {
          id: 'sim2',
          name: 'Epson TM-T88VI (Simulated)',
          address: '11:22:33:44:55:66',
          paired: true,
          connected: false,
          type: 'pos',
          paperWidth: '80mm'
        }
      ];
      
      console.log('Setting simulated printers for testing');
      setPrinters(simulatedPrinters);
    } finally {
      setIsScanning(false);
    }
  };
  
  const scanForAllDevices = async () => {
    if (Platform.OS === 'web') {
      setError("Bluetooth is not available on web browsers.");
      return;
    }
    
    setIsScanning(true);
    setError(null);
    
    try {
      console.log('Scanning for all Bluetooth devices...');
      // Ensure Bluetooth is ready
      const bluetoothReady = await ensureBluetoothReady();
      if (!bluetoothReady) {
        console.log('Bluetooth is not ready');
        setError("Bluetooth is not available or permissions were denied.");
        setIsScanning(false);
        return;
      }
      
      // Scan for all devices
      console.log('Starting device scan...');
      const devices = await scanForAllBluetoothDevices();
      console.log(`Found ${devices.length} devices`);
      setAllDevices(devices);
      
      if (devices.length === 0) {
        setError("No Bluetooth devices found. Make sure Bluetooth is enabled on your device.");
      }
    } catch (error) {
      console.error('Error scanning for all devices:', error);
      setError("Failed to scan for Bluetooth devices. Please try again.");
      
      // For testing, generate some simulated devices
      const simulatedDevices: PrinterDevice[] = [
        {
          id: 'sim1',
          name: 'Thermal Printer (Simulated)',
          address: '00:11:22:33:44:55',
          paired: false,
          connected: false,
          type: 'thermal',
          paperWidth: '58mm'
        },
        {
          id: 'sim2',
          name: 'Epson TM-T88VI (Simulated)',
          address: '11:22:33:44:55:66',
          paired: true,
          connected: false,
          type: 'pos',
          paperWidth: '80mm'
        },
        {
          id: 'sim3',
          name: 'Bluetooth Speaker (Simulated)',
          address: '22:33:44:55:66:77',
          paired: false,
          connected: false
        }
      ];
      
      console.log('Setting simulated devices for testing');
      setAllDevices(simulatedDevices);
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleRefresh = () => {
    if (showAllDevices) {
      scanForAllDevices();
    } else {
      scanForAvailablePrinters();
    }
  };
  
  const handleDeviceSelect = (device: PrinterDevice) => {
    console.log(`Selected device: ${device.name}`);
    setSelectedPrinter(device);
    setError(null);
  };
  
  const handlePairDevice = async (device: PrinterDevice) => {
    if (device.paired) {
      // Already paired, just select it
      setSelectedPrinter(device);
      return;
    }
    
    setIsPairing(device.id);
    setError(null);
    
    try {
      console.log(`Pairing with device: ${device.name}`);
      const paired = await pairWithDevice(device);
      
      if (paired) {
        console.log(`Successfully paired with ${device.name}`);
        // Update the device in our list
        if (showAllDevices) {
          const updatedDevices = allDevices.map(d => 
            d.id === device.id ? { ...d, paired: true } : d
          );
          setAllDevices(updatedDevices);
        } else {
          const updatedPrinters = printers.map(d => 
            d.id === device.id ? { ...d, paired: true } : d
          );
          setPrinters(updatedPrinters);
        }
        
        // Select the newly paired device
        setSelectedPrinter({ ...device, paired: true });
        
        // Show success message
        Alert.alert("Pairing Successful", `Successfully paired with ${device.name}.`);
      } else {
        // Pairing failed
        console.log(`Failed to pair with ${device.name}`);
        setError(`Failed to pair with ${device.name}. Please try again.`);
      }
    } catch (error) {
      console.error('Error pairing with device:', error);
      setError("An error occurred while pairing. Please try again.");
    } finally {
      setIsPairing(null);
    }
  };
  
  const handleConnect = async () => {
    if (!selectedPrinter) {
      setError("Please select a printer first.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log(`Connecting to selected printer: ${selectedPrinter.name}`);
      
      // If not paired, try to pair first
      if (!selectedPrinter.paired) {
        console.log(`Printer ${selectedPrinter.name} is not paired, attempting to pair first`);
        const paired = await pairWithDevice(selectedPrinter);
        if (!paired) {
          console.log(`Failed to pair with ${selectedPrinter.name}`);
          setError(`Failed to pair with ${selectedPrinter.name}. Please try again.`);
          setIsConnecting(false);
          return;
        }
        
        console.log(`Successfully paired with ${selectedPrinter.name}`);
        // Update the selected printer to reflect paired status
        setSelectedPrinter({ ...selectedPrinter, paired: true });
      }
      
      console.log(`Connecting to ${selectedPrinter.name}...`);
      const connected = await connectToPrinter(selectedPrinter);
      
      if (connected) {
        console.log(`Successfully connected to ${selectedPrinter.name}`);
        // Call the callback with the connected printer
        onPrinterSelected({
          ...selectedPrinter,
          paired: true,
          connected: true
        });
      } else {
        // Handle connection failure
        console.log(`Failed to connect to ${selectedPrinter.name}`);
        setError(`Failed to connect to ${selectedPrinter.name}. Please try again.`);
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      setError("An error occurred while connecting to the printer. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };
  
  const renderDeviceItem = ({ item }: { item: PrinterDevice }) => {
    const isSelected = selectedPrinter?.id === item.id;
    const isPrinter = item.type !== undefined;
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isSelected && styles.selectedDeviceItem
        ]}
        onPress={() => handleDeviceSelect(item)}
      >
        <View style={styles.deviceIconContainer}>
          {isPrinter ? (
            <Printer 
              size={24} 
              color={isSelected ? colors.white : colors.primary} 
            />
          ) : (
            <Printer 
              size={24} 
              color={isSelected ? colors.white : colors.gray} 
            />
          )}
        </View>
        
        <View style={styles.deviceInfo}>
          <Text 
            style={[
              styles.deviceName,
              isSelected && styles.selectedDeviceText
            ]}
          >
            {item.name}
          </Text>
          
          <Text 
            style={[
              styles.deviceAddress,
              isSelected && styles.selectedDeviceText
            ]}
          >
            {item.address}
          </Text>
          
          <View style={styles.deviceBadges}>
            {item.paperWidth && (
              <View style={[
                styles.paperWidthBadge,
                isSelected && styles.selectedPaperWidthBadge
              ]}>
                <Text style={[
                  styles.paperWidthText,
                  isSelected && styles.selectedBadgeText
                ]}>
                  {item.paperWidth}
                </Text>
              </View>
            )}
            
            {item.type && (
              <View style={[
                styles.typeBadge,
                isSelected && styles.selectedTypeBadge
              ]}>
                <Text style={[
                  styles.typeText,
                  isSelected && styles.selectedBadgeText
                ]}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            )}
            
            {item.paired ? (
              <View style={[
                styles.pairedBadge,
                isSelected && styles.selectedPairedBadge
              ]}>
                <Check size={10} color={isSelected ? colors.white : colors.success} />
                <Text style={[
                  styles.pairedText,
                  isSelected && styles.selectedBadgeText
                ]}>
                  Paired
                </Text>
              </View>
            ) : isPairing === item.id ? (
              <View style={styles.pairingBadge}>
                <ActivityIndicator size="small" color={colors.white} style={styles.pairingIndicator} />
                <Text style={styles.pairingText}>
                  Pairing...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pairButton}
                onPress={() => handlePairDevice(item)}
              >
                <Zap size={10} color={colors.white} />
                <Text style={styles.pairButtonText}>
                  Pair
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.checkIconContainer}>
            <Check size={20} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  // Determine which devices to display
  const displayedDevices = showAllDevices ? allDevices : printers;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Printer</Text>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsContainer}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Show all devices</Text>
              <Switch
                value={showAllDevices}
                onValueChange={setShowAllDevices}
                trackColor={{ false: colors.grayLight, true: `${colors.primary}80` }}
                thumbColor={showAllDevices ? colors.primary : colors.gray}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={20} color={colors.primary} />
              )}
              <Text style={styles.refreshText}>
                {isScanning ? 'Scanning...' : 'Scan'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {isScanning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
              <Text style={styles.loadingText}>
                Scanning for {showAllDevices ? 'Bluetooth devices' : 'printers'}...
              </Text>
              <Text style={styles.loadingSubtext}>
                Make sure your {showAllDevices ? 'devices are' : 'printer is'} turned on and discoverable
              </Text>
            </View>
          ) : displayedDevices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Search size={48} color={colors.gray} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                No {showAllDevices ? 'devices' : 'printers'} found
              </Text>
              <Text style={styles.emptySubtext}>
                Make sure your {showAllDevices ? 'Bluetooth devices are' : 'printer is'} turned on and discoverable
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayedDevices}
              keyExtractor={(item) => item.id}
              renderItem={renderDeviceItem}
              contentContainerStyle={styles.devicesList}
            />
          )}
          
          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.cancelButton}
            />
            
            <Button
              title={isConnecting ? "Connecting..." : "Connect & Print"}
              onPress={handleConnect}
              disabled={!selectedPrinter || isConnecting}
              style={styles.connectButton}
              icon={isConnecting ? null : <Printer size={18} color={colors.white} />}
            >
              {isConnecting && (
                <ActivityIndicator size="small" color={colors.white} style={styles.connectingIndicator} />
              )}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginRight: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 8,
  },
  refreshText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.danger}20`,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.danger,
  },
  devicesList: {
    padding: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedDeviceItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  selectedDeviceText: {
    color: colors.white,
  },
  deviceBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  paperWidthBadge: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  selectedPaperWidthBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paperWidthText: {
    fontSize: 12,
    color: colors.textLight,
  },
  typeBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  selectedTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  typeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  pairedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  selectedPairedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pairedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
    marginLeft: 2,
  },
  selectedBadgeText: {
    color: colors.white,
  },
  pairingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  pairingIndicator: {
    marginRight: 4,
  },
  pairingText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  pairButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
    marginLeft: 2,
  },
  checkIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  connectButton: {
    flex: 2,
  },
  connectingIndicator: {
    marginRight: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});