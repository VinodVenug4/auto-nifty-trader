import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, StatusBadge } from '../../lib/ui.tsx';
import { FyersAPI } from '../../lib/fyersApi.ts';
import { Position } from '../../lib/strategies/BaseStrategy.ts';

interface PortfolioScreenProps {
  fyersApi: FyersAPI;
}

export function PortfolioScreen({ fyersApi }: PortfolioScreenProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);

  useEffect(() => {
    loadPositions();
    const interval = setInterval(loadPositions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPositions = async () => {
    try {
      const positionsData = await fyersApi.getPositions();
      setPositions(positionsData);
      
      const pnl = positionsData.reduce((sum, pos) => sum + (pos.unrealizedProfit || 0), 0);
      const investment = positionsData.reduce((sum, pos) => sum + Math.abs(pos.buyValue || 0), 0);
      
      setTotalPnL(pnl);
      setTotalInvestment(investment);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  const getPositionType = (symbol: string): string => {
    if (symbol.includes('CE')) return 'Call';
    if (symbol.includes('PE')) return 'Put';
    return 'Equity';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <StatusBadge 
          status={totalPnL >= 0 ? 'profit' : 'loss'} 
          text={`₹${totalPnL.toFixed(2)}`} 
        />
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Investment</Text>
          <Text style={styles.summaryValue}>₹{totalInvestment.toFixed(2)}</Text>
        </Card>
        
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Current Value</Text>
          <Text style={styles.summaryValue}>₹{(totalInvestment + totalPnL).toFixed(2)}</Text>
        </Card>
      </View>

      <Card style={styles.pnlCard}>
        <Text style={styles.pnlLabel}>Today's P&L</Text>
        <Text style={[
          styles.pnlValue, 
          { color: totalPnL >= 0 ? '#4CAF50' : '#F44336' }
        ]}>
          {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
        </Text>
        <Text style={styles.pnlPercentage}>
          {totalInvestment > 0 ? `${((totalPnL / totalInvestment) * 100).toFixed(2)}%` : '0.00%'}
        </Text>
      </Card>

      <View style={styles.positionsHeader}>
        <Text style={styles.positionsTitle}>Active Positions</Text>
        <Text style={styles.positionsCount}>{positions.length} positions</Text>
      </View>

      {positions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active positions</Text>
        </Card>
      ) : (
        positions.map((position, index) => (
          <Card key={index} style={styles.positionCard}>
            <View style={styles.positionHeader}>
              <View style={styles.positionInfo}>
                <Text style={styles.positionSymbol}>{position.symbol}</Text>
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
                  ₹{(position.unrealizedProfit || 0).toFixed(2)}
                </Text>
              </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
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
  pnlCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pnlLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  pnlValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  pnlPercentage: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 4,
  },
  positionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionsCount: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#B0B0B0',
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