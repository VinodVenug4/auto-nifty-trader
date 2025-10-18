# Developer Guide - Auto NIFTY Trader

## 🏗️ Adding New Trading Strategies

### Step 1: Create Strategy Class

Create a new file in `lib/strategies/` directory:

```typescript
// lib/strategies/MyNewStrategy.ts
import { BaseStrategy, StrategyConfig, TradeSignal, Position } from './BaseStrategy';

export class MyNewStrategy extends BaseStrategy {
  constructor() {
    const config: StrategyConfig = {
      id: 'my-new-strategy',
      name: 'My New Strategy',
      description: 'Description of what this strategy does',
      enabled: false,
      parameters: {
        // Define your strategy parameters
        entryTime: '09:30',
        exitTime: '15:15',
        quantity: 25,
        riskPercent: 2,
        // Add custom parameters
        customParam1: 100,
        customParam2: 'value'
      }
    };
    super(config);
  }

  async analyze(marketData: any): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    
    // Implement your strategy logic here
    const { niftyPrice, currentTime } = marketData;
    
    // Example entry condition
    if (this.shouldEnter(marketData)) {
      signals.push({
        action: 'BUY',
        symbol: 'NSE:NIFTY24350CE',
        quantity: this.config.parameters.quantity,
        orderType: 'MARKET',
        reason: 'Entry condition met'
      });
    }
    
    // Example exit condition
    if (this.shouldExit(marketData)) {
      signals.push({
        action: 'SELL',
        symbol: 'NSE:NIFTY24350CE',
        quantity: this.config.parameters.quantity,
        orderType: 'MARKET',
        reason: 'Exit condition met'
      });
    }
    
    return signals;
  }

  onPositionUpdate(positions: Position[]): void {
    this.positions = positions;
    
    // Handle position updates
    // Check for stop loss, target profit, etc.
    const totalPnL = this.getTotalPnL();
    
    if (totalPnL <= -this.config.parameters.maxLoss) {
      // Trigger emergency exit
    }
  }

  getRequiredData(): string[] {
    // Return list of data required by this strategy
    return ['NIFTY50-INDEX', 'TIME', 'VOLATILITY'];
  }

  validateConfig(): boolean {
    // Validate strategy configuration
    const params = this.config.parameters;
    return !!(params.entryTime && params.exitTime && params.quantity > 0);
  }

  // Custom methods for your strategy
  private shouldEnter(marketData: any): boolean {
    // Implement your entry logic
    const { niftyPrice, currentTime } = marketData;
    
    // Example: Enter at specific time
    if (currentTime === this.config.parameters.entryTime) {
      return true;
    }
    
    return false;
  }

  private shouldExit(marketData: any): boolean {
    // Implement your exit logic
    const { currentTime } = marketData;
    
    // Example: Exit at specific time
    if (currentTime === this.config.parameters.exitTime) {
      return true;
    }
    
    return false;
  }
}
```

### Step 2: Register Strategy in StrategyManager

Update `lib/StrategyManager.ts`:

```typescript
import { MyNewStrategy } from './strategies/MyNewStrategy';

export class StrategyManager {
  // ... existing code ...

  private initializeStrategies(): void {
    // Register existing strategies
    const straddleStrategy = new StraddleStrategy();
    this.strategies.set(straddleStrategy.getId(), straddleStrategy);
    
    // Register your new strategy
    const myNewStrategy = new MyNewStrategy();
    this.strategies.set(myNewStrategy.getId(), myNewStrategy);
  }
}
```

### Step 3: Add Strategy Configuration (Optional)

If your strategy needs custom configuration UI, update `app/screens/StrategyConfigScreen.tsx`:

```typescript
// Add custom parameter inputs based on strategy type
const renderCustomParameters = () => {
  if (strategy.getId() === 'my-new-strategy') {
    return (
      <>
        <TextInput
          label="Custom Parameter 1"
          value={config.parameters.customParam1?.toString()}
          onChangeText={(value) => updateParameter('customParam1', parseInt(value) || 0)}
          keyboardType="numeric"
        />
        <TextInput
          label="Custom Parameter 2"
          value={config.parameters.customParam2}
          onChangeText={(value) => updateParameter('customParam2', value)}
        />
      </>
    );
  }
  return null;
};

// Add this in the render method after existing parameters
{renderCustomParameters()}
```

## 🔧 Strategy Development Best Practices

### 1. Strategy Structure

