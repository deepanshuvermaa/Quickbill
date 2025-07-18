import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors } from '@/constants/colors';
import { useCustomerStore } from '@/store/customerStore';
import { CustomerWithStats } from '@/types/customer';
import { formatPhoneNumber } from '@/utils/customerValidation';
import { User, Phone } from 'lucide-react-native';

interface CustomerSuggestionsProps {
  searchQuery: string;
  onSelectCustomer: (customer: CustomerWithStats) => void;
  maxHeight?: number;
}

export const CustomerSuggestions: React.FC<CustomerSuggestionsProps> = ({
  searchQuery,
  onSelectCustomer,
  maxHeight = 200,
}) => {
  const { getSearchResults } = useCustomerStore();
  const [suggestions, setSuggestions] = useState<CustomerWithStats[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      try {
        if (!getSearchResults) {
          console.warn('getSearchResults not available');
          setSuggestions([]);
          return;
        }
        const results = getSearchResults(searchQuery);
        console.log('Search results:', results?.length || 0, 'for query:', searchQuery);
        setSuggestions(results?.slice(0, 5) || []); // Show max 5 suggestions
      } catch (error) {
        console.error('Error getting search results:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, getSearchResults]);

  if (suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: CustomerWithStats }) => {
    try {
      return (
        <TouchableOpacity
          style={styles.suggestionItem}
          onPress={() => onSelectCustomer(item)}
        >
          <View style={styles.suggestionAvatar}>
            <User size={16} color={colors.primary} />
          </View>
          <View style={styles.suggestionInfo}>
            <Text style={styles.suggestionName}>{item.name || 'Unknown'}</Text>
            {item.phone && (
              <View style={styles.suggestionMeta}>
                <Phone size={12} color={colors.textLight} />
                <Text style={styles.suggestionPhone}>
                  {formatPhoneNumber(item.phone)}
                </Text>
                <Text style={styles.suggestionPurchases}>
                  ₹{item.stats?.totalPurchases?.toLocaleString('en-IN') || '0'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error rendering suggestion:', error);
      return null;
    }
  };

  try {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item?.id || Math.random().toString()}
          renderItem={renderSuggestion}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    );
  } catch (error) {
    console.error('Error rendering CustomerSuggestions:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionPhone: {
    fontSize: 13,
    color: colors.textLight,
    flex: 1,
  },
  suggestionPurchases: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});