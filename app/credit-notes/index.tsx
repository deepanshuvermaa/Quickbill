import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CreditCard, Plus, ChevronRight, Trash2 } from 'lucide-react-native';
import { useCreditNotesStore } from '@/store/creditNotesStore';

export default function CreditNotesScreen() {
  const router = useRouter();
  const { creditNotes, deleteCreditNote } = useCreditNotesStore();
  
  const handleDeleteCreditNote = (id: string) => {
    Alert.alert(
      "Delete Credit Note",
      "Are you sure you want to delete this credit note?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteCreditNote(id);
            Alert.alert("Success", "Credit note deleted successfully");
          }
        }
      ]
    );
  };
  
  const renderCreditNoteItem = ({ item }: { item: any }) => (
    <Card>
      <TouchableOpacity onPress={() => router.push(`/credit-notes/${item.id}`)}>
        <View style={styles.creditNoteItem}>
          <View style={styles.creditNoteHeader}>
            <Text style={styles.creditNoteId}>Credit Note #{item.id.substring(5, 13)}</Text>
            <Text style={styles.creditNoteDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            {item.customerPhone && (
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            )}
          </View>
          
          <View style={styles.creditNoteSummary}>
            <Text style={styles.referenceText}>
              {item.referenceType}: #{item.referenceId.substring(5, 13)}
            </Text>
            <Text style={styles.total}>₹{item.amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.creditNoteFooter}>
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonText}>
                Reason: {item.reason}
              </Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={() => handleDeleteCreditNote(item.id)} 
                style={styles.actionButton}
              >
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
              <ChevronRight size={18} color={colors.gray} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Credit Notes',
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/credit-notes/add')}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {creditNotes.length === 0 ? (
        <EmptyState
          title="No credit notes yet"
          message="Create your first credit note to see it here"
          icon={<CreditCard size={64} color={colors.gray} />}
        />
      ) : (
        <FlatList
          data={creditNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderCreditNoteItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.addButtonContainer}>
        <Button
          title="Create New Credit Note"
          onPress={() => router.push('/credit-notes/add')}
          icon={<Plus size={20} color={colors.white} />}
          fullWidth
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
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  creditNoteItem: {
    padding: 4,
  },
  creditNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  creditNoteId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  creditNoteDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.textLight,
  },
  creditNoteSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referenceText: {
    fontSize: 14,
    color: colors.textLight,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  creditNoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonContainer: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});