```typescript
class MyStrategy extends BaseStrategy {
  // 1. Constructor: Define configuration
  constructor() { /* ... */ }
  
  // 2. Main logic: Analyze market and generate signals
  async analyze(marketData: any): Promise<TradeSignal[]> { /* ... */ }
  
  // 3. Position management: Handle position updates
  onPositionUpdate(positions: Position[]): void { /* ... */ }
  
  // 4. Data requirements: Specify needed market data
  getRequiredData(): string[] { /* ... */ }
  
  // 5. Validation: Ensure configuration is valid
  validateConfig(): boolean { /* ... */ }
  
  // 6. Helper methods: Private strategy-specific logic
  private helperMethod(): void { /* ... */ }
}
```

### 2. Signal Generation

```typescript
// Entry signal example
const entrySignal: TradeSignal = {
  action: 'BUY',
  symbol: 'NSE:NIFTY24350CE',
  quantity: 50,
  orderType: 'MARKET', // or 'LIMIT'
  price: 100, // for LIMIT orders
  reason: 'Bullish breakout detected'
};

// Exit signal example
const exitSignal: TradeSignal = {
  action: 'SELL',
  symbol: 'NSE:NIFTY24350CE',
  quantity: 50,
  orderType: 'MARKET',
  reason: 'Target profit reached'
};
```

### 3. Risk Management

```typescript
onPositionUpdate(positions: Position[]): void {
  this.positions = positions;
  
  const totalPnL = this.getTotalPnL();
  const maxLoss = this.config.parameters.maxLoss;
  const targetProfit = this.config.parameters.targetProfit;
  
  // Stop loss check
  if (totalPnL <= -maxLoss) {
    this.triggerEmergencyExit('Stop loss hit');
  }
  
  // Target profit check
  if (totalPnL >= targetProfit) {
    this.triggerProfitExit('Target reached');
  }
  
  // Time-based exit
  const currentTime = new Date().toLocaleTimeString('en-IN', { 
    hour12: false, hour: '2-digit', minute: '2-digit' 
  });
  
  if (currentTime >= this.config.parameters.exitTime) {
    this.triggerTimeExit('Market close');
  }
}
```

### 4. Market Data Usage

```typescript
async analyze(marketData: any): Promise<TradeSignal[]> {
  const { 
    niftyPrice,     // Current NIFTY 50 price
    currentTime,    // Current time in HH:MM format
    timestamp       // Unix timestamp
  } = marketData;
  
  // Your strategy can request additional data
  // by implementing getRequiredData()
  
  // Example: Calculate ATM strike
  const atmStrike = Math.round(niftyPrice / 50) * 50;
  
  // Example: Time-based logic
  if (currentTime === '09:20') {
    // Market opening strategy
  }
  
  return signals;
}
```

## 🎯 Strategy Examples

### 1. Simple Time-Based Strategy

```typescript
export class TimeBasedStrategy extends BaseStrategy {
  async analyze(marketData: any): Promise<TradeSignal[]> {
    const { niftyPrice, currentTime } = marketData;
    const signals: TradeSignal[] = [];
    
    // Enter at 9:30 AM
    if (currentTime === '09:30') {
      const atmStrike = Math.round(niftyPrice / 50) * 50;
      
      signals.push({
        action: 'BUY',
        symbol: `NSE:NIFTY${this.getCurrentExpiry()}${atmStrike}CE`,
        quantity: this.config.parameters.quantity,
        orderType: 'MARKET',
        reason: 'Time-based entry'
      });
    }
    
    return signals;
  }
}
```

### 2. Momentum Strategy

```typescript
export class MomentumStrategy extends BaseStrategy {
  private priceHistory: number[] = [];
  
  async analyze(marketData: any): Promise<TradeSignal[]> {
    const { niftyPrice } = marketData;
    const signals: TradeSignal[] = [];
    
    // Store price history
    this.priceHistory.push(niftyPrice);
    if (this.priceHistory.length > 20) {
      this.priceHistory.shift(); // Keep last 20 prices
    }
    
    // Calculate momentum
    if (this.priceHistory.length >= 10) {
      const momentum = this.calculateMomentum();
      
      if (momentum > this.config.parameters.momentumThreshold) {
        // Bullish momentum - buy calls
        signals.push({
          action: 'BUY',
          symbol: this.getCallOption(niftyPrice),
          quantity: this.config.parameters.quantity,
          orderType: 'MARKET',
          reason: `Bullish momentum: ${momentum.toFixed(2)}`
        });
      }
    }
    
    return signals;
  }
  
  private calculateMomentum(): number {
    const recent = this.priceHistory.slice(-5);
    const older = this.priceHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;
    
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }
}
```

### 3. Mean Reversion Strategy

```typescript
export class MeanReversionStrategy extends BaseStrategy {
  async analyze(marketData: any): Promise<TradeSignal[]> {
    const { niftyPrice } = marketData;
    const signals: TradeSignal[] = [];
    
    // Calculate moving average (simplified)
    const movingAverage = await this.getMovingAverage(20);
    const deviation = ((niftyPrice - movingAverage) / movingAverage) * 100;
    
    // Mean reversion logic
    if (Math.abs(deviation) > this.config.parameters.deviationThreshold) {
      if (deviation > 0) {
        // Price above MA - expect reversion down
        signals.push({
          action: 'BUY',
          symbol: this.getPutOption(niftyPrice),
          quantity: this.config.parameters.quantity,
          orderType: 'MARKET',
          reason: `Mean reversion - price ${deviation.toFixed(2)}% above MA`
        });
      } else {
        // Price below MA - expect reversion up
        signals.push({
          action: 'BUY',
          symbol: this.getCallOption(niftyPrice),
          quantity: this.config.parameters.quantity,
          orderType: 'MARKET',
          reason: `Mean reversion - price ${Math.abs(deviation).toFixed(2)}% below MA`
        });
      }
    }
    
    return signals;
  }
}
```

## 🔌 API Integration

### Adding New Broker Support

1. **Create Broker API Class**

```typescript
// lib/brokers/NewBrokerAPI.ts
export interface NewBrokerConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export class NewBrokerAPI {
  private config: NewBrokerConfig;
  
  constructor(config: NewBrokerConfig) {
    this.config = config;
  }
  
  async authenticate(): Promise<boolean> {
    // Implement authentication
  }
  
  async getMarketData(symbol: string): Promise<any> {
    // Implement market data fetching
  }
  
  async placeOrder(orderData: any): Promise<any> {
    // Implement order placement
  }
  
  async getPositions(): Promise<any[]> {
    // Implement position fetching
  }
}
```

2. **Update StrategyManager**

```typescript
// Make StrategyManager broker-agnostic
export class StrategyManager {
  private brokerApi: FyersAPI | NewBrokerAPI;
  
  constructor(brokerApi: any) {
    this.brokerApi = brokerApi;
  }
  
  // Adapt methods to work with any broker
}
```

## 🧪 Testing Strategies

### 1. Paper Trading Mode

```typescript
export class PaperTradingAPI {
  private virtualBalance = 100000;
  private virtualPositions: Position[] = [];
  
  async placeOrder(orderData: any): Promise<any> {
    // Simulate order execution
    // Update virtual positions and balance
    // Return mock order ID
  }
  
  getVirtualPnL(): number {
    // Calculate P&L from virtual positions
  }
}
```

### 2. Strategy Backtesting

```typescript
export class BacktestEngine {
  async runBacktest(
    strategy: BaseStrategy,
    historicalData: any[],
    startDate: Date,
    endDate: Date
  ): Promise<BacktestResult> {
    // Run strategy against historical data
    // Calculate performance metrics
    // Return results
  }
}
```

## 📊 Performance Monitoring

### Custom Metrics

```typescript
export interface StrategyMetrics {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
}

export class PerformanceTracker {
  calculateMetrics(trades: Trade[]): StrategyMetrics {
    // Implement metric calculations
  }
  
  generateReport(strategy: BaseStrategy): PerformanceReport {
    // Generate detailed performance report
  }
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Test all strategies in paper trading mode
- [ ] Verify API credentials and permissions
- [ ] Set appropriate risk limits
- [ ] Configure monitoring and alerts
- [ ] Test emergency stop functionality
- [ ] Backup strategy configurations
- [ ] Monitor initial trades closely

### Environment Configuration

```typescript
// config/production.ts
export const PRODUCTION_CONFIG = {
  MAX_POSITION_SIZE: 100,
  MAX_DAILY_LOSS: 10000,
  ENABLE_PAPER_TRADING: false,
  LOG_LEVEL: 'INFO',
  MONITORING_ENABLED: true
};
```

This guide provides everything needed to extend the application with new strategies and integrate additional features.