import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useItemsStore } from '@/store/itemsStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function AddItemScreen() {
  const router = useRouter();
  const { addItem } = useItemsStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('');
  
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      Alert.alert(
        "Success",
        "Item added successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add item");
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Add New Item' }} />
      
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
        </Card>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
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
    paddingBottom: Platform.OS === 'ios' ? 90 : 60, // Account for absolute positioned tab bar
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