import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Switch } from '../../lib/ui';
import { StrategyManager } from '../../lib/StrategyManager';
import { BaseStrategy } from '../../lib/strategies/BaseStrategy';
import { StrategyConfigScreen } from './StrategyConfigScreen';
import { StrategyDetailsScreen } from './StrategyDetailsScreen';
import { StrategyBrowserScreen } from './StrategyBrowserScreen';

interface StrategiesScreenProps {
  strategyManager: StrategyManager;
}

export function StrategiesScreen({ strategyManager }: StrategiesScreenProps) {
  const [strategies, setStrategies] = useState<BaseStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<BaseStrategy | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = () => {
    const allStrategies = strategyManager.getStrategies();
    setStrategies(allStrategies);
  };

  const toggleStrategy = (strategyId: string, enabled: boolean) => {
    if (enabled) {
      strategyManager.enableStrategy(strategyId);
    } else {
      strategyManager.disableStrategy(strategyId);
    }
    loadStrategies();
  };

  const handleConfigSave = (config: any) => {
    if (selectedStrategy) {
      selectedStrategy.updateConfig(config);
      loadStrategies();
    }
  };

  if (showConfig && selectedStrategy) {
    return (
      <StrategyConfigScreen 
        strategy={selectedStrategy}
        onSave={handleConfigSave}
        onBack={() => {
          setShowConfig(false);
          setSelectedStrategy(null);
        }}
      />
    );
  }

  if (showDetails && selectedStrategy) {
    return (
      <StrategyDetailsScreen 
        strategy={selectedStrategy}
        onBack={() => {
          setShowDetails(false);
          setSelectedStrategy(null);
        }}
      />
    );
  }

  if (showBrowser) {
    return (
      <StrategyBrowserScreen 
        onBack={() => setShowBrowser(false)}
        onAddStrategy={(strategyType) => {
          console.log('Add strategy:', strategyType);
          setShowBrowser(false);
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trading Strategies</Text>
        <Text style={styles.subtitle}>{strategies.length} available</Text>
      </View>

      {strategies.map((strategy) => (
        <Card key={strategy.getId()} style={styles.strategyCard}>
          <View style={styles.strategyHeader}>
            <View style={styles.strategyInfo}>
              <Text style={styles.strategyName}>{strategy.getName()}</Text>
              <Text style={styles.strategyDescription}>{strategy.getDescription()}</Text>
            </View>
            <Switch
              value={strategy.isEnabled()}
              onValueChange={(enabled) => toggleStrategy(strategy.getId(), enabled)}
            />
          </View>

          <View style={styles.strategyMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Positions</Text>
              <Text style={styles.metricValue}>{strategy.getPositions().length}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>P&L</Text>
              <Text style={[
                styles.metricValue, 
                { color: strategy.getTotalPnL() >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                ₹{strategy.getTotalPnL().toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.strategyActions}>
            <Button 
              title="Configure" 
              onPress={() => {
                setSelectedStrategy(strategy);
                setShowConfig(true);
              }} 
              variant="outline" 
              style={styles.actionButton}
            />
            <Button 
              title="View Details" 
              onPress={() => {
                setSelectedStrategy(strategy);
                setShowDetails(true);
              }} 
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </Card>
      ))}

      <Card style={styles.addStrategyCard}>
        <Text style={styles.addStrategyText}>Add New Strategy</Text>
        <Button 
          title="Browse Strategies" 
          onPress={() => setShowBrowser(true)} 
          variant="primary"
        />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 4,
  },
  strategyCard: {
    padding: 16,
    marginBottom: 12,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyInfo: {
    flex: 1,
    marginRight: 12,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  strategyMetrics: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  strategyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  addStrategyCard: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  addStrategyText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
});