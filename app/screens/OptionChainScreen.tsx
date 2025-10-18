import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button } from '../../lib/ui.tsx';
import { FyersAPI } from '../../lib/fyersApi.ts';

interface OptionChainScreenProps {
  fyersApi: FyersAPI;
  onBack?: () => void;
}

interface OptionData {
  strike: number;
  callLtp: number;
  callOi: number;
  callVolume: number;
  putLtp: number;
  putOi: number;
  putVolume: number;
  callSymbol: string;
  putSymbol: string;
}

export function OptionChainScreen({ fyersApi, onBack }: OptionChainScreenProps) {
  const [optionChain, setOptionChain] = useState<OptionData[]>([]);
  const [underlyingPrice, setUnderlyingPrice] = useState(0);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [expiryDates, setExpiryDates] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [symbolInput, setSymbolInput] = useState('NIFTY');
  const [allOptionData, setAllOptionData] = useState<any[]>([]);
  
  const symbolOptions = [
    { label: 'NIFTY', value: 'NSE:NIFTY50-INDEX' },
    { label: 'BANKNIFTY', value: 'NSE:NIFTYBANK-INDEX' },
    { label: 'FINNIFTY', value: 'NSE:NIFTYFIN-INDEX' },
    { label: 'MIDCPNIFTY', value: 'NSE:NIFTYMIDCAP-INDEX' }
  ];

  useEffect(() => {
    loadOptionChain();
  }, [selectedSymbol]);
  
  useEffect(() => {
    processOptionData();
  }, [selectedExpiry]);

  const loadOptionChain = async () => {
    try {
      setLoading(true);
      const data = await fyersApi.getOptionChain(selectedSymbol, 10);
      
      console.log('Option chain data received:', data);
      
      if (data) {
        setUnderlyingPrice(data.underlyingPrice || 0);
        
        // Get all option chain data (don't filter by expiry initially)
        const filteredData = data.optionsChain && Array.isArray(data.optionsChain) ? 
          data.optionsChain.filter((item: any) => item.option_type && (item.option_type === 'CE' || item.option_type === 'PE')) : [];
        
        // Extract expiry dates directly from option symbols
        const symbolExpiries = new Set<string>();
        console.log('Extracting expiries from', filteredData.length, 'options');
        filteredData.forEach((item: any, index: number) => {
          if (index < 3) console.log('Sample symbol:', item.symbol); // Log first 3 symbols
          const match = item.symbol?.match(/(\d{2}[A-Z]{3})/);
          if (match) {
            symbolExpiries.add(match[1]); // e.g., "25OCT"
            if (index < 3) console.log('Extracted expiry:', match[1]);
          }
        });
        
        const expiries = Array.from(symbolExpiries).sort();
        setExpiryDates(expiries);
        console.log('Final expiries for', symbolInput + ':', expiries);
        
        console.log('Filtered option data:', filteredData.length, 'items');
        console.log('Sample option item:', filteredData[0]);
        
        setAllOptionData(filteredData);
        processOptionData(filteredData);
        
        // Store data globally for expiry formatting
        (window as any).optionChainData = data;
      } else {
        setOptionChain([]);
        setExpiryDates([]);
        setAllOptionData([]);
      }
    } catch (error) {
      console.error('Failed to load option chain:', error);
      console.error('Error details:', error);
      setOptionChain([]);
      setExpiryDates([]);
      setUnderlyingPrice(0);
      setAllOptionData([]);
    } finally {
      setLoading(false);
    }
  };
  
  const processOptionData = (dataToFilter?: any[]) => {
    const dataSource = dataToFilter || allOptionData;
    if (!dataSource || dataSource.length === 0) {
      setOptionChain([]);
      return;
    }
    
    // Filter by selected expiry if one is selected
    const filteredData = selectedExpiry ? 
      dataSource.filter((item: any) => {
        // Extract expiry from symbol like "NSE:BANKNIFTY25OCT56700CE"
        const match = item.symbol?.match(/(\d{2}[A-Z]{3})/); 
        if (match) {
          const symbolExpiry = match[1]; // e.g., "25OCT"
          return symbolExpiry === selectedExpiry; // Direct string comparison
        }
        return false;
      }) : 
      dataSource;
    
    console.log('Processing option data:', filteredData.length, 'items', selectedExpiry ? 'for expiry' : 'all data');
    
    // Group by strike price
    const strikeMap = new Map<number, OptionData>();
        
    filteredData.forEach((item: any) => {
      if (item && typeof item.strike_price === 'number') {
        const strike = item.strike_price;
        if (!strikeMap.has(strike)) {
          strikeMap.set(strike, {
            strike,
            callLtp: 0,
            callOi: 0,
            callVolume: 0,
            putLtp: 0,
            putOi: 0,
            putVolume: 0,
            callSymbol: '',
            putSymbol: ''
          });
        }
        
        const option = strikeMap.get(strike)!;
        if (item.option_type === 'CE') {
          option.callLtp = item.ltp || 0;
          option.callOi = item.oi || 0;
          option.callVolume = item.volume || 0;
          option.callSymbol = item.symbol || '';
        } else if (item.option_type === 'PE') {
          option.putLtp = item.ltp || 0;
          option.putOi = item.oi || 0;
          option.putVolume = item.volume || 0;
          option.putSymbol = item.symbol || '';
        }
      }
    });
    
    // Convert to array and sort by strike
    const chainArray = Array.from(strikeMap.values()).sort((a, b) => a.strike - b.strike);
    console.log('Final option chain:', chainArray.length, 'strikes');
    setOptionChain(chainArray);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOptionChain();
    setRefreshing(false);
  };

  const isAtmStrike = (strike: number): boolean => {
    return Math.abs(strike - underlyingPrice) <= 50; // Within 50 points of ATM
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <View style={styles.header}>
          <Button title="← Back" onPress={onBack} variant="ghost" />
          <Text style={styles.title}>Option Chain</Text>
          <Button title="Refresh" onPress={onRefresh} variant="ghost" />
        </View>
      )}

      <Card style={styles.summaryCard}>
        <View style={styles.symbolSelector}>
          <Text style={styles.symbolLabel}>Symbol:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.symbolScroll}>
            {symbolOptions.map((option) => (
              <Button
                key={option.value}
                title={option.label}
                onPress={() => {
                  setSelectedSymbol(option.value);
                  setSymbolInput(option.label);
                }}
                variant={selectedSymbol === option.value ? 'primary' : 'ghost'}
                style={styles.symbolButton}
              />
            ))}
          </ScrollView>
        </View>
        <Text style={styles.sectionTitle}>{symbolInput}</Text>
        <Text style={styles.underlyingPrice}>₹{underlyingPrice.toFixed(2)}</Text>
        
        <View style={styles.expiryContainer}>
          <Text style={styles.expiryLabel}>Expiry: ({expiryDates.length} found)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expiryScroll}>
            <Button
              title="All"
              onPress={() => {
                console.log('Selected: All expiries');
                setSelectedExpiry('');
              }}
              variant={!selectedExpiry ? 'primary' : 'ghost'}
              style={styles.expiryButton}
            />
            {expiryDates.map((expiry) => (
              <Button
                key={expiry}
                title={expiry}
                onPress={() => {
                  console.log('Selected expiry:', expiry);
                  setSelectedExpiry(expiry);
                }}
                variant={selectedExpiry === expiry ? 'primary' : 'ghost'}
                style={styles.expiryButton}
              />
            ))}
          </ScrollView>
        </View>
      </Card>

      <View style={styles.chainHeader}>
        <View style={styles.headerRow}>
          <View style={styles.callHeader}>
            <Text style={styles.headerText}>CALL</Text>
          </View>
          <View style={styles.strikeHeader}>
            <Text style={styles.headerText}>STRIKE</Text>
          </View>
          <View style={styles.putHeader}>
            <Text style={styles.headerText}>PUT</Text>
          </View>
        </View>
        <View style={styles.subHeaderRow}>
          <View style={styles.callSubHeader}>
            <Text style={styles.subHeaderText}>LTP</Text>
            <Text style={styles.subHeaderText}>OI</Text>
            <Text style={styles.subHeaderText}>VOL</Text>
          </View>
          <View style={styles.strikeSubHeader} />
          <View style={styles.putSubHeader}>
            <Text style={styles.subHeaderText}>LTP</Text>
            <Text style={styles.subHeaderText}>OI</Text>
            <Text style={styles.subHeaderText}>VOL</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.chainContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading option chain...</Text>
          </View>
        ) : optionChain.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No option data available</Text>
            <Text style={styles.emptySubtext}>Please check your connection and try refreshing</Text>
          </Card>
        ) : (
          optionChain.map((option) => (
            <View 
              key={option.strike} 
              style={[
                styles.optionRow,
                isAtmStrike(option.strike) && styles.atmRow
              ]}
            >
              <View style={styles.callData}>
                <Text style={[styles.dataText, styles.ltpText]}>
                  {option.callLtp > 0 ? option.callLtp.toFixed(2) : '-'}
                </Text>
                <Text style={styles.dataText}>
                  {option.callOi > 0 ? (option.callOi / 1000).toFixed(0) + 'K' : '-'}
                </Text>
                <Text style={styles.dataText}>
                  {option.callVolume > 0 ? (option.callVolume / 1000).toFixed(0) + 'K' : '-'}
                </Text>
              </View>
              
              <View style={[styles.strikeData, isAtmStrike(option.strike) && styles.atmStrike]}>
                <Text style={[styles.strikeText, isAtmStrike(option.strike) && styles.atmStrikeText]}>
                  {option.strike}
                </Text>
              </View>
              
              <View style={styles.putData}>
                <Text style={[styles.dataText, styles.ltpText]}>
                  {option.putLtp > 0 ? option.putLtp.toFixed(2) : '-'}
                </Text>
                <Text style={styles.dataText}>
                  {option.putOi > 0 ? (option.putOi / 1000).toFixed(0) + 'K' : '-'}
                </Text>
                <Text style={styles.dataText}>
                  {option.putVolume > 0 ? (option.putVolume / 1000).toFixed(0) + 'K' : '-'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryCard: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  underlyingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: 8,
  },
  expiryContainer: {
    marginTop: 16,
  },
  expiryLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  expiryScroll: {
    flexDirection: 'row',
  },
  symbolSelector: {
    marginBottom: 16,
  },
  symbolLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  symbolScroll: {
    flexDirection: 'row',
  },
  symbolButton: {
    marginRight: 8,
    minWidth: 80,
  },
  expiryButton: {
    marginRight: 8,
    minWidth: 60,
  },
  chainHeader: {
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  subHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  callHeader: {
    flex: 1,
    alignItems: 'center',
  },
  strikeHeader: {
    width: 80,
    alignItems: 'center',
  },
  putHeader: {
    flex: 1,
    alignItems: 'center',
  },
  callSubHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  strikeSubHeader: {
    width: 80,
  },
  putSubHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subHeaderText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  chainContainer: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  atmRow: {
    backgroundColor: '#1A2B1A',
  },
  callData: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  strikeData: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atmStrike: {
    backgroundColor: '#2E4F2E',
    borderRadius: 4,
    paddingVertical: 4,
  },
  putData: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dataText: {
    fontSize: 12,
    color: '#CCCCCC',
    minWidth: 40,
    textAlign: 'center',
  },
  ltpText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  strikeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  atmStrikeText: {
    color: '#4CAF50',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
});