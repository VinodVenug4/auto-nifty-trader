import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, StatusBadge } from '../../lib/ui.tsx';
import { FyersAPI } from '../../lib/fyersApi.ts';

interface RealOrderHistoryScreenProps {
  fyersApi: FyersAPI;
  onBack: () => void;
}

export function RealOrderHistoryScreen({ fyersApi, onBack }: RealOrderHistoryScreenProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [funds, setFunds] = useState({ availableBalance: 0, totalBalance: 0, usedMargin: 0 });

  useEffect(() => {
    loadOrderHistory();
  }, []);

  const loadOrderHistory = async () => {
    try {
      const [ordersData, fundsData] = await Promise.all([
        fyersApi.getOrderHistory(),
        fyersApi.getFunds()
      ]);
      
      setOrders(ordersData);
      setFunds(fundsData);
    } catch (error) {
      console.error('Failed to load order history:', error);
    }
  };

  const formatTime = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getSymbolDisplay = (symbol: string): string => {
    return symbol.replace('NSE:', '').replace('-EQ', '');
  };

  const getOrderStatus = (status: number): { text: string; color: string } => {
    switch (status) {
      case 2: return { text: 'EXECUTED', color: '#4CAF50' };
      case 1: return { text: 'PENDING', color: '#FFA726' };
      case 3: return { text: 'CANCELLED', color: '#F44336' };
      case 4: return { text: 'REJECTED', color: '#F44336' };
      default: return { text: 'UNKNOWN', color: '#666666' };
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Back" onPress={onBack} variant="ghost" />
        <Text style={styles.title}>Order History</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Account Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Available Balance</Text>
            <Text style={styles.summaryValue}>₹{funds.availableBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>
          </View>
        </View>
        <StatusBadge status="active" text="Real Trading" />
      </Card>

      <View style={styles.ordersHeader}>
        <Text style={styles.ordersTitle}>Recent Orders</Text>
        <Button title="Refresh" onPress={loadOrderHistory} variant="ghost" />
      </View>

      {orders.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>Order history will appear here when you place trades</Text>
        </Card>
      ) : (
        orders.slice(0, 50).map((order, index) => { // Show last 50 orders
          const status = getOrderStatus(order.status);
          return (
            <Card key={`${order.id}-${index}`} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderSymbol}>{getSymbolDisplay(order.symbol)}</Text>
                  <Text style={styles.orderTime}>{formatTime(order.orderDateTime)}</Text>
                </View>
                <View style={styles.orderBadges}>
                  <StatusBadge 
                    status={order.side === 1 ? 'long' : 'short'} 
                    text={order.side === 1 ? 'BUY' : 'SELL'} 
                  />
                  <StatusBadge 
                    status={status.color === '#4CAF50' ? 'active' : 'inactive'} 
                    text={status.text} 
                  />
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Quantity:</Text>
                  <Text style={styles.orderDetailValue}>{order.qty}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order Price:</Text>
                  <Text style={styles.orderDetailValue}>₹{(order.limitPrice || order.stopPrice || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Executed Price:</Text>
                  <Text style={styles.orderDetailValue}>₹{(order.tradedPrice || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order Type:</Text>
                  <Text style={styles.orderDetailValue}>{order.type === 2 ? 'MARKET' : 'LIMIT'}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Product:</Text>
                  <Text style={styles.orderDetailValue}>{order.productType}</Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.orderId}>Order ID: {order.id}</Text>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  orderCard: {
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderTime: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 2,
  },
  orderBadges: {
    gap: 8,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 8,
  },
  orderId: {
    fontSize: 12,
    color: '#666666',
  },
});