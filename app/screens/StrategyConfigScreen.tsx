import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput, Dropdown } from '../../lib/ui.tsx';
import { BaseStrategy } from '../../lib/strategies/BaseStrategy.ts';
import { FyersAPI } from '../../lib/fyersApi.ts';

interface StrategyConfigScreenProps {
  strategy: BaseStrategy;
  onSave: (config: any) => void;
  onBack: () => void;
  fyersApi?: FyersAPI;
}

export function StrategyConfigScreen({ strategy, onSave, onBack, fyersApi }: StrategyConfigScreenProps) {
  const [config, setConfig] = useState(strategy.getConfig());
  const [expiryOptions, setExpiryOptions] = useState<any[]>([]);
  const [niftyPrice, setNiftyPrice] = useState<number>(0);
  const [strikeData, setStrikeData] = useState<{ceStrike: number, peStrike: number, cePrice: number, pePrice: number} | null>(null);
  const [showStrikePreview, setShowStrikePreview] = useState(false);
  
  useEffect(() => {
    loadExpiryOptions();
    loadNiftyPrice();
  }, []);
  
  const loadNiftyPrice = async () => {
    if (!fyersApi) return;
    try {
      const quotes = await fyersApi.getQuotes(['NSE:NIFTY50-INDEX']);
      if (quotes && quotes.length > 0) {
        setNiftyPrice(quotes[0].ltp || 0);
      }
    } catch (error) {
      console.error('Failed to load NIFTY price:', error);
    }
  };
  
  const loadExpiryOptions = async () => {
    if (!fyersApi) {
      console.log('No fyersApi available');
      return;
    }
    
    try {
      console.log('Loading expiry options...');
      const optionChain = await fyersApi.getOptionChain('NSE:NIFTY50-INDEX', 5);
      console.log('Option chain response:', optionChain);
      
      if (optionChain && optionChain.expiryData && optionChain.expiryData.length > 0) {
        console.log('Expiry data found:', optionChain.expiryData);
        const options: any[] = [];
        const today = new Date();
        let monthlyExpiry = null;
        
        // Sort expiry dates and find the last one in current month
        const sortedExpiries = optionChain.expiryData
          .filter((exp: any) => exp.date)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
          });
        
        console.log('Sorted expiries:', sortedExpiries);
        
        sortedExpiries.forEach((exp: any) => {
          const date = new Date(exp.date.split('-').reverse().join('-'));
          const label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          options.push({ label, value: exp.date });
          
          // Find last expiry in current month
          if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            monthlyExpiry = exp.date;
          }
        });
        
        console.log('Final options:', options);
        console.log('Monthly expiry found:', monthlyExpiry);
        
        // Limit to next 6 expiry dates
        const futureOptions = options.filter((opt: any) => {
          const optDate = new Date(opt.value.split('-').reverse().join('-'));
          return optDate >= today;
        }).slice(0, 6);
        
        setExpiryOptions(futureOptions);
        
        // Set default to monthly expiry (last date in current month) or first available
        const defaultExpiry = monthlyExpiry || (options.length > 0 ? options[0].value : null);
        if (defaultExpiry && (!config.parameters.selectedExpiry || config.parameters.selectedExpiry === 'monthly')) {
          console.log('Setting default expiry:', defaultExpiry);
          updateParameter('selectedExpiry', defaultExpiry);
        }
      } else {
        console.log('No expiry data found in response');
      }
    } catch (error) {
      console.error('Failed to load expiry options:', error);
    }
  };

  const updateParameter = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    onSave(config);
    await loadStrikePreview();
    setShowStrikePreview(true);
  };
  
  const loadStrikePreview = async () => {
    if (!fyersApi || !niftyPrice) return;
    
    try {
      const referenceStrike = Math.round(niftyPrice / 50) * 50;
      const atr = config.parameters.atr || 150;
      const atrMultiplier = config.parameters.atrMultiplier || 1;
      const adjustedAtr = Math.round((atr * atrMultiplier) / 50) * 50;
      
      const ceStrike = referenceStrike + adjustedAtr;
      const peStrike = referenceStrike - adjustedAtr;
      
      // Construct symbols using Fyers format: NSE:NIFTY{YY}{MONTH_CODE}{DD}{STRIKE}{CE/PE}
      const selectedExpiry = config.parameters.selectedExpiry;
      let expiryStr = '';
      
      if (selectedExpiry && selectedExpiry !== 'monthly') {
        const [day, month, year] = selectedExpiry.split('-');
        const monthCodes = ['', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        const monthCode = monthCodes[parseInt(month)] || 'O';
        expiryStr = `${year.slice(2)}${monthCode}${day}`;
      } else {
        // Default to current month expiry
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const lastThursday = new Date(year, month, 0);
        lastThursday.setDate(lastThursday.getDate() - ((lastThursday.getDay() + 3) % 7));
        const day = lastThursday.getDate().toString().padStart(2, '0');
        const monthCodes = ['', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        const monthCode = monthCodes[month] || 'O';
        expiryStr = `${year.toString().slice(2)}${monthCode}${day}`;
      }
      
      const ceSymbol = `NSE:NIFTY${expiryStr}${ceStrike}CE`;
      const peSymbol = `NSE:NIFTY${expiryStr}${peStrike}PE`;
      
      const quotes = await fyersApi.getQuotes([ceSymbol, peSymbol]);
      console.log('Fetching quotes for:', ceSymbol, peSymbol);
      console.log('Quote response:', quotes);
      
      setStrikeData({
        ceStrike,
        peStrike,
        cePrice: quotes[0]?.ltp || 0,
        pePrice: quotes[1]?.ltp || 0
      });
    } catch (error) {
      console.error('Failed to load strike preview:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
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
          onChangeText={(value) => updateParameter('atrMultiplier', parseFloat(value) || 1)}
          placeholder="1"
          keyboardType="numeric"
        />
        
        <Dropdown
          label="Selected Expiry"
          value={expiryOptions.find(opt => opt.value === config.parameters.selectedExpiry)?.label || 'Loading...'}
          options={expiryOptions}
          onSelect={(value) => updateParameter('selectedExpiry', value)}
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

      {niftyPrice > 0 && (
        <Card style={styles.previewCard}>
          <Text style={styles.sectionTitle}>Strike Calculation Preview</Text>
          <Text style={styles.previewText}>
            Current NIFTY: {niftyPrice.toFixed(2)}{'\n'}
            ATR: {config.parameters.atr || 150} × {config.parameters.atrMultiplier || 1} = {Math.round(((config.parameters.atr || 150) * (config.parameters.atrMultiplier || 1)) / 50) * 50}{'\n'}
            Reference Strike: {Math.round(niftyPrice / 50) * 50}{'\n'}
            CE Strike: {Math.round(niftyPrice / 50) * 50 + Math.round(((config.parameters.atr || 150) * (config.parameters.atrMultiplier || 1)) / 50) * 50}{'\n'}
            PE Strike: {Math.round(niftyPrice / 50) * 50 - Math.round(((config.parameters.atr || 150) * (config.parameters.atrMultiplier || 1)) / 50) * 50}
          </Text>
        </Card>
      )}
      
      {showStrikePreview && strikeData && (
        <Card style={styles.strikeCard}>
          <Text style={styles.sectionTitle}>Selected Strikes & Prices</Text>
          <View style={styles.strikeRow}>
            <View style={styles.strikeItem}>
              <Text style={styles.strikeLabel}>Call Option (CE)</Text>
              <Text style={styles.strikeValue}>{strikeData.ceStrike}</Text>
              <Text style={styles.priceValue}>₹{strikeData.cePrice.toFixed(2)}</Text>
            </View>
            <View style={styles.strikeItem}>
              <Text style={styles.strikeLabel}>Put Option (PE)</Text>
              <Text style={styles.strikeValue}>{strikeData.peStrike}</Text>
              <Text style={styles.priceValue}>₹{strikeData.pePrice.toFixed(2)}</Text>
            </View>
          </View>
          <Text style={styles.totalPremium}>
            Total Premium: ₹{(strikeData.cePrice + strikeData.pePrice).toFixed(2)}
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        <Button title="Save Configuration" onPress={handleSave} variant="primary" />
        <Button title="Reset to Default" onPress={() => { setConfig(strategy.getConfig()); setShowStrikePreview(false); }} variant="outline" />
        {showStrikePreview && (
          <Button title="Continue" onPress={onBack} variant="success" />
        )}
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
  strikeCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#1E3A8A',
  },
  strikeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  strikeItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  strikeLabel: {
    fontSize: 12,
    color: '#93C5FD',
    marginBottom: 4,
  },
  strikeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: '#4ADE80',
    fontWeight: '600',
  },
  totalPremium: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FBBF24',
    textAlign: 'center',
    marginTop: 8,
  },
});