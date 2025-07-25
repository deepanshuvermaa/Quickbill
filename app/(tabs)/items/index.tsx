import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useItemsStore } from '@/store/itemsStore';
import { ItemCard } from '@/components/ItemCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Plus, Search, Package, ArrowLeft, Lock } from 'lucide-react-native';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { useSubscriptionManager } from '@/utils/subscription-manager';
import { navigateToSubscription } from '@/utils/subscription-navigation';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

export default function ItemsScreen() {
  const router = useRouter();
  const { items, deleteItem } = useItemsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const subscriptionManager = useSubscriptionManager();
  
  // Force refresh subscription data when entering this screen
  useSubscriptionCheck('inventory');
  
  const hasInventoryAccess = subscriptionManager.hasFeatureAccess('inventory');
  
  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  
  // Filter items based on search query and selected category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const handleDeleteItem = (id: string) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteItem(id);
            Alert.alert("Success", "Item deleted successfully");
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Inventory',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <SubscriptionGuard 
              feature="inventory"
              fallback={
                <View style={styles.lockedButton}>
                  <Lock size={20} color={colors.gray} />
                </View>
              }
            >
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/items/add')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            </SubscriptionGuard>
          ),
        }} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>
      
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(null)}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.selectedCategoryChipText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.selectedCategoryChip
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === category ? null : category
                )}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text 
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.selectedCategoryChipText
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {!hasInventoryAccess ? (
        <View style={styles.upgradeBanner}>
          <Lock size={48} color={colors.gray} style={styles.upgradeIcon} />
          <Text style={styles.upgradeTitle}>Inventory Management</Text>
          <Text style={styles.upgradeMessage}>
            Upgrade to Gold or Platinum plan to manage your inventory
          </Text>
          <Button 
            title="View Plans"
            onPress={() => navigateToSubscription()}
            style={styles.upgradeButton}
          />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          title="No items yet"
          message="Add your first item to start creating bills"
          icon={<Package size={64} color={colors.gray} />}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No matching items"
          message="Try a different search term or category"
          icon={<Search size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onEdit={() => router.push(`/items/${item.id}`)}
              onDelete={() => handleDeleteItem(item.id)}
              onPress={() => router.push(`/items/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.addButtonContainer}>
        <Button
          title="Add New Item"
          onPress={() => router.push('/items/add')}
          icon={<Plus size={20} color={colors.white} />}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lockedButton: {
    padding: 8,
    opacity: 0.5,
  },
  upgradeBanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  upgradeIcon: {
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  upgradeMessage: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  upgradeButton: {
    paddingHorizontal: 32,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  categoriesContainer: {
    marginBottom: 4,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedCategoryChipText: {
    color: colors.white,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  addButtonContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});