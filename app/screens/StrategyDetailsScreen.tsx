import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, StatusBadge } from '../../lib/ui.tsx';
import { BaseStrategy } from '../../lib/strategies/BaseStrategy.ts';

interface StrategyDetailsScreenProps {
  strategy: BaseStrategy;
  onBack: () => void;
}

export function StrategyDetailsScreen({ strategy, onBack }: StrategyDetailsScreenProps) {
  const config = strategy.getConfig();
  const positions = strategy.getPositions();
  const totalPnL = strategy.getTotalPnL();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Back" onPress={onBack} variant="ghost" />
        <Text style={styles.title}>{strategy.getName()}</Text>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <StatusBadge 
            status={strategy.isEnabled() ? 'active' : 'inactive'} 
            text={strategy.isEnabled() ? 'Active' : 'Inactive'} 
          />
        </View>
        <Text style={styles.description}>{strategy.getDescription()}</Text>
      </Card>

      <Card style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Total P&L</Text>
            <Text style={[styles.metricValue, { color: totalPnL >= 0 ? '#4CAF50' : '#F44336' }]}>
              ₹{totalPnL.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Active Positions</Text>
            <Text style={styles.metricValue}>{positions.length}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.configCard}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={styles.configGrid}>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Entry Time:</Text>
            <Text style={styles.configValue}>{config.parameters.entryTime}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Exit Time:</Text>
            <Text style={styles.configValue}>{config.parameters.exitTime}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Quantity:</Text>
            <Text style={styles.configValue}>{config.parameters.quantity}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>ATR:</Text>
            <Text style={styles.configValue}>{config.parameters.atr || 150}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Max Loss:</Text>
            <Text style={styles.configValue}>₹{config.parameters.maxLoss}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Target:</Text>
            <Text style={styles.configValue}>₹{config.parameters.targetProfit}</Text>
          </View>
        </View>
      </Card>

      {positions.length > 0 && (
        <Card style={styles.positionsCard}>
          <Text style={styles.sectionTitle}>Current Positions</Text>
          {positions.map((position, index) => (
            <View key={index} style={styles.positionItem}>
              <Text style={styles.positionSymbol}>{position.symbol}</Text>
              <Text style={styles.positionQty}>Qty: {position.quantity}</Text>
              <Text style={[styles.positionPnL, { color: position.pnl >= 0 ? '#4CAF50' : '#F44336' }]}>
                ₹{position.pnl.toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>
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
  statusCard: {
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 12,
  },
  description: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  performanceCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  configCard: {
    padding: 16,
    marginBottom: 16,
  },
  configGrid: {
    gap: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  configValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  positionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  positionSymbol: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 2,
  },
  positionQty: {
    fontSize: 14,
    color: '#B0B0B0',
    flex: 1,
  },
  positionPnL: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});