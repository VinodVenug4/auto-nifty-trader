import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button, StatusBadge } from '../../lib/ui';
import { PaperTradingAPI, PaperPosition } from '../../lib/PaperTradingAPI';

interface PositionsScreenProps {
  paperTradingApi: PaperTradingAPI;
  onBack: () => void;
}

export function PositionsScreen({ paperTradingApi, onBack }: PositionsScreenProps) {
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPositions();
    const interval = setInterval(loadPositions, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPositions = async () => {
    try {
      const positionsData = await paperTradingApi.getPositions();
      const ordersData = paperTradingApi.getPendingOrders();
      const pnl = paperTradingApi.getTotalPnL();
      
      setPositions(positionsData);
      setPendingOrders(ordersData);
      setTotalPnL(pnl);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPositions();
    setRefreshing(false);
  };

  const getSymbolDisplay = (symbol: string): string => {
    const match = symbol.match(/NIFTY(\d{6})(\d{5})(CE|PE)/);
    if (match) {
      const [, expiry, strike, type] = match;
      return `NIFTY ${strike} ${type}`;
    }
    return symbol;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExitAll = async () => {
    try {
      paperTradingApi.reset();
      await loadPositions();
    } catch (error) {
      console.error('Exit all error:', error);
    }
  };

  const closePosition = async (symbol: string, quantity: number) => {
    try {
      await paperTradingApi.placeOrder({
        symbol,
        qty: quantity,
        type: 'SELL',
        productType: 'INTRADAY',
        orderType: 'MARKET'
      });
      await loadPositions();
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const result = await paperTradingApi.cancelOrder(orderId);
      if (result.success) {
        await loadPositions();
      } else {
        console.error('Cancel order failed:', result.error);
      }
    } catch (error) {
      console.error('Cancel order error:', error);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Button title="← Back" onPress={onBack} variant="ghost" />
        <Text style={styles.title}>Live Positions</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Portfolio Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total P&L</Text>
            <Text style={[
              styles.summaryValue, 
              { color: totalPnL >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Positions</Text>
            <Text style={styles.summaryValue}>{positions.length}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Virtual Balance</Text>
            <Text style={styles.summaryValue}>₹{paperTradingApi.getVirtualBalance().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Mode</Text>
            <StatusBadge status="active" text="Paper Trading" />
          </View>
        </View>
      </Card>

      <View style={styles.positionsHeader}>
        <Text style={styles.positionsTitle}>Current Positions</Text>
        <View style={styles.headerButtons}>
          {positions.length > 0 && (
            <Button 
              title="Exit All" 
              onPress={handleExitAll} 
              variant="destructive" 
              style={styles.exitAllButton}
            />
          )}
          <Button title="Refresh" onPress={onRefresh} variant="ghost" />
        </View>
      </View>

      {positions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active positions</Text>
          <Text style={styles.emptySubtext}>Positions will appear here when strategies execute trades</Text>
        </Card>
      ) : (
        positions.map((position, index) => (
          <Card key={`${position.symbol}-${index}`} style={styles.positionCard}>
            <View style={styles.positionHeader}>
              <View style={styles.positionInfo}>
                <Text style={styles.positionSymbol}>{getSymbolDisplay(position.symbol)}</Text>
                <Text style={styles.positionTime}>Entry: {formatTime(position.entryTime)}</Text>
              </View>
              <StatusBadge 
                status={position.quantity > 0 ? 'long' : 'short'} 
                text={position.quantity > 0 ? 'Long' : 'Short'} 
              />
            </View>

            <View style={styles.positionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{Math.abs(position.quantity)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Entry Price:</Text>
                <Text style={styles.detailValue}>₹{position.entryPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Price:</Text>
                <Text style={styles.detailValue}>₹{position.currentPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>P&L:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: position.pnl >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>P&L %:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: position.pnl >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {((position.pnl / (position.entryPrice * Math.abs(position.quantity))) * 100).toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.positionActions}>
              <Button 
                title="Exit Position"
                onPress={() => closePosition(position.symbol, Math.abs(position.quantity))}
                variant="destructive"
                style={styles.closeButton}
              />
            </View>
          </Card>
        ))
      )}

      {pendingOrders.length > 0 && (
        <>
          <View style={styles.positionsHeader}>
            <Text style={styles.positionsTitle}>Pending Orders</Text>
            <Text style={styles.positionsCount}>{pendingOrders.length} orders</Text>
          </View>

          {pendingOrders.map((order, index) => (
            <Card key={`${order.id}-${index}`} style={styles.orderCard}>
              <View style={styles.positionHeader}>
                <View style={styles.positionInfo}>
                  <Text style={styles.positionSymbol}>{getSymbolDisplay(order.symbol)}</Text>
                  <Text style={styles.positionTime}>{order.side === 1 ? 'Buy' : 'Sell'} • {order.orderType === 1 ? 'Limit' : 'Market'}</Text>
                </View>
                <StatusBadge status="pending" text="Pending" />
              </View>

              <View style={styles.positionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{order.qty}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.detailValue}>₹{(order.limitPrice || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>{order.status}</Text>
                </View>
              </View>
              
              <View style={styles.positionActions}>
                <Button 
                  title="Cancel Order" 
                  onPress={() => handleCancelOrder(order.id)} 
                  variant="destructive"
                  style={styles.closeButton}
                />
              </View>
            </Card>
          ))}
        </>
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
    marginBottom: 8,
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
  positionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exitAllButton: {
    paddingHorizontal: 12,
  },
  positionsTitle: {
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
    textAlign: 'center',
  },
  positionCard: {
    padding: 16,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionInfo: {
    flex: 1,
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionTime: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 2,
  },
  positionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  positionActions: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
  },
  closeButton: {
    width: '100%',
  },
  orderCard: {
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
});