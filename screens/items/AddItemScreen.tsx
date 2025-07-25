import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useItemsStore } from '../../store/itemsStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Picker } from '@react-native-picker/picker';
import { ArrowLeft } from 'lucide-react-native';

export default function AddItemScreen() {
  const navigation = useNavigation();
  const { addItem } = useItemsStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [taxRate, setTaxRate] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (stock.trim() && (isNaN(Number(stock)) || Number(stock) < 0)) {
      newErrors.stock = 'Stock must be a non-negative number';
    }
    
    // Validate tax rate
    if (taxRate.trim()) {
      const taxValue = parseFloat(taxRate);
      if (isNaN(taxValue) || taxValue < 0 || taxValue > 100) {
        newErrors.taxRate = 'Tax rate must be between 0 and 100';
      } else if (taxRate.includes('.') && taxRate.split('.')[1].length > 2) {
        newErrors.taxRate = 'Tax rate can have maximum 2 decimal places';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    try {
      addItem({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        price: Number(price),
        category: category.trim(),
        description: description.trim(),
        stock: stock.trim() ? Number(stock) : undefined,
        unit: unit.trim(),
        hsnCode: hsnCode.trim() || undefined,
        taxRate: taxRate.trim() ? parseFloat(taxRate) : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      Alert.alert(
        "Success",
        "Item added successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add item");
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Item</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.sectionTitle}>Item Information</Text>
          
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter item name"
            error={errors.name}
            autoCapitalize="words"
          />
          
          <Input
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="Enter price"
            keyboardType="numeric"
            error={errors.price}
          />
          
          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="Enter category (e.g., Groceries)"
            autoCapitalize="words"
          />
          
          <Input
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card>
        
        <Card style={styles.inventoryCard}>
          <Text style={styles.sectionTitle}>Inventory Details</Text>
          
          <View style={styles.inventoryRow}>
            <View style={styles.stockInput}>
              <Input
                label="Stock Quantity"
                value={stock}
                onChangeText={setStock}
                placeholder="Enter quantity"
                keyboardType="numeric"
                error={errors.stock}
              />
            </View>
            
            <View style={styles.unitInput}>
              <Input
                label="Unit"
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g., kg, pcs"
              />
            </View>
          </View>
          
          <Input
            label="HSN Code (Optional)"
            value={hsnCode}
            onChangeText={setHsnCode}
            placeholder="Enter HSN code"
            autoCapitalize="characters"
          />
        </Card>
        
        <Card style={styles.taxCard}>
          <Text style={styles.sectionTitle}>Tax Settings</Text>
          
          <Input
            label="Tax Rate (%) - Optional"
            value={taxRate}
            onChangeText={setTaxRate}
            placeholder="Enter tax rate (e.g., 18.00)"
            keyboardType="numeric"
            error={errors.taxRate}
          />
          {taxRate && !errors.taxRate && (
            <Text style={styles.taxBreakdown}>
              CGST: {(parseFloat(taxRate) / 2).toFixed(2)}% | SGST: {(parseFloat(taxRate) / 2).toFixed(2)}%
            </Text>
          )}
          <Text style={styles.taxHelpText}>
            If specified, this tax rate will be applied to this item instead of the bill's default tax
          </Text>
        </Card>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.cancelButton}
        />
        
        <Button
          title="Save Item"
          onPress={handleSubmit}
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inventoryCard: {
    marginTop: 16,
  },
  taxCard: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  taxTypeContainer: {
    marginBottom: 16,
  },
  taxTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  taxTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  taxTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  taxTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  taxTypeButtonTextActive: {
    color: colors.white,
  },
  taxRateContainer: {
    marginTop: 8,
  },
  taxBreakdown: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  taxExemptText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 8,
  },
  taxHelpText: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  inventoryRow: {
    flexDirection: 'row',
  },
  stockInput: {
    flex: 2,
    marginRight: 8,
  },
  unitInput: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 95 : 65, // Account for absolute positioned tab bar
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 2,
  },
});