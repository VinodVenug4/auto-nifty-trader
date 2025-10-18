import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, StatusBadge } from '../../lib/ui.tsx';
import { PaperTradingAPI, PaperTrade } from '../../lib/PaperTradingAPI.ts';

interface OrderHistoryScreenProps {
  paperTradingApi: PaperTradingAPI;
  onBack: () => void;
}

export function OrderHistoryScreen({ paperTradingApi, onBack }: OrderHistoryScreenProps) {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [virtualBalance, setVirtualBalance] = useState(0);

  useEffect(() => {
    loadOrderHistory();
  }, []);

  const loadOrderHistory = () => {
    const tradeHistory = paperTradingApi.getTrades();
    const balance = paperTradingApi.getVirtualBalance();
    setTrades(tradeHistory);
    setVirtualBalance(balance);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSymbolDisplay = (symbol: string): string => {
    // Extract readable symbol from NSE:NIFTY24112824350CE format
    const match = symbol.match(/NIFTY(\d{6})(\d{5})(CE|PE)/);
    if (match) {
      const [, expiry, strike, type] = match;
      return `NIFTY ${strike} ${type}`;
    }
    return symbol;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Back" onPress={onBack} variant="ghost" />
        <Text style={styles.title}>Order History</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Paper Trading Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Virtual Balance</Text>
            <Text style={styles.summaryValue}>₹{virtualBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Trades</Text>
            <Text style={styles.summaryValue}>{trades.length}</Text>
          </View>
        </View>
        <Button 
          title="Reset Paper Account" 
          onPress={() => {
            paperTradingApi.reset();
            loadOrderHistory();
          }}
          variant="outline"
          style={styles.resetButton}
        />
      </Card>

      <View style={styles.tradesHeader}>
        <Text style={styles.tradesTitle}>Recent Trades</Text>
        <Button title="Refresh" onPress={loadOrderHistory} variant="ghost" />
      </View>

      {trades.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No trades executed yet</Text>
          <Text style={styles.emptySubtext}>Start trading to see order history</Text>
        </Card>
      ) : (
        trades.map((trade) => (
          <Card key={trade.id} style={styles.tradeCard}>
            <View style={styles.tradeHeader}>
              <View style={styles.tradeInfo}>
                <Text style={styles.tradeSymbol}>{getSymbolDisplay(trade.symbol)}</Text>
                <Text style={styles.tradeTime}>{formatTime(trade.timestamp)}</Text>
              </View>
              <StatusBadge 
                status={trade.type === 'BUY' ? 'long' : 'short'} 
                text={trade.type} 
              />
            </View>

            <View style={styles.tradeDetails}>
              <View style={styles.tradeDetailRow}>
                <Text style={styles.tradeDetailLabel}>Quantity:</Text>
                <Text style={styles.tradeDetailValue}>{trade.quantity}</Text>
              </View>
              <View style={styles.tradeDetailRow}>
                <Text style={styles.tradeDetailLabel}>Price:</Text>
                <Text style={styles.tradeDetailValue}>₹{trade.price.toFixed(2)}</Text>
              </View>
              <View style={styles.tradeDetailRow}>
                <Text style={styles.tradeDetailLabel}>Value:</Text>
                <Text style={styles.tradeDetailValue}>₹{(trade.price * trade.quantity).toFixed(2)}</Text>
              </View>
              <View style={styles.tradeDetailRow}>
                <Text style={styles.tradeDetailLabel}>Status:</Text>
                <Text style={[styles.tradeDetailValue, { color: '#4CAF50' }]}>{trade.status}</Text>
              </View>
            </View>

            <View style={styles.tradeFooter}>
              <Text style={styles.tradeId}>Order ID: {trade.id}</Text>
            </View>
          </Card>
        ))
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
  resetButton: {
    marginTop: 8,
  },
  tradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradesTitle: {
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
  tradeCard: {
    padding: 16,
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tradeTime: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 2,
  },
  tradeDetails: {
    gap: 8,
    marginBottom: 12,
  },
  tradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeDetailLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  tradeDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tradeFooter: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 8,
  },
  tradeId: {
    fontSize: 12,
    color: '#666666',
  },
});