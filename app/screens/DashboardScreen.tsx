import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button, StatusBadge } from '../../lib/ui';
import { StrategyManager } from '../../lib/StrategyManager';
import { FyersAPI } from '../../lib/fyersApi';

interface DashboardScreenProps {
  fyersApi: FyersAPI;
  strategyManager: StrategyManager;
  onNavigate?: (screen: string) => void;
  isPaperMode?: boolean;
}

export function DashboardScreen({ fyersApi, strategyManager, onNavigate, isPaperMode = true }: DashboardScreenProps) {
  const [niftyPrice, setNiftyPrice] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [activeStrategies, setActiveStrategies] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isExecutionActive, setIsExecutionActive] = useState(false);
  const [allStrategiesEnabled, setAllStrategiesEnabled] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsExecutionActive(strategyManager.isActive());
  }, [strategyManager]);

  const loadDashboardData = async () => {
    try {
      const price = await fyersApi.getNiftyPrice();
      setNiftyPrice(price);
      
      const strategies = strategyManager.getStrategies();
      const enabled = strategies.filter(s => s.isEnabled()).length;
      setActiveStrategies(enabled);
      setAllStrategiesEnabled(enabled === strategies.length && strategies.length > 0);
      
      const pnl = strategies.reduce((total, s) => total + s.getTotalPnL(), 0);
      setTotalPnL(pnl);
    } catch (error) {
      console.error('Dashboard data load failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trading Dashboard</Text>
          <Text style={styles.modeText}>{isPaperMode ? 'Paper Trading Mode' : 'Real Trading Mode'}</Text>
        </View>
        <StatusBadge 
          status={isExecutionActive ? 'active' : 'inactive'} 
          text={isExecutionActive ? 'Live' : 'Stopped'} 
        />
      </View>

      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>NIFTY 50</Text>
          <Text style={styles.metricValue}>{niftyPrice.toFixed(2)}</Text>
        </Card>
        
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total P&L</Text>
          <Text style={[styles.metricValue, { color: totalPnL >= 0 ? '#4CAF50' : '#F44336' }]}>
            ₹{totalPnL.toFixed(2)}
          </Text>
        </Card>
      </View>

      <Card style={styles.strategyCard}>
        <Text style={styles.cardTitle}>Active Strategies</Text>
        <Text style={styles.strategyCount}>{activeStrategies} running</Text>
        <View style={styles.controlButtons}>
          <Button 
            title={isExecutionActive ? 'Stop Execution' : 'Start Execution'}
            onPress={() => {
              if (isExecutionActive) {
                strategyManager.stop();
                setIsExecutionActive(false);
              } else {
                strategyManager.start();
                setIsExecutionActive(true);
              }
              loadDashboardData();
            }}
            variant={isExecutionActive ? 'destructive' : 'primary'}
            style={styles.controlButton}
          />
          <Button 
            title="Enable All"
            onPress={() => {
              strategyManager.enableAllStrategies();
              setAllStrategiesEnabled(true);
              setTimeout(() => loadDashboardData(), 100);
            }}
            variant="primary"
            style={styles.controlButton}
            disabled={allStrategiesEnabled}
          />
          <Button 
            title="Disable All"
            onPress={() => {
              strategyManager.disableAllStrategies();
              setAllStrategiesEnabled(false);
              setTimeout(() => loadDashboardData(), 100);
            }}
            variant="destructive"
            style={styles.controlButton}
            disabled={!allStrategiesEnabled && activeStrategies === 0}
          />
        </View>
      </Card>

      <Card style={styles.quickActions}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button title={isPaperMode ? 'View Positions' : 'View Portfolio'} onPress={() => onNavigate?.('positions')} variant="outline" />
          <Button title={isPaperMode ? 'Order History' : 'Trade History'} onPress={() => onNavigate?.('orders')} variant="outline" />
        </View>
      </Card>
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
  modeText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  strategyCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  strategyCount: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 12,
  },
  quickActions: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
  },
});