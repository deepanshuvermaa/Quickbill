import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/settingsStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  ArrowLeft,
  Save,
  Hash,
  Percent,
  Info,
} from 'lucide-react-native';

interface TaxConfig {
  gstNumber: string;
  cgst: number;
  sgst: number;
  igst: number;
  isDefault: boolean;
  includeGSTNumber: boolean;
}

export default function TaxSettingsScreen() {
  const router = useRouter();
  const { taxConfig, updateTaxConfig } = useSettingsStore();
  
  const [formData, setFormData] = useState<TaxConfig>({
    gstNumber: '',
    cgst: 9,
    sgst: 9,
    igst: 18,
    isDefault: true,
    includeGSTNumber: true,
    ...taxConfig
  });

  useEffect(() => {
    if (taxConfig) {
      setFormData({
        gstNumber: taxConfig.gstNumber || '',
        cgst: taxConfig.cgst || 9,
        sgst: taxConfig.sgst || 9,
        igst: taxConfig.igst || 18,
        isDefault: taxConfig.isDefault !== false,
        includeGSTNumber: taxConfig.includeGSTNumber !== false,
      });
    }
  }, [taxConfig]);

  const handleSave = () => {
    // Validate GST number format (basic validation)
    if (formData.gstNumber && !isValidGSTNumber(formData.gstNumber)) {
      Alert.alert('Invalid GST Number', 'Please enter a valid 15-digit GST number');
      return;
    }

    // Validate tax rates
    if (formData.cgst < 0 || formData.sgst < 0 || formData.igst < 0) {
      Alert.alert('Invalid Tax Rates', 'Tax rates cannot be negative');
      return;
    }

    // CGST + SGST should equal IGST
    if (formData.cgst + formData.sgst !== formData.igst) {
      Alert.alert(
        'Tax Rate Mismatch',
        `CGST (${formData.cgst}%) + SGST (${formData.sgst}%) should equal IGST (${formData.igst}%)`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Auto-adjust IGST', 
            onPress: () => {
              setFormData({
                ...formData,
                igst: formData.cgst + formData.sgst
              });
            }
          }
        ]
      );
      return;
    }

    updateTaxConfig(formData);
    Alert.alert('Success', 'Tax configuration saved successfully');
    router.back();
  };

  const isValidGSTNumber = (gst: string) => {
    // Basic GST number validation (15 digits)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const handleCGSTChange = (value: string) => {
    const cgst = parseFloat(value) || 0;
    setFormData({
      ...formData,
      cgst,
      igst: cgst + formData.sgst
    });
  };

  const handleSGSTChange = (value: string) => {
    const sgst = parseFloat(value) || 0;
    setFormData({
      ...formData,
      sgst,
      igst: formData.cgst + sgst
    });
  };

  const handleIGSTChange = (value: string) => {
    const igst = parseFloat(value) || 0;
    const halfRate = igst / 2;
    setFormData({
      ...formData,
      igst,
      cgst: halfRate,
      sgst: halfRate
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tax Configuration',
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* GST Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>GST Information</Text>
          
          <View style={styles.inputContainer}>
            <Hash size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="GST Number (15 digits)"
              value={formData.gstNumber}
              onChangeText={(text) => setFormData({ ...formData, gstNumber: text.toUpperCase() })}
              placeholderTextColor={colors.gray}
              autoCapitalize="characters"
              maxLength={15}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Include GST number on bills</Text>
            <Switch
              value={formData.includeGSTNumber}
              onValueChange={(value) => setFormData({ ...formData, includeGSTNumber: value })}
              trackColor={{ false: colors.gray, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Tax Rates */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Rates</Text>
          
          <View style={styles.infoBox}>
            <Info size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              CGST + SGST = IGST. Changing one will auto-adjust the others.
            </Text>
          </View>

          <View style={styles.taxRow}>
            <View style={styles.taxInput}>
              <Text style={styles.taxLabel}>CGST %</Text>
              <View style={styles.inputContainer}>
                <Percent size={16} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.cgst.toString()}
                  onChangeText={handleCGSTChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>

            <View style={styles.taxInput}>
              <Text style={styles.taxLabel}>SGST %</Text>
              <View style={styles.inputContainer}>
                <Percent size={16} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.sgst.toString()}
                  onChangeText={handleSGSTChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>
          </View>

          <View style={styles.taxInput}>
            <Text style={styles.taxLabel}>IGST % (Interstate)</Text>
            <View style={styles.inputContainer}>
              <Percent size={16} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.igst.toString()}
                onChangeText={handleIGSTChange}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.gray}
              />
            </View>
          </View>
        </Card>

        {/* Default Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Default Settings</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Apply to all bills by default</Text>
              <Text style={styles.switchDescription}>
                You can still change tax settings for individual bills
              </Text>
            </View>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
              trackColor={{ false: colors.gray, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <Button
          title="Save Configuration"
          onPress={handleSave}
          icon={<Save size={20} color={colors.white} />}
          style={styles.saveButton}
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
    marginBottom: 16,
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
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: colors.gray,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
  },
  taxRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  taxInput: {
    flex: 1,
  },
  taxLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 8,
  },
});