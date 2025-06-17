import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bill } from '@/types';
import { colors } from '@/constants/colors';
import { Card } from './Card';
import { ChevronRight, Printer, Share2, Trash2 } from 'lucide-react-native';

interface BillCardProps {
  bill: Bill;
  onPress: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export const BillCard = ({ bill, onPress, onPrint, onShare, onDelete }: BillCardProps) => {
  const formattedDate = new Date(bill.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <Card>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.billId}>Bill #{bill.id.substring(5, 13)}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{bill.customerName}</Text>
            {bill.customerPhone && (
              <Text style={styles.customerPhone}>{bill.customerPhone}</Text>
            )}
          </View>
          
          <View style={styles.summary}>
            <Text style={styles.itemCount}>
              {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.total}>₹{bill.total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentMethodText}>
                {bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1)}
              </Text>
            </View>
            
            <View style={styles.actions}>
              {onDelete && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }} 
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              )}
              
              {onShare && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    onShare();
                  }} 
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Share2 size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              
              {onPrint && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    onPrint();
                  }} 
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Printer size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              
              <ChevronRight size={18} color={colors.gray} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentMethodText: {
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
});