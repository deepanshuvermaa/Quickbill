import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useItemsStore } from '@/store/itemsStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, deleteItem } = useItemsStore();
  
  const item = items.find(item => item.id === id);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (item) {
      setName(item.name);
      setPrice(item.price.toString());
      setCategory(item.category || '');
      setDescription(item.description || '');
      setStock(item.stock !== undefined ? item.stock.toString() : '');
      setUnit(item.unit || '');
    } else {
      Alert.alert("Error", "Item not found", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [item]);
  
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
  
  const handleUpdate = () => {
    if (!validateForm() || !item) return;
    
    try {
      updateItem(item.id, {
        name: name.trim(),
        price: Number(price),
        category: category.trim(),
        description: description.trim(),
        stock: stock.trim() ? Number(stock) : undefined,
        unit: unit.trim(),
      });
      
      Alert.alert(
        "Success",
        "Item updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update item");
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            if (item) {
              deleteItem(item.id);
              router.back();
            }
          }
        }
      ]
    );
  };
  
  if (!item) {
    return null;
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Edit Item' }} />
      
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
        
        <Button
          title="Delete Item"
          onPress={handleDelete}
          variant="danger"
          style={styles.deleteButton}
        />
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.cancelButton}
        />
        
        <Button
          title="Save Changes"
          onPress={handleUpdate}
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
    padding: 16,
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
  deleteButton: {
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
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