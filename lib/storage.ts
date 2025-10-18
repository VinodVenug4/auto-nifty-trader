// Centralized storage manager for persistent data
export class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Trading Mode (Paper/Real)
  saveTradingMode(isPaperMode: boolean): void {
    this.setItem('trading_mode', isPaperMode);
  }

  getTradingMode(): boolean {
    return this.getItem('trading_mode', true);
  }

  // Strategy States (enabled/disabled)
  saveStrategyStates(states: Record<string, boolean>): void {
    this.setItem('strategy_states', states);
  }

  getStrategyStates(): Record<string, boolean> {
    return this.getItem('strategy_states', {});
  }

  // Strategy Configurations
  saveStrategyConfig(strategyId: string, config: any): void {
    const configs = this.getItem('strategy_configs', {});
    configs[strategyId] = config;
    this.setItem('strategy_configs', configs);
  }

  getStrategyConfig(strategyId: string): any {
    const configs = this.getItem('strategy_configs', {});
    return configs[strategyId];
  }

  // Paper Trading Data
  savePaperTradingData(data: {
    balance: number;
    positions: any[];
    trades: any[];
    pendingOrders?: any[];
  }): void {
    this.setItem('paper_trading_data', data);
  }

  getPaperTradingData(): {
    balance: number;
    positions: any[];
    trades: any[];
    pendingOrders: any[];
  } {
    return this.getItem('paper_trading_data', {
      balance: 100000,
      positions: [],
      trades: [],
      pendingOrders: []
    });
  }

  // Strategy Execution State
  saveExecutionState(isRunning: boolean): void {
    this.setItem('execution_state', isRunning);
  }

  getExecutionState(): boolean {
    return this.getItem('execution_state', false);
  }

  // Last Active Screen
  saveLastScreen(screen: string): void {
    this.setItem('last_screen', screen);
  }

  getLastScreen(): string {
    return this.getItem('last_screen', 'dashboard');
  }

  // User Preferences
  saveUserPreferences(prefs: {
    autoStart?: boolean;
    notifications?: boolean;
    theme?: string;
  }): void {
    const existing = this.getItem('user_preferences', {});
    this.setItem('user_preferences', { ...existing, ...prefs });
  }

  getUserPreferences(): any {
    return this.getItem('user_preferences', {
      autoStart: false,
      notifications: true,
      theme: 'dark'
    });
  }

  // Clear all data (logout/reset)
  clearAll(): void {
    if (typeof localStorage !== 'undefined') {
      const keysToKeep = ['fyers_credentials']; // Keep login credentials
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (key.startsWith('trading_') || key.startsWith('strategy_') || 
            key.startsWith('paper_') || key.startsWith('execution_') ||
            key.startsWith('user_')) {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        }
      });
    }
  }

  // Generic helpers
  private setItem(key: string, value: any): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Failed to save ${key}:`, error);
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch (error) {
      console.warn(`Failed to load ${key}:`, error);
    }
    return defaultValue;
  }
}