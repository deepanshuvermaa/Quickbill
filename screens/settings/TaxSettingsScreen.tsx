import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from '@/utils/navigation';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/settingsStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { calculateTax, TaxSettings, GstType } from '@/utils/tax-calculator';
import {
  Percent,
  ChevronLeft,
  Info,
  Calculator,
  FileText
} from 'lucide-react-native';

export default function TaxSettingsScreen() {
  const navigation = useNavigation();
  const { 
    defaultTaxRate, 
    setDefaultTaxRate, 
    taxSettings: storeTaxSettings, 
    updateTaxSettings 
  } = useSettingsStore();
  
  // Initialize tax settings from store
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(storeTaxSettings);
  
  const [previewAmount, setPreviewAmount] = useState('1000');
  
  const handleSave = () => {
    // Save tax settings to store
    updateTaxSettings(taxSettings);
    
    // Also update the default tax rate for backward compatibility
    if (taxSettings.mode === 'no_tax') {
      setDefaultTaxRate(0);
    } else if (taxSettings.mode === 'single_tax') {
      setDefaultTaxRate(taxSettings.singleTaxRate);
    } else if (taxSettings.mode === 'gst') {
      // For GST, store the total rate (CGST + SGST or IGST)
      setDefaultTaxRate(taxSettings.cgstRate + taxSettings.sgstRate);
    }
    
    Alert.alert("Success", "Tax settings saved successfully");
    navigation.goBack();
  };
  
  const preview = calculateTax(parseFloat(previewAmount) || 0, taxSettings);
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tax Settings',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Mode</Text>
          <Text style={styles.helperText}>
            Choose how tax is calculated on your bills
          </Text>
          
          <TouchableOpacity
            style={[
              styles.taxModeOption,
              taxSettings.mode === 'no_tax' && styles.taxModeOptionActive
            ]}
            onPress={() => setTaxSettings({ ...taxSettings, mode: 'no_tax' })}
          >
            <View style={styles.taxModeContent}>
              <Text style={[
                styles.taxModeTitle,
                taxSettings.mode === 'no_tax' && styles.taxModeTitleActive
              ]}>
                No Tax
              </Text>
              <Text style={styles.taxModeDescription}>
                Bills will not include any tax calculations
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              taxSettings.mode === 'no_tax' && styles.radioButtonActive
            ]} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.taxModeOption,
              taxSettings.mode === 'single_tax' && styles.taxModeOptionActive
            ]}
            onPress={() => setTaxSettings({ ...taxSettings, mode: 'single_tax' })}
          >
            <View style={styles.taxModeContent}>
              <Text style={[
                styles.taxModeTitle,
                taxSettings.mode === 'single_tax' && styles.taxModeTitleActive
              ]}>
                Single Tax
              </Text>
              <Text style={styles.taxModeDescription}>
                Apply a single tax rate (e.g., VAT, Sales Tax)
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              taxSettings.mode === 'single_tax' && styles.radioButtonActive
            ]} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.taxModeOption,
              taxSettings.mode === 'gst' && styles.taxModeOptionActive
            ]}
            onPress={() => setTaxSettings({ ...taxSettings, mode: 'gst' })}
          >
            <View style={styles.taxModeContent}>
              <Text style={[
                styles.taxModeTitle,
                taxSettings.mode === 'gst' && styles.taxModeTitleActive
              ]}>
                GST (India)
              </Text>
              <Text style={styles.taxModeDescription}>
                CGST + SGST for intra-state or IGST for inter-state
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              taxSettings.mode === 'gst' && styles.radioButtonActive
            ]} />
          </TouchableOpacity>
        </Card>
        
        {taxSettings.mode !== 'no_tax' && (
          <>
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Tax Rates</Text>
              
              {taxSettings.mode === 'single_tax' && (
                <View style={styles.inputContainer}>
                  <Percent size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Tax Rate (%)"
                    value={taxSettings.singleTaxRate.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setTaxSettings({
                        ...taxSettings,
                        singleTaxRate: Math.min(100, Math.max(0, value))
                      });
                    }}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.gray}
                  />
                </View>
              )}
              
              {taxSettings.mode === 'gst' && (
                <>
                  <View style={styles.gstRateContainer}>
                    <View style={[styles.inputContainer, styles.gstInput]}>
                      <Text style={styles.gstLabel}>CGST</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="9"
                        value={taxSettings.cgstRate.toString()}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setTaxSettings({
                            ...taxSettings,
                            cgstRate: Math.min(50, Math.max(0, value))
                          });
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.gray}
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                    </View>
                    
                    <Text style={styles.plusSymbol}>+</Text>
                    
                    <View style={[styles.inputContainer, styles.gstInput]}>
                      <Text style={styles.gstLabel}>SGST</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="9"
                        value={taxSettings.sgstRate.toString()}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setTaxSettings({
                            ...taxSettings,
                            sgstRate: Math.min(50, Math.max(0, value))
                          });
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.gray}
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                    </View>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.gstLabel}>IGST</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="18"
                      value={taxSettings.igstRate.toString()}
                      onChangeText={(text) => {
                        const value = parseFloat(text) || 0;
                        setTaxSettings({
                          ...taxSettings,
                          igstRate: Math.min(100, Math.max(0, value))
                        });
                      }}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.gray}
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                  
                  <View style={styles.gstTypeContainer}>
                    <Text style={styles.gstTypeLabel}>Transaction Type</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.gstTypeOption,
                        taxSettings.gstType === 'intrastate' && styles.gstTypeOptionActive
                      ]}
                      onPress={() => setTaxSettings({ ...taxSettings, gstType: 'intrastate' })}
                    >
                      <Text style={[
                        styles.gstTypeOptionText,
                        taxSettings.gstType === 'intrastate' && styles.gstTypeOptionTextActive
                      ]}>
                        Intra-state (CGST + SGST)
                      </Text>
                      <View style={[
                        styles.radioButton,
                        taxSettings.gstType === 'intrastate' && styles.radioButtonActive
                      ]} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.gstTypeOption,
                        taxSettings.gstType === 'interstate' && styles.gstTypeOptionActive
                      ]}
                      onPress={() => setTaxSettings({ ...taxSettings, gstType: 'interstate' })}
                    >
                      <Text style={[
                        styles.gstTypeOptionText,
                        taxSettings.gstType === 'interstate' && styles.gstTypeOptionTextActive
                      ]}>
                        Inter-state (IGST)
                      </Text>
                      <View style={[
                        styles.radioButton,
                        taxSettings.gstType === 'interstate' && styles.radioButtonActive
                      ]} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.infoBox}>
                    <Info size={16} color={colors.primary} />
                    <Text style={styles.infoText}>
                      CGST + SGST is applied for intra-state transactions.
                      IGST is applied for inter-state transactions.
                    </Text>
                  </View>
                </>
              )}
            </Card>
            
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Tax Calculation Type</Text>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Tax Inclusive Pricing</Text>
                  <Text style={styles.switchDescription}>
                    {taxSettings.calculationType === 'inclusive' 
                      ? 'Tax is included in the item price'
                      : 'Tax is added on top of the item price'}
                  </Text>
                </View>
                <Switch
                  value={taxSettings.calculationType === 'inclusive'}
                  onValueChange={(value) => 
                    setTaxSettings({
                      ...taxSettings,
                      calculationType: value ? 'inclusive' : 'exclusive'
                    })
                  }
                  trackColor={{ false: colors.grayLight, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </Card>
            
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <Text style={styles.helperText}>
                See how tax will appear on bills
              </Text>
              
              <View style={styles.previewInputContainer}>
                <Text style={styles.previewLabel}>Test Amount:</Text>
                <TextInput
                  style={styles.previewInput}
                  value={previewAmount}
                  onChangeText={setPreviewAmount}
                  keyboardType="numeric"
                  placeholder="1000"
                  placeholderTextColor={colors.gray}
                />
              </View>
              
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewRowLabel}>Subtotal</Text>
                  <Text style={styles.previewRowValue}>
                    ₹{preview.subtotal.toFixed(2)}
                  </Text>
                </View>
                
                {taxSettings.mode === 'single_tax' && preview.breakdown && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewRowLabel}>
                      Tax ({taxSettings.singleTaxRate}%)
                    </Text>
                    <Text style={styles.previewRowValue}>
                      ₹{preview.breakdown.tax.toFixed(2)}
                    </Text>
                  </View>
                )}
                
                {taxSettings.mode === 'gst' && preview.breakdown && (
                  <>
                    {taxSettings.gstType === 'intrastate' ? (
                      <>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewRowLabel}>
                            CGST ({taxSettings.cgstRate}%)
                          </Text>
                          <Text style={styles.previewRowValue}>
                            ₹{(preview.breakdown.cgst || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewRowLabel}>
                            SGST ({taxSettings.sgstRate}%)
                          </Text>
                          <Text style={styles.previewRowValue}>
                            ₹{(preview.breakdown.sgst || 0).toFixed(2)}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewRowLabel}>
                          IGST ({taxSettings.igstRate}%)
                        </Text>
                        <Text style={styles.previewRowValue}>
                          ₹{(preview.breakdown.igst || 0).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </>
                )}
                
                <View style={[styles.previewRow, styles.previewTotal]}>
                  <Text style={styles.previewTotalLabel}>Total</Text>
                  <Text style={styles.previewTotalValue}>
                    ₹{preview.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}
        
        <Button
          title="Save Tax Settings"
          onPress={handleSave}
          style={styles.saveButton}
          fullWidth
        />
      </ScrollView>
    </View>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  taxModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  taxModeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  taxModeContent: {
    flex: 1,
  },
  taxModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taxModeTitleActive: {
    color: colors.primary,
  },
  taxModeDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginLeft: 12,
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  gstRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gstInput: {
    flex: 1,
    marginBottom: 0,
  },
  gstLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
  },
  percentSymbol: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 4,
  },
  plusSymbol: {
    fontSize: 18,
    color: colors.textLight,
    marginHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    marginLeft: 8,
    lineHeight: 18,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  previewInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 16,
    color: colors.text,
    marginRight: 12,
  },
  previewInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  previewBox: {
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    padding: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewRowLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  previewRowValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  previewTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  previewTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  previewTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  saveButton: {
    marginTop: 8,
  },
  gstTypeContainer: {
    marginBottom: 16,
  },
  gstTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  gstTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  gstTypeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  gstTypeOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  gstTypeOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
});