import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Row, TextInput, Switch, PositionCard, styles } from '../lib/ui';
import { FyersAPI } from '../lib/fyersApi';
import { TradingEngine } from '../lib/trading';
import { TradingScheduler } from '../lib/scheduler';

const fyersConfig = {
  appId: 'YOUR_FYERS_APP_ID-100', // Include -100 suffix
  secretKey: 'YOUR_FYERS_SECRET_KEY',
  redirectUri: 'https://trade.fyers.in/api-login/redirect-to-app' // Fyers standard redirect
};

const fyersApi = new FyersAPI(fyersConfig);
const tradingEngine = new TradingEngine(true);

export default function HomeScreen() {
  const [atr, setAtr] = useState('');
  const [isAutomationActive, setIsAutomationActive] = useState(false);
  const [isPaperMode, setIsPaperMode] = useState(true);
  const [niftyPrice, setNiftyPrice] = useState(19850);
  const [totalPnL, setTotalPnL] = useState(0);
  const [positions, setPositions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scheduler, setScheduler] = useState<TradingScheduler | null>(null);
  const [realTimePrice, setRealTimePrice] = useState(false);
  const [nextEntryTime, setNextEntryTime] = useState('09:20 AM');
  const [nextExitTime, setNextExitTime] = useState('15:00 PM');

  const startAutomation = async () => {
    try {
      if (!atr) {
        Alert.alert('Error', 'Please enter ATR value');
        return;
      }
      
      if (!isPaperMode && !isLoggedIn) {
        Alert.alert('Error', 'Please login to Fyers for live trading');
        return;
      }

      if (tradingEngine) {
        tradingEngine.setPaperMode(isPaperMode);
        tradingEngine.setActive(true);
      }
      
      const newScheduler = new TradingScheduler(
        () => executeEntry(),
        () => executeExit()
      );
      
      const times = newScheduler.scheduleToday();
      setScheduler(newScheduler);
      setIsAutomationActive(true);
      
      Alert.alert('Success', 
        `Automation started in ${isPaperMode ? 'Paper' : 'Live'} mode\n` +
        `Next Entry: ${times.entryTime}\n` +
        `Next Exit: ${times.exitTime}`
      );
    } catch (error) {
      console.error('Error starting automation:', error);
      Alert.alert('Error', 'Failed to start automation');
    }
  };

  const stopAutomation = () => {
    if (scheduler) {
      scheduler.clearSchedule();
      setScheduler(null);
    }
    tradingEngine.setActive(false);
    setIsAutomationActive(false);
    Alert.alert('Info', 'Automation stopped');
  };

  const exitPosition = async (positionId: string) => {
    Alert.alert('Confirm', 'Exit this position?', [
      { text: 'Cancel' },
      { text: 'Exit', onPress: async () => {
        try {
          if (!isPaperMode && fyersApi.isAuthenticated()) {
            // Place sell order via Fyers API
            const position = positions.find((p: any) => p.id === positionId);
            if (position) {
              await fyersApi.placeOrder({
                symbol: position.symbol,
                qty: position.qty,
                type: 'SELL',
                productType: 'INTRADAY',
                orderType: 'MARKET'
              });
            }
          }
          
          // Remove from local positions
          setPositions(prev => prev.filter((p: any) => p.id !== positionId));
          Alert.alert('Success', 'Position exited successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to exit position');
        }
      }}
    ]);
  };

  const exitAllPositions = async () => {
    Alert.alert('Confirm', 'Exit all positions?', [
      { text: 'Cancel' },
      { text: 'Exit All', onPress: async () => {
        try {
          await executeExit();
          Alert.alert('Success', 'All positions exited successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to exit all positions');
        }
      }}
    ]);
  };

  const executeEntry = async () => {
    try {
      const currentNifty = await (fyersApi && fyersApi.isAuthenticated() ? 
        fyersApi.getNiftyPrice() : 
        Promise.resolve(niftyPrice)
      );
      
      const atrValue = parseFloat(atr);
      if (!tradingEngine) {
        throw new Error('Trading engine not initialized');
      }
      
      const newPositions = await tradingEngine.executeEntry(currentNifty, atrValue);
      
      if (newPositions) {
        setPositions(prev => [...prev, newPositions.cePosition, newPositions.pePosition]);
        
        if (!isPaperMode && fyersApi && fyersApi.isAuthenticated()) {
          // Place actual orders
          try {
            await fyersApi.placeOrder({
              symbol: newPositions.cePosition.symbol,
              qty: 75,
              type: 'BUY',
              productType: 'INTRADAY',
              orderType: 'MARKET'
            });
            
            await fyersApi.placeOrder({
              symbol: newPositions.pePosition.symbol,
              qty: 75,
              type: 'BUY',
              productType: 'INTRADAY',
              orderType: 'MARKET'
            });
          } catch (orderError) {
            console.error('Order placement failed:', orderError);
          }
        }
        
        Alert.alert('Entry Executed', 
          `Positions opened:\n` +
          `CE: ${newPositions.cePosition.symbol}\n` +
          `PE: ${newPositions.pePosition.symbol}`
        );
      }
    } catch (error) {
      console.error('Error executing entry:', error);
      Alert.alert('Error', 'Failed to execute entry');
    }
  };

  const executeExit = async () => {
    try {
      const exitedPositions = await tradingEngine.executeExit();
      
      if (!isPaperMode && fyersApi.isAuthenticated()) {
        // Place exit orders for all positions
        for (const position of positions) {
          await fyersApi.placeOrder({
            symbol: position.symbol,
            qty: position.qty,
            type: 'SELL',
            productType: 'INTRADAY',
            orderType: 'MARKET'
          });
        }
      }
      
      setPositions([]);
      Alert.alert('Exit Executed', 'All positions closed');
    } catch (error) {
      Alert.alert('Error', 'Failed to execute exit');
    }
  };

  // Check login status and update prices
  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout | null = null;
    
    const checkLoginStatus = async () => {
      try {
        if (typeof localStorage !== 'undefined') {
          const token = localStorage.getItem('fyers_token');
          if (token && isMounted) {
            if (fyersApi) {
              fyersApi.setAccessToken(token);
              setIsLoggedIn(true);
              setRealTimePrice(true);
              
              // Get real NIFTY price
              try {
                const price = await fyersApi.getNiftyPrice();
                if (price && price > 0 && isMounted) {
                  setNiftyPrice(price);
                }
              } catch (error) {
                console.error('Failed to get NIFTY price:', error);
                if (isMounted) {
                  setRealTimePrice(false);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in checkLoginStatus:', error);
      }
    };
    
    checkLoginStatus();
    
    // Update positions and prices periodically
    interval = setInterval(async () => {
      if (!isMounted) return;
      
      try {
        if (positions.length > 0) {
          tradingEngine.updatePositions({});
          if (isMounted) {
            setPositions([...tradingEngine.getPositions()]);
            setTotalPnL(tradingEngine.getTotalPnL());
          }
        }
        
        // Update NIFTY price if authenticated
        if (isLoggedIn && realTimePrice && fyersApi) {
          try {
            const price = await fyersApi.getNiftyPrice();
            if (price && price > 0 && isMounted) {
              setNiftyPrice(price);
            }
          } catch (error) {
            console.error('Failed to update NIFTY price:', error);
            if (isMounted) {
              setRealTimePrice(false);
            }
          }
        }
      } catch (error) {
        console.error('Error in interval update:', error);
      }
    }, 10000); // Update every 10 seconds
    
    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>Trading Dashboard</Text>
        <Row>
          <View style={{ flex: 1 }}>
            <Text>NIFTY 50: ₹{niftyPrice.toFixed(2)}</Text>
            <Text style={{ fontSize: 10, opacity: 0.6 }}>
              {realTimePrice ? 'Live Price' : 'Mock Price'}
            </Text>
          </View>
          <Text style={{ color: totalPnL >= 0 ? '#059669' : '#dc2626', fontWeight: '700' }}>
            Total P&L: ₹{totalPnL.toFixed(2)}
          </Text>
        </Row>
        <Row>
          <Text style={{ fontSize: 12, opacity: 0.8 }}>Fyers Status:</Text>
          <Text style={{ 
            fontSize: 12, 
            color: isLoggedIn ? '#059669' : '#dc2626',
            fontWeight: '700'
          }}>
            {isLoggedIn ? '✅ Connected' : '❌ Not Connected'}
          </Text>
        </Row>
      </Card>

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Configuration</Text>
        <TextInput 
          label="Previous Day ATR" 
          value={atr} 
          onChangeText={setAtr}
          placeholder="Enter ATR value"
          keyboardType="numeric"
        />
        <Switch 
          label="Paper Mode" 
          value={isPaperMode} 
          onValueChange={setIsPaperMode}
        />
        <Row>
          <Text>Entry: {nextEntryTime}</Text>
          <Text>Exit: {nextExitTime}</Text>
        </Row>
      </Card>

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Automation Control</Text>
        <Row>
          {!isAutomationActive ? (
            <Button title="Start Automation" onPress={startAutomation} />
          ) : (
            <Button title="Stop Automation" variant="danger" onPress={stopAutomation} />
          )}
          <Button title="Exit All" variant="secondary" onPress={exitAllPositions} />
        </Row>
      </Card>

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Active Positions</Text>
        {positions.length === 0 ? (
          <Text style={{ opacity: 0.6, textAlign: 'center', padding: 20 }}>No active positions</Text>
        ) : (
          positions.map((position: any) => (
            <PositionCard key={position.id} position={position} onExit={exitPosition} />
          ))
        )}
      </Card>
    </ScrollView>
  );
}