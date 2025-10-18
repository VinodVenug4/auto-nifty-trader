import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput } from '../../lib/ui';
import { BaseStrategy } from '../../lib/strategies/BaseStrategy';

interface StrategyConfigScreenProps {
  strategy: BaseStrategy;
  onSave: (config: any) => void;
  onBack: () => void;
}

export function StrategyConfigScreen({ strategy, onSave, onBack }: StrategyConfigScreenProps) {
  const [config, setConfig] = useState(strategy.getConfig());

  const updateParameter = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(config);
    onBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Back" onPress={onBack} variant="ghost" />
        <Text style={styles.title}>{strategy.getName()}</Text>
      </View>

      <Card style={styles.configCard}>
        <Text style={styles.sectionTitle}>Strategy Parameters</Text>
        
        <TextInput
          label="Entry Time"
          value={config.parameters.entryTime}
          onChangeText={(value) => updateParameter('entryTime', value)}
          placeholder="09:20"
        />
        
        <TextInput
          label="Exit Time"
          value={config.parameters.exitTime}
          onChangeText={(value) => updateParameter('exitTime', value)}
          placeholder="15:00"
        />
        
        <TextInput
          label="Quantity"
          value={config.parameters.quantity?.toString()}
          onChangeText={(value) => updateParameter('quantity', parseInt(value) || 0)}
          placeholder="50"
          keyboardType="numeric"
        />
        
        <TextInput
          label="ATR Value"
          value={config.parameters.atr?.toString()}
          onChangeText={(value) => updateParameter('atr', parseFloat(value) || 0)}
          placeholder="150"
          keyboardType="numeric"
        />
        
        <TextInput
          label="ATR Multiplier"
          value={config.parameters.atrMultiplier?.toString()}
          onChangeText={(value) => updateParameter('atrMultiplier', parseFloat(value) || 1.5)}
          placeholder="1.5"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Max Loss (₹)"
          value={config.parameters.maxLoss?.toString()}
          onChangeText={(value) => updateParameter('maxLoss', parseInt(value) || 0)}
          placeholder="5000"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Target Profit (₹)"
          value={config.parameters.targetProfit?.toString()}
          onChangeText={(value) => updateParameter('targetProfit', parseInt(value) || 0)}
          placeholder="3000"
          keyboardType="numeric"
        />
      </Card>

      <Card style={styles.previewCard}>
        <Text style={styles.sectionTitle}>Strike Calculation Preview</Text>
        <Text style={styles.previewText}>
          Current NIFTY: 24,500 (example){'\n'}
          ATR: {config.parameters.atr || 150}{'\n'}
          Strike Range: {Math.round(24500 / 50) * 50 - (config.parameters.atr || 150)} to {Math.round(24500 / 50) * 50 + (config.parameters.atr || 150)}{'\n'}
          Selected Strike: {Math.round(24500 / 50) * 50}
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button title="Save Configuration" onPress={handleSave} variant="primary" />
        <Button title="Reset to Default" onPress={() => setConfig(strategy.getConfig())} variant="outline" />
      </View>
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
  configCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  previewCard: {
    padding: 16,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
});