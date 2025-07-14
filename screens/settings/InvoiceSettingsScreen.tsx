import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { Card } from '../../components/Card';
import {
  invoiceNumbering,
  InvoiceNumberingSettings,
  previewInvoiceNumber,
  updateInvoiceSettings
} from '../../utils/invoice-numbering';

export default function InvoiceSettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<InvoiceNumberingSettings | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const currentSettings = invoiceNumbering.getSettings();
      setSettings(currentSettings);
      const previewNumber = await previewInvoiceNumber();
      setPreview(previewNumber);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load invoice settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async (newSettings: InvoiceNumberingSettings) => {
    try {
      // Temporarily update settings to get preview
      await invoiceNumbering.saveSettings(newSettings);
      const previewNumber = await previewInvoiceNumber();
      setPreview(previewNumber);
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  };

  const handleSettingChange = async (key: keyof InvoiceNumberingSettings, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await updatePreview(newSettings);
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await updateInvoiceSettings(settings);
      Alert.alert('Success', 'Invoice settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save invoice settings');
    } finally {
      setSaving(false);
    }
  };

  const resetCounters = () => {
    Alert.alert(
      'Reset Counters',
      'This will reset all invoice counters. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await invoiceNumbering.resetCounters('all');
              await loadSettings();
              Alert.alert('Success', 'Counters reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset counters');
            }
          },
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading invoice settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Settings</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview Card */}
        <Card style={styles.previewCard}>
          <Text style={styles.sectionTitle}>Invoice Number Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Next Invoice Number:</Text>
            <Text style={styles.previewNumber}>{preview}</Text>
          </View>
        </Card>

        {/* Format Settings */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Numbering Format</Text>
          
          <View style={styles.settingRowColumn}>
            <Text style={styles.settingLabel}>Format Type</Text>
            <View style={[styles.segmentedControl, styles.formatTypeControl]}>
              {['date_based', 'sequential'].map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.segmentButton,
                    settings.format === format && styles.segmentButtonActive,
                  ]}
                  onPress={() => handleSettingChange('format', format)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.format === format && styles.segmentTextActive,
                    ]}
                  >
                    {format === 'date_based' ? 'Date Based' : 'Sequential'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {settings.format === 'date_based' && (
            <View style={styles.settingRowColumn}>
              <Text style={styles.settingLabel}>Date Format</Text>
              <View style={[styles.segmentedControl, styles.dateFormatControl]}>
                {[
                  { key: 'MMDD', label: 'MMDD' },
                  { key: 'DDMM', label: 'DDMM' },
                  { key: 'YYMMDD', label: 'YYMMDD' },
                ].map((format) => (
                  <TouchableOpacity
                    key={format.key}
                    style={[
                      styles.segmentButton,
                      settings.dateFormat === format.key && styles.segmentButtonActive,
                    ]}
                    onPress={() => handleSettingChange('dateFormat', format.key)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        settings.dateFormat === format.key && styles.segmentTextActive,
                      ]}
                    >
                      {format.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Reset Options */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Reset Options</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reset Daily</Text>
              <Text style={styles.settingDescription}>Start from 001 each day</Text>
            </View>
            <Switch
              value={settings.resetDaily}
              onValueChange={(value) => {
                handleSettingChange('resetDaily', value);
                if (value) {
                  handleSettingChange('resetMonthly', false);
                }
              }}
              trackColor={{ false: colors.gray, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reset Monthly</Text>
              <Text style={styles.settingDescription}>Start from 001 each month</Text>
            </View>
            <Switch
              value={settings.resetMonthly && !settings.resetDaily}
              onValueChange={(value) => {
                handleSettingChange('resetMonthly', value);
                if (value) {
                  handleSettingChange('resetDaily', false);
                }
              }}
              disabled={settings.resetDaily}
              trackColor={{ false: colors.gray, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Customization */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Customization</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Prefix</Text>
            <TextInput
              style={styles.textInput}
              value={settings.prefix}
              onChangeText={(value) => handleSettingChange('prefix', value)}
              placeholder="QB, INV, etc."
              maxLength={10}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Suffix</Text>
            <TextInput
              style={styles.textInput}
              value={settings.suffix}
              onChangeText={(value) => handleSettingChange('suffix', value)}
              placeholder="Optional suffix"
              maxLength={10}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Separator</Text>
            <TextInput
              style={styles.textInput}
              value={settings.separator}
              onChangeText={(value) => handleSettingChange('separator', value)}
              placeholder="-, _, (empty)"
              maxLength={3}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Start Number</Text>
            <TextInput
              style={styles.textInput}
              value={String(settings.startNumber)}
              onChangeText={(value) => {
                const num = parseInt(value) || 1;
                handleSettingChange('startNumber', num);
              }}
              keyboardType="numeric"
              placeholder="1"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Minimum Digits</Text>
            <TextInput
              style={styles.textInput}
              value={String(settings.minDigits)}
              onChangeText={(value) => {
                const num = Math.max(1, Math.min(6, parseInt(value) || 3));
                handleSettingChange('minDigits', num);
              }}
              keyboardType="numeric"
              placeholder="3"
            />
          </View>
        </Card>

        {/* Advanced Actions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={resetCounters}>
            <Ionicons name="refresh" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Reset All Counters</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewCard: {
    marginBottom: 16,
    backgroundColor: colors.primary,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  previewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'monospace',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowColumn: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.gray,
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  formatTypeControl: {
    flexWrap: 'wrap',
  },
  dateFormatControl: {
    flexWrap: 'wrap',
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    flexGrow: 1,
    marginHorizontal: 2,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  segmentTextActive: {
    color: colors.white,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  dangerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
  },
  bottomSpacer: {
    height: 32,
  },
});