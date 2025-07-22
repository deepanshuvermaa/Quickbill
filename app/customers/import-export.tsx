import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useCustomerStore } from '@/store/customerStore';
import { 
  Download, 
  Upload, 
  FileText, 
  Table, 
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

export default function ImportExportScreen() {
  const router = useRouter();
  const { customers, exportBackup, importBackup } = useCustomerStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  // Generate CSV content from customers
  const generateCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Notes', 'Total Purchases', 'Total Transactions', 'Last Purchase Date', 'Created At'];
    
    let csvContent = headers.join(',') + '\n';
    
    customers.forEach(customer => {
      const row = [
        customer.id,
        `"${(customer.name || '').replace(/"/g, '""')}"`,
        customer.phone || '',
        customer.email || '',
        `"${(customer.address || '').replace(/"/g, '""')}"`,
        `"${(customer.notes || '').replace(/"/g, '""')}"`,
        customer.stats?.totalPurchases || 0,
        customer.stats?.totalTransactions || 0,
        customer.stats?.lastPurchaseDate ? new Date(customer.stats.lastPurchaseDate).toLocaleDateString() : '',
        new Date(customer.createdAt).toLocaleDateString(),
      ];
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  };

  // Generate JSON content
  const generateJSON = () => {
    return JSON.stringify(customers, null, 2);
  };

  // Generate PDF content (simplified text format for now)
  const generatePDF = () => {
    let content = 'CUSTOMER LIST REPORT\n';
    content += '='.repeat(50) + '\n\n';
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `Total Customers: ${customers.length}\n\n`;
    content += '='.repeat(50) + '\n\n';
    
    customers.forEach((customer, index) => {
      content += `${index + 1}. ${customer.name}\n`;
      content += `   Phone: ${customer.phone || 'N/A'}\n`;
      content += `   Email: ${customer.email || 'N/A'}\n`;
      if (customer.address) {
        content += `   Address: ${customer.address}\n`;
      }
      if (customer.stats) {
        content += `   Total Purchases: ₹${customer.stats.totalPurchases.toFixed(2)}\n`;
        content += `   Transactions: ${customer.stats.totalTransactions}\n`;
      }
      content += '\n';
    });
    
    return content;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let content = '';
      let filename = '';
      let mimeType = '';
      
      switch (exportFormat) {
        case 'csv':
          content = generateCSV();
          filename = `customers_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = generateJSON();
          filename = `customers_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          content = generatePDF();
          filename = `customers_${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
          break;
      }
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', `Customers exported successfully as ${exportFormat.toUpperCase()}`);
      } else {
        // For mobile, save to file and share
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType,
            dialogTitle: 'Export Customers',
          });
        } else {
          Alert.alert('Success', `File saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export customers. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        const content = await FileSystem.readAsStringAsync(result.uri);
        
        // Parse based on file type
        if (result.name.endsWith('.json')) {
          const importedCustomers = JSON.parse(content);
          const importResult = importBackup({ 
            customers: importedCustomers, 
            version: '1.0',
            exportedAt: new Date().toISOString(),
          }, 'merge');
          
          Alert.alert(
            'Import Complete',
            `Successfully imported ${importResult.success} customers.\n${importResult.failed} failed.`
          );
        } else if (result.name.endsWith('.csv')) {
          Alert.alert('Info', 'CSV import is under development. Please use JSON format for now.');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import customers. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Import/Export Customers',
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
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Export Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Export Customers</Text>
          </View>
          
          <Text style={styles.description}>
            Export your customer list in various formats for backup or analysis.
          </Text>
          
          <Text style={styles.label}>Choose Format:</Text>
          
          <View style={styles.formatOptions}>
            <TouchableOpacity
              style={[styles.formatOption, exportFormat === 'csv' && styles.formatOptionActive]}
              onPress={() => setExportFormat('csv')}
            >
              <Table size={20} color={exportFormat === 'csv' ? colors.white : colors.primary} />
              <Text style={[styles.formatText, exportFormat === 'csv' && styles.formatTextActive]}>
                CSV
              </Text>
              <Text style={[styles.formatSubtext, exportFormat === 'csv' && styles.formatTextActive]}>
                Excel Compatible
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.formatOption, exportFormat === 'json' && styles.formatOptionActive]}
              onPress={() => setExportFormat('json')}
            >
              <FileText size={20} color={exportFormat === 'json' ? colors.white : colors.primary} />
              <Text style={[styles.formatText, exportFormat === 'json' && styles.formatTextActive]}>
                JSON
              </Text>
              <Text style={[styles.formatSubtext, exportFormat === 'json' && styles.formatTextActive]}>
                Full Backup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.formatOption, exportFormat === 'pdf' && styles.formatOptionActive]}
              onPress={() => setExportFormat('pdf')}
            >
              <FileSpreadsheet size={20} color={exportFormat === 'pdf' ? colors.white : colors.primary} />
              <Text style={[styles.formatText, exportFormat === 'pdf' && styles.formatTextActive]}>
                PDF
              </Text>
              <Text style={[styles.formatSubtext, exportFormat === 'pdf' && styles.formatTextActive]}>
                Print Ready
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.stats}>
            <Text style={styles.statText}>
              <Text style={styles.statNumber}>{customers.length}</Text> customers will be exported
            </Text>
          </View>
          
          <Button
            title={isExporting ? "Exporting..." : "Export Customers"}
            onPress={handleExport}
            disabled={isExporting || customers.length === 0}
            style={styles.button}
          >
            {isExporting && <ActivityIndicator size="small" color={colors.white} />}
          </Button>
        </Card>
        
        {/* Import Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Upload size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Import Customers</Text>
          </View>
          
          <Text style={styles.description}>
            Import customers from a JSON backup file. CSV import coming soon.
          </Text>
          
          <View style={styles.importInfo}>
            <View style={styles.infoItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.infoText}>JSON format supported</Text>
            </View>
            <View style={styles.infoItem}>
              <AlertCircle size={16} color={colors.warning} />
              <Text style={styles.infoText}>Duplicate customers will be merged</Text>
            </View>
          </View>
          
          <Button
            title={isImporting ? "Importing..." : "Select File to Import"}
            onPress={handleImport}
            disabled={isImporting}
            variant="outline"
            style={styles.button}
          >
            {isImporting && <ActivityIndicator size="small" color={colors.primary} />}
          </Button>
        </Card>
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  formatOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  formatOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  formatOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formatText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  formatTextActive: {
    color: colors.white,
  },
  formatSubtext: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  stats: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  statNumber: {
    fontWeight: '600',
    color: colors.primary,
  },
  button: {
    marginTop: 8,
  },
  importInfo: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 8,
  },
});