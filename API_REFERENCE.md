# API Reference - Auto NIFTY Trader

## 🔌 Core APIs

### BaseStrategy Interface

The foundation for all trading strategies.

```typescript
abstract class BaseStrategy {
  // Abstract methods (must implement)
  abstract analyze(marketData: any): Promise<TradeSignal[]>;
  abstract onPositionUpdate(positions: Position[]): void;
  abstract getRequiredData(): string[];
  abstract validateConfig(): boolean;
  
  // Available methods
  getId(): string;
  getName(): string;
  getDescription(): string;
  isEnabled(): boolean;
  getConfig(): StrategyConfig;
  setEnabled(enabled: boolean): void;
  updateConfig(newConfig: Partial<StrategyConfig>): void;
  getPositions(): Position[];
  getTotalPnL(): number;
}
```

### StrategyConfig Interface

```typescript
interface StrategyConfig {
  id: string;                    // Unique strategy identifier
  name: string;                  // Display name
  description: string;           // Strategy description
  enabled: boolean;              // Whether strategy is active
  parameters: Record<string, any>; // Strategy-specific parameters
}
```

### TradeSignal Interface

```typescript
interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';  // Trade action
  symbol: string;                    // Trading symbol (e.g., "NSE:NIFTY24350CE")
  quantity: number;                  // Number of shares/contracts
  price?: number;                    // Price for LIMIT orders
  orderType: 'MARKET' | 'LIMIT';     // Order type
  reason: string;                    // Reason for the signal
}
```

### Position Interface

```typescript
interface Position {
  symbol: string;        // Trading symbol
  quantity: number;      // Position size
  entryPrice: number;    // Average entry price
  currentPrice: number;  // Current market price
  pnl: number;          // Unrealized P&L
  type: 'CE' | 'PE' | 'EQUITY'; // Position type
}
```

## 🏗️ StrategyManager API

### Constructor

```typescript
const strategyManager = new StrategyManager(fyersApi);
```

### Methods

#### Strategy Management

```typescript
// Get all strategies
getStrategies(): BaseStrategy[]

// Get specific strategy
getStrategy(id: string): BaseStrategy | undefined

// Enable/disable strategies
enableStrategy(id: string): void
disableStrategy(id: string): void
enableAllStrategies(): void
disableAllStrategies(): void
```

#### Execution Control

```typescript
// Start/stop execution engine
start(): void  // Begins 30-second execution loop
stop(): void   // Stops execution loop

// Check execution status
isActive(): boolean
```

#### Strategy Execution

```typescript
// Execute all enabled strategies (called automatically)
executeStrategies(): Promise<void>
```

## 🔐 FyersAPI Reference

### Authentication

```typescript
// Initialize API
const fyersApi = new FyersAPI({
  appId: 'YOUR_APP_ID-100',
  secretKey: 'YOUR_SECRET_KEY',
  redirectUri: 'https://myapp.fyers.in/'
});

// Get auth URL
const authUrl = fyersApi.getAuthUrl();

// Exchange auth code for token
const result = await fyersApi.getAccessToken(authCode);

// Set token manually
fyersApi.setAccessToken(token);

// Check authentication status
const isAuth = fyersApi.isAuthenticated();
```

### Market Data

```typescript
// Get NIFTY 50 price
const niftyPrice = await fyersApi.getNiftyPrice();

// Get option chain data
const optionData = await fyersApi.getOptionChain(24350, '241128');
// Returns: { ce: {...}, pe: {...} }
```

### Order Management

```typescript
// Place order
const orderResult = await fyersApi.placeOrder({
  symbol: 'NSE:NIFTY24350CE',
  qty: 50,
  type: 'BUY',
  productType: 'INTRADAY',
  orderType: 'MARKET',
  price: 100 // for LIMIT orders
});

// Get positions
const positions = await fyersApi.getPositions();
```

## 🎨 UI Components API

### Button Component

```typescript
<Button 
  title="Button Text"
  onPress={() => {}}
  variant="primary" | "secondary" | "destructive" | "outline" | "ghost"
  disabled={false}
  style={customStyles}
/>
```

### Card Component

```typescript
<Card style={customStyles}>
  {children}
</Card>
```

### TextInput Component

```typescript
<TextInput
  label="Input Label"
  value={value}
  onChangeText={setValue}
  placeholder="Placeholder text"
  keyboardType="default" | "numeric"
  secureTextEntry={false}
  multiline={false}
  numberOfLines={1}
/>
```

### StatusBadge Component

```typescript
<StatusBadge 
  status="active" | "inactive" | "profit" | "loss" | "long" | "short"
  text="Display Text"
/>
```

### Switch Component

```typescript
<Switch
  value={isEnabled}
  onValueChange={setIsEnabled}
  label="Switch Label"
/>
```

## 📊 Market Data Format

### Market Data Object

