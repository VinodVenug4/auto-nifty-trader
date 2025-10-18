import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from '../../lib/ui';

interface StrategyBrowserScreenProps {
  onBack: () => void;
  onAddStrategy: (strategyType: string) => void;
}

const availableStrategies = [
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    description: 'Neutral strategy with limited risk and reward',
    status: 'Coming Soon'
  },
  {
    id: 'butterfly',
    name: 'Butterfly Spread',
    description: 'Low volatility strategy for range-bound markets',
    status: 'Coming Soon'
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    description: 'Generate income from existing equity positions',
    status: 'Coming Soon'
  },
  {
    id: 'momentum',
    name: 'Momentum Strategy',
    description: 'Trend-following strategy based on price momentum',
    status: 'Coming Soon'
  }
];

export function StrategyBrowserScreen({ onBack, onAddStrategy }: StrategyBrowserScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Back" onPress={onBack} variant="ghost" />
        <Text style={styles.title}>Browse Strategies</Text>
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Strategy Library</Text>
        <Text style={styles.infoText}>
          Explore and add new trading strategies to your portfolio. 
          Each strategy comes with pre-configured parameters that you can customize.
        </Text>
      </Card>

      {availableStrategies.map((strategy) => (
        <Card key={strategy.id} style={styles.strategyCard}>
          <View style={styles.strategyHeader}>
            <View style={styles.strategyInfo}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
            </View>
            <Text style={styles.statusBadge}>{strategy.status}</Text>
          </View>
          
          <Button 
            title={strategy.status === 'Coming Soon' ? 'Coming Soon' : 'Add Strategy'}
            onPress={() => strategy.status !== 'Coming Soon' && onAddStrategy(strategy.id)}
            variant={strategy.status === 'Coming Soon' ? 'ghost' : 'primary'}
            disabled={strategy.status === 'Coming Soon'}
          />
        </Card>
      ))}

      <Card style={styles.customCard}>
        <Text style={styles.customTitle}>Custom Strategy</Text>
        <Text style={styles.customText}>
          Want to implement your own trading strategy? 
          Contact support for custom strategy development.
        </Text>
        <Button 
          title="Request Custom Strategy" 
          onPress={() => console.log('Custom strategy request')}
          variant="outline"
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
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
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
  statusBadge: {
    fontSize: 12,
    color: '#FFA726',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  customCard: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  customText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
});