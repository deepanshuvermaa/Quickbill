import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { 
  Bluetooth, 
  RefreshCw, 
  Check, 
  ArrowLeft,
  Smartphone
} from 'lucide-react-native';
import BluetoothService from '@/utils/bluetooth';
import { Device } from 'react-native-ble-plx';
import { useCartStore } from '@/store/cartStore';

interface BluetoothDeviceItem {
  id: string;
  name: string;
  rssi: number | null;
  isConnected: boolean;
}

export default function PrinterSettingsScreen() {
  const router = useRouter();
  const { autoShowCart, setAutoShowCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDeviceItem[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    return () => {
      BluetoothService.stopDeviceScan();
    };
  }, []);
  
  const startScan = async () => {
    setScanning(true);
    setError(null);
    setDevices([]);
    
    try {
      await BluetoothService.startDeviceScan(
        (device: Device) => {
          if (device.name) {
            setDevices(prev => {
              const existing = prev.find(d => d.id === device.id);
              if (!existing) {
                return [...prev, {
                  id: device.id,
                  name: device.name || 'Unknown Device',
                  rssi: device.rssi,
                  isConnected: false
                }];
              }
              return prev;
            });
          }
        },
        (error) => {
          console.error('Scan error:', error);
          setError(error.message);
          setScanning(false);
        }
      );
      
      // Stop scanning after 10 seconds
      setTimeout(() => {
        BluetoothService.stopDeviceScan();
        setScanning(false);
      }, 10000);
    } catch (err) {
      setError('Failed to start scanning');
      setScanning(false);
    }
  };
  
  const handleConnectDevice = async (device: BluetoothDeviceItem) => {
    setLoading(true);
    setError(null);
    
    try {
      await BluetoothService.connectToDevice(device.id);
      setConnectedDevice(device.id);
      setDevices(prev => prev.map(d => 
        d.id === device.id ? { ...d, isConnected: true } : { ...d, isConnected: false }
      ));
      Alert.alert('Success', `Connected to ${device.name}`);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Connection Failed', err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDisconnectDevice = async (device: BluetoothDeviceItem) => {
    setLoading(true);
    setError(null);
    
    try {
      await BluetoothService.disconnectFromDevice(device.id);
      setConnectedDevice(null);
      setDevices(prev => prev.map(d => 
        d.id === device.id ? { ...d, isConnected: false } : d
      ));
      Alert.alert('Success', `Disconnected from ${device.name}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const renderDeviceItem = ({ item }: { item: BluetoothDeviceItem }) => {
    const isConnected = item.id === connectedDevice;
    
    return (
      <Card style={[styles.deviceCard, ...(isConnected ? [styles.connectedDeviceCard] : [])]}>
        <View style={styles.deviceInfo}>
          <Smartphone size={24} color={isConnected ? colors.primary : colors.text} />
          <View style={styles.deviceDetails}>
            <Text style={[styles.deviceName, isConnected && styles.connectedText]}>
              {item.name}
            </Text>
            {item.rssi && (
              <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
            )}
          </View>
        </View>
        
        <View style={styles.deviceActions}>
          {isConnected ? (
            <>
              <View style={styles.connectedBadge}>
                <Check size={12} color={colors.white} />
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>
              <Button
                title="Disconnect"
                onPress={() => handleDisconnectDevice(item)}
                variant="outline"
                size="small"
                style={styles.actionButton}
                disabled={loading}
              />
            </>
          ) : (
            <Button
              title="Connect"
              onPress={() => handleConnectDevice(item)}
              variant="primary"
              size="small"
              style={styles.actionButton}
              disabled={loading || !!connectedDevice}
            />
          )}
        </View>
      </Card>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Bluetooth Settings',
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
      
      {/* App Settings */}
      <Card style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>App Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto-show cart when adding items</Text>
          <Switch
            value={autoShowCart}
            onValueChange={setAutoShowCart}
            trackColor={{ false: colors.grayLight, true: `${colors.primary}80` }}
            thumbColor={autoShowCart ? colors.primary : colors.gray}
          />
        </View>
      </Card>
      
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Devices</Text>
        <Button
          title={scanning ? "Scanning..." : "Scan"}
          onPress={startScan}
          icon={<RefreshCw size={18} color={colors.white} />}
          disabled={scanning}
          size="small"
        />
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {scanning ? (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
          <Text style={styles.scanningHint}>This will take up to 10 seconds</Text>
        </View>
      ) : devices.length === 0 ? (
        <EmptyState
          title="No devices found"
          message="Tap 'Scan' to search for Bluetooth devices"
          icon={<Bluetooth size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.devicesList}
        />
      )}
      
      {Platform.OS === 'web' && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            Note: Bluetooth functionality is limited in web browsers. 
            For full Bluetooth support, please use the mobile app.
          </Text>
        </Card>
      )}
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
  settingsCard: {
    margin: 16,
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  errorContainer: {
    backgroundColor: `${colors.danger}20`,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
  },
  scanningContainer: {
    padding: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  scanningHint: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray,
  },
  devicesList: {
    padding: 16,
  },
  deviceCard: {
    marginBottom: 12,
    padding: 12,
  },
  connectedDeviceCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  connectedText: {
    color: colors.primary,
    fontWeight: '600',
  },
  deviceRssi: {
    fontSize: 13,
    color: colors.textLight,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  connectedBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButton: {
    minWidth: 90,
  },
  infoCard: {
    margin: 16,
    marginTop: 'auto',
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
  },
});