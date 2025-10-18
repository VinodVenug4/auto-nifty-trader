import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button, StatusBadge } from '../../lib/ui';
import { FyersAPI } from '../../lib/fyersApi';

interface RealPortfolioScreenProps {
  fyersApi: FyersAPI;
  onBack?: () => void;
}

export function RealPortfolioScreen({ fyersApi, onBack }: RealPortfolioScreenProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [funds, setFunds] = useState({ availableBalance: 0, totalBalance: 0, usedMargin: 0 });
  const [totalPnL, setTotalPnL] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPortfolioData = async () => {
    try {
      const [positionsData, fundsData, ordersData] = await Promise.all([
        fyersApi.getPositions(),
        fyersApi.getFunds(),
        fyersApi.getOrderHistory()
      ]);
      
      setPositions(positionsData);
      setFunds(fundsData);
      setPendingOrders(ordersData.filter(order => order.status === 'PENDING' || order.status === 'OPEN'));
      
      // Calculate total P&L from positions
      const pnl = positionsData.reduce((sum, pos) => sum + (pos.unrealizedProfit || 0), 0);
      setTotalPnL(pnl);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
  };

  const getSymbolDisplay = (symbol: string): string => {
    // Clean up Fyers symbol format
    return symbol.replace('NSE:', '').replace('-EQ', '');
  };

  const getPositionType = (symbol: string): string => {
    if (symbol.includes('CE')) return 'Call';
    if (symbol.includes('PE')) return 'Put';
    return 'Equity';
  };

  const handleExitAll = async () => {
    try {
      const result = await fyersApi.exitAllPositions();
      if (result.success) {
        await loadPortfolioData(); // Refresh data
      } else {
        console.error('Exit all failed:', result.error);
      }
    } catch (error) {
      console.error('Exit all error:', error);
    }
  };

  const handleExitPosition = async (positionId: string) => {
    try {
      const result = await fyersApi.exitPosition(positionId);
      if (result.success) {
        await loadPortfolioData(); // Refresh data
      } else {
        console.error('Exit position failed:', result.error);
      }
    } catch (error) {
      console.error('Exit position error:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const result = await fyersApi.cancelOrder(orderId);
      if (result.success) {
        await loadPortfolioData(); // Refresh data
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
      {onBack && (
        <View style={styles.header}>
          <Button title="← Back" onPress={onBack} variant="ghost" />
          <Text style={styles.title}>Real Portfolio</Text>
        </View>
      )}

      <Card style={styles.fundsCard}>
        <Text style={styles.sectionTitle}>Account Summary</Text>
        <View style={styles.fundsRow}>
          <View style={styles.fundsItem}>
            <Text style={styles.fundsLabel}>Available Balance</Text>
            <Text style={styles.fundsValue}>₹{funds.availableBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.fundsItem}>
            <Text style={styles.fundsLabel}>Used Margin</Text>
            <Text style={styles.fundsValue}>₹{funds.usedMargin.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.fundsRow}>
          <View style={styles.fundsItem}>
            <Text style={styles.fundsLabel}>Total Balance</Text>
            <Text style={styles.fundsValue}>₹{funds.totalBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.fundsItem}>
            <Text style={styles.fundsLabel}>Unrealized P&L</Text>
            <Text style={[
              styles.fundsValue, 
              { color: totalPnL >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
            </Text>
          </View>
        </View>
        <StatusBadge status="active" text="Real Trading" />
      </Card>

      <View style={styles.positionsHeader}>
        <Text style={styles.positionsTitle}>Live Positions</Text>
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
          <Text style={styles.emptySubtext}>Positions will appear here when you have open trades</Text>
        </Card>
      ) : (
        positions.map((position, index) => (
          <Card key={`${position.symbol}-${index}`} style={styles.positionCard}>
            <View style={styles.positionHeader}>
              <View style={styles.positionInfo}>
                <Text style={styles.positionSymbol}>{getSymbolDisplay(position.symbol)}</Text>
                <Text style={styles.positionType}>{getPositionType(position.symbol)}</Text>
              </View>
              <StatusBadge 
                status={position.side > 0 ? 'long' : 'short'} 
                text={position.side > 0 ? 'Long' : 'Short'} 
              />
            </View>

            <View style={styles.positionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{Math.abs(position.qty || 0)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Avg Price:</Text>
                <Text style={styles.detailValue}>₹{(position.buyAvg || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>LTP:</Text>
                <Text style={styles.detailValue}>₹{(position.ltp || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>P&L:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: (position.unrealizedProfit || 0) >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {(position.unrealizedProfit || 0) >= 0 ? '+' : ''}₹{(position.unrealizedProfit || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>P&L %:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: (position.unrealizedProfit || 0) >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {position.buyAvg ? (((position.unrealizedProfit || 0) / (position.buyAvg * Math.abs(position.qty || 1))) * 100).toFixed(2) : '0.00'}%
                </Text>
              </View>
            </View>
            
            <View style={styles.positionActions}>
              <Button 
                title="Exit Position" 
                onPress={() => handleExitPosition(position.id || position.symbol)} 
                variant="destructive"
                style={styles.exitButton}
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
                  <Text style={styles.positionType}>{order.side === 1 ? 'Buy' : 'Sell'} • {order.orderType === 1 ? 'Limit' : 'Market'}</Text>
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
                  <Text style={styles.detailValue}>₹{(order.limitPrice || order.price || 0).toFixed(2)}</Text>
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
                  style={styles.exitButton}
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
  fundsCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  fundsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  fundsItem: {
    flex: 1,
  },
  fundsLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  fundsValue: {
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
  positionActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  exitButton: {
    flex: 1,
  },
  orderCard: {
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
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
  positionType: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 2,
  },
  positionDetails: {
    gap: 8,
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
});