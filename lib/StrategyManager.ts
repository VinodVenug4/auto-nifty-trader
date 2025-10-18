import { BaseStrategy, TradeSignal } from './strategies/BaseStrategy.ts';
import { StraddleStrategy } from './strategies/StraddleStrategy.ts';
import { FyersAPI } from './fyersApi.ts';
import { logger } from './logger.ts';
import { SecurityManager } from './security.ts';
import { StorageManager } from './storage.ts';

export class StrategyManager {
  private strategies: Map<string, BaseStrategy> = new Map();
  private fyersApi: FyersAPI;
  private isRunning: boolean = false;
  private executionInterval: NodeJS.Timeout | null = null;
  private storage = StorageManager.getInstance();

  constructor(fyersApi: FyersAPI) {
    this.fyersApi = fyersApi;
    this.initializeStrategies();
    this.isRunning = this.storage.getExecutionState();
  }

  private initializeStrategies(): void {
    // Register available strategies
    const straddleStrategy = new StraddleStrategy();
    this.strategies.set(straddleStrategy.getId(), straddleStrategy);
    
    // Restore saved states
    this.restoreStrategyStates();
  }

  private saveStrategyStates(): void {
    const states: Record<string, boolean> = {};
    this.strategies.forEach((strategy, id) => {
      states[id] = strategy.isEnabled();
    });
    this.storage.saveStrategyStates(states);
  }

  private restoreStrategyStates(): void {
    const states = this.storage.getStrategyStates();
    this.strategies.forEach((strategy, id) => {
      if (states[id] !== undefined) {
        strategy.setEnabled(states[id]);
      }
    });
  }

  getStrategies(): BaseStrategy[] {
    return Array.from(this.strategies.values());
  }

  getStrategy(id: string): BaseStrategy | undefined {
    return this.strategies.get(id);
  }

  enableStrategy(id: string): void {
    const strategy = this.strategies.get(id);
    if (strategy) {
      strategy.setEnabled(true);
      this.saveStrategyStates();
    }
  }

  disableStrategy(id: string): void {
    const strategy = this.strategies.get(id);
    if (strategy) {
      strategy.setEnabled(false);
      this.saveStrategyStates();
    }
  }

  enableAllStrategies(): void {
    for (const strategy of this.strategies.values()) {
      strategy.setEnabled(true);
    }
    this.saveStrategyStates();
  }

  disableAllStrategies(): void {
    for (const strategy of this.strategies.values()) {
      strategy.setEnabled(false);
    }
    this.saveStrategyStates();
  }

  async executeStrategies(): Promise<void> {
    if (!this.isRunning) return;

    const marketData = await this.getMarketData();
    const allSignals: TradeSignal[] = [];

    // Run all enabled strategies
    for (const strategy of this.strategies.values()) {
      if (strategy.isEnabled()) {
        try {
          const signals = await strategy.analyze(marketData);
          allSignals.push(...signals);
        } catch (error) {
          const securityManager = SecurityManager.getInstance();
          logger.error(`Strategy error: ${securityManager.sanitizeError(error)}`);
        }
      }
    }

    // Execute signals
    for (const signal of allSignals) {
      await this.executeSignal(signal);
    }
  }

  private async getMarketData(): Promise<any> {
    try {
      const niftyPrice = await this.fyersApi.getNiftyPrice();
      const currentTime = new Date().toLocaleTimeString('en-IN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      return {
        niftyPrice: niftyPrice || 24500, // Fallback price
        currentTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(`Market data error: ${securityManager.sanitizeError(error)}`);
      return {
        niftyPrice: 24500,
        currentTime: new Date().toLocaleTimeString('en-IN', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        timestamp: Date.now()
      };
    }
  }

  private async executeSignal(signal: TradeSignal): Promise<void> {
    try {
      if (signal.action === 'EXIT_ALL') {
        await this.fyersApi.exitAllPositions();
        logger.log('All positions exited');
      } else {
        await this.fyersApi.placeOrder({
          symbol: signal.symbol,
          qty: signal.quantity,
          type: signal.action,
          productType: 'INTRADAY',
          orderType: signal.orderType,
          price: signal.price
        });
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(`Order execution failed: ${securityManager.sanitizeError(error)}`);
    }
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.storage.saveExecutionState(true);
    
    // Execute strategies every 30 seconds
    this.executionInterval = setInterval(() => {
      this.executeStrategies();
    }, 30000);
    
    // Execute immediately
    this.executeStrategies();
  }

  stop(): void {
    this.isRunning = false;
    this.storage.saveExecutionState(false);
    
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}