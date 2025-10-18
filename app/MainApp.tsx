import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button } from '../lib/ui.tsx';
import { FyersAPI } from '../lib/fyersApi.ts';
import { StrategyManager } from '../lib/StrategyManager.ts';
import { DashboardScreen } from './screens/DashboardScreen.tsx';
import { StrategiesScreen } from './screens/StrategiesScreen.tsx';
import { PortfolioScreen } from './screens/PortfolioScreen.tsx';
import { SecureConfig } from '../lib/config.ts';
import { PaperTradingAPI } from '../lib/PaperTradingAPI.ts';
import { PositionsScreen } from './screens/PositionsScreen.tsx';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen.tsx';
import { RealPortfolioScreen } from './screens/RealPortfolioScreen.tsx';
import { RealOrderHistoryScreen } from './screens/RealOrderHistoryScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { OptionChainScreen } from './screens/OptionChainScreen.tsx';
import { StorageManager } from '../lib/storage.ts';

type Screen = 'dashboard' | 'strategies' | 'portfolio' | 'positions' | 'orders' | 'options' | 'settings';

interface MainAppProps {
  onLogout: () => void;
}

export function MainApp({ onLogout }: MainAppProps) {
  const storage = StorageManager.getInstance();
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => storage.getLastScreen() as Screen);
  const [fyersApi, setFyersApi] = useState<FyersAPI | null>(null);
  const [strategyManager, setStrategyManager] = useState<StrategyManager | null>(null);
  const [paperTradingApi, setPaperTradingApi] = useState<PaperTradingAPI | null>(null);
  const [isPaperMode, setIsPaperMode] = useState(() => storage.getTradingMode());

  useEffect(() => {
    initializeApp();
  }, []);

  // Reinitialize when mode changes
  useEffect(() => {
    if (fyersApi && paperTradingApi) {
      const tradingApi = isPaperMode ? paperTradingApi : fyersApi;
      const manager = new StrategyManager(tradingApi);
      setStrategyManager(manager);
    }
  }, [isPaperMode, fyersApi, paperTradingApi]);

  const handleModeToggle = (newMode: boolean) => {
    setIsPaperMode(newMode);
    storage.saveTradingMode(newMode);
  };

  const handleScreenChange = (screen: Screen) => {
    setCurrentScreen(screen);
    storage.saveLastScreen(screen);
  };

  const initializeApp = async () => {
    try {
      const secureConfig = SecureConfig.getInstance();
      if (secureConfig.hasCredentials()) {
        const config = await secureConfig.getCredentials();
        const api = new FyersAPI(config);
        const token = await getStoredToken();
        if (token) {
          api.setAccessToken(token);
        }
        setFyersApi(api);
        
        const paperApi = new PaperTradingAPI(api);
        setPaperTradingApi(paperApi);
        
        // Use paper or real API based on mode
        const tradingApi = isPaperMode ? paperApi : api;
        const manager = new StrategyManager(tradingApi);
        setStrategyManager(manager);
      } else {
        // No credentials, still initialize with dummy API for paper mode
        const dummyConfig = { appId: '', secretKey: '', redirectUri: '' };
        const api = new FyersAPI(dummyConfig);
        setFyersApi(api);
        
        const paperApi = new PaperTradingAPI(api);
        setPaperTradingApi(paperApi);
        
        const manager = new StrategyManager(paperApi);
        setStrategyManager(manager);
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      // Initialize with dummy values to prevent stuck loading
      const dummyConfig = { appId: '', secretKey: '', redirectUri: '' };
      const api = new FyersAPI(dummyConfig);
      setFyersApi(api);
      
      const paperApi = new PaperTradingAPI(api);
      setPaperTradingApi(paperApi);
      
      const manager = new StrategyManager(paperApi);
      setStrategyManager(manager);
    }
  };

  const getStoredToken = async (): Promise<string | null> => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('fyers_token');
      }
      // For React Native, use AsyncStorage or SecureStore
      const { getItemAsync } = require('expo-secure-store');
      return await getItemAsync('fyers_token');
    } catch (error) {
      console.log('No stored token found');
      return null;
    }
  };

  const renderScreen = () => {
    if (!fyersApi || !strategyManager || !paperTradingApi) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen 
          fyersApi={fyersApi} 
          strategyManager={strategyManager} 
          onNavigate={handleScreenChange}
          isPaperMode={isPaperMode}
        />;
      case 'strategies':
        return <StrategiesScreen strategyManager={strategyManager} fyersApi={fyersApi} />;
      case 'portfolio':
        return <PortfolioScreen fyersApi={fyersApi} />;
      case 'positions':
        return isPaperMode 
          ? <PositionsScreen paperTradingApi={paperTradingApi} onBack={() => handleScreenChange('dashboard')} />
          : <RealPortfolioScreen fyersApi={fyersApi} onBack={() => handleScreenChange('dashboard')} />;
      case 'orders':
        return isPaperMode
          ? <OrderHistoryScreen paperTradingApi={paperTradingApi} onBack={() => handleScreenChange('dashboard')} />
          : <RealOrderHistoryScreen fyersApi={fyersApi} onBack={() => handleScreenChange('dashboard')} />;
      case 'options':
        return <OptionChainScreen fyersApi={fyersApi} onBack={() => handleScreenChange('dashboard')} />;
      case 'settings':
        return (
          <SettingsScreen 
            key={`settings-${isPaperMode}`}
            onLogout={onLogout}
            isPaperMode={isPaperMode}
            onToggleMode={handleModeToggle}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Button
          title="Dashboard"
          onPress={() => handleScreenChange('dashboard')}
          variant={currentScreen === 'dashboard' ? 'primary' : 'ghost'}
          style={styles.navButton}
        />
        <Button
          title="Strategies"
          onPress={() => handleScreenChange('strategies')}
          variant={currentScreen === 'strategies' ? 'primary' : 'ghost'}
          style={styles.navButton}
        />
        <Button
          title={isPaperMode ? 'Positions' : 'Portfolio'}
          onPress={() => handleScreenChange('positions')}
          variant={currentScreen === 'positions' ? 'primary' : 'ghost'}
          style={styles.navButton}
        />
        <Button
          title="Options"
          onPress={() => handleScreenChange('options')}
          variant={currentScreen === 'options' ? 'primary' : 'ghost'}
          style={styles.navButton}
        />
        <Button
          title="Settings"
          onPress={() => handleScreenChange('settings')}
          variant={currentScreen === 'settings' ? 'primary' : 'ghost'}
          style={styles.navButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 1,
  },
});