```typescript
interface MarketData {
  niftyPrice: number;      // Current NIFTY 50 price
  currentTime: string;     // Time in "HH:MM" format
  timestamp: number;       // Unix timestamp
}
```

### Option Symbol Format

```typescript
// Format: NSE:NIFTY[EXPIRY][STRIKE][CE/PE]
// Examples:
"NSE:NIFTY24112824350CE"  // NIFTY 28-Nov-2024 24350 Call
"NSE:NIFTY24112824350PE"  // NIFTY 28-Nov-2024 24350 Put
```

### Expiry Date Format

```typescript
// Format: YYMMDD
"241128"  // 28-Nov-2024
"241205"  // 05-Dec-2024
```

## 🔧 Configuration API

### SecureConfig Class

```typescript
const secureConfig = SecureConfig.getInstance();

// Set credentials
await secureConfig.setCredentials(appId, secretKey);

// Get credentials
const config = await secureConfig.getCredentials();
// Returns: { appId, secretKey, redirectUri }

// Check if credentials exist
const hasCredentials = secureConfig.hasCredentials();

// Clear credentials
secureConfig.clearCredentials();
```

## 📱 Screen Navigation API

### MainApp Navigation

```typescript
type Screen = 'dashboard' | 'strategies' | 'portfolio' | 'settings';

// Navigation is handled internally by MainApp component
// Screens are switched using bottom navigation buttons
```

### Screen Props

#### DashboardScreen

```typescript
interface DashboardScreenProps {
  fyersApi: FyersAPI;
  strategyManager: StrategyManager;
}
```

#### StrategiesScreen

```typescript
interface StrategiesScreenProps {
  strategyManager: StrategyManager;
}
```

#### PortfolioScreen

```typescript
interface PortfolioScreenProps {
  fyersApi: FyersAPI;
}
```

#### StrategyConfigScreen

```typescript
interface StrategyConfigScreenProps {
  strategy: BaseStrategy;
  onSave: (config: any) => void;
  onBack: () => void;
}
```

## 🚨 Error Handling

### API Response Format

```typescript
// Success response
{
  success: true,
  data?: any,
  token?: string,
  orderId?: string
}

// Error response
{
  success: false,
  error: string
}
```

### Common Error Codes

```typescript
// Authentication errors
"Not authenticated"
"Invalid OTP or PIN"
"Failed to get access token"

// Trading errors
"Order placement failed"
"Insufficient margin"
"Market closed"

// Network errors
"Network error"
"API timeout"
```

## 🔄 Lifecycle Hooks

### Strategy Lifecycle

```typescript
class MyStrategy extends BaseStrategy {
  constructor() {
    // 1. Strategy initialization
    super(config);
  }
  
  async analyze(marketData: any) {
    // 2. Called every 30 seconds during execution
    return signals;
  }
  
  onPositionUpdate(positions: Position[]) {
    // 3. Called when positions change
    this.positions = positions;
  }
  
  validateConfig() {
    // 4. Called before strategy activation
    return isValid;
  }
}
```

### App Lifecycle

```typescript
// App startup
1. App.tsx renders
2. Authentication check
3. MainApp initialization
4. StrategyManager creation
5. Strategy registration

// During trading
1. User starts execution
2. 30-second timer begins
3. Market data fetched
4. Strategies analyzed
5. Signals generated
6. Orders placed
7. Positions updated
```

## 📈 Performance Metrics

### Available Metrics

```typescript
// Strategy-level metrics
strategy.getTotalPnL(): number
strategy.getPositions(): Position[]

// Portfolio-level metrics
const totalPnL = strategies.reduce((sum, s) => sum + s.getTotalPnL(), 0);
const activePositions = strategies.flatMap(s => s.getPositions());
```

## 🛠️ Utility Functions

### Time Utilities

```typescript
// Get current time in trading format
const currentTime = new Date().toLocaleTimeString('en-IN', { 
  hour12: false, 
  hour: '2-digit', 
  minute: '2-digit' 
});

// Get current expiry (next Thursday)
const getCurrentExpiry = (): string => {
  const today = new Date();
  const thursday = new Date(today);
  thursday.setDate(today.getDate() + (4 - today.getDay()));
  return thursday.toISOString().slice(2, 10).replace(/-/g, '');
};
```

### Strike Calculation

```typescript
// Calculate ATM strike
const atmStrike = Math.round(niftyPrice / 50) * 50;

// Calculate OTM strikes
const otmCallStrike = atmStrike + 100;
const otmPutStrike = atmStrike - 100;
```

### Symbol Generation

```typescript
// Generate option symbols
const generateOptionSymbol = (strike: number, type: 'CE' | 'PE', expiry: string): string => {
  return `NSE:NIFTY${expiry}${strike}${type}`;
};
```

This API reference provides complete documentation for all available interfaces and methods in the application.