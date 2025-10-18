# Auto NIFTY Trader

A comprehensive React Native/Expo automated trading application for NIFTY 50 options with Fyers API integration.

## 🚀 Features

- **Multi-Strategy Support**: Extensible framework for multiple trading strategies
- **ATR Straddle Strategy**: Built-in NIFTY options straddle strategy with ATR-based strike selection
- **Real-time Portfolio Tracking**: Live P&L monitoring and position management
- **Secure Authentication**: Fyers OAuth integration with secure credential storage
- **Cross-Platform**: Works on Android, iOS, and Web
- **Automated Execution**: Time-based strategy execution with configurable parameters

## 📱 Screenshots & UI

### Dashboard
- Real-time NIFTY 50 price
- Total P&L across all strategies
- Strategy execution controls
- Quick action buttons

### Strategies Management
- Enable/disable individual strategies
- Configure strategy parameters
- View detailed performance metrics
- Browse available strategies

### Portfolio Tracking
- Active positions with real-time P&L
- Individual position details
- Performance analytics

## 🏗️ Architecture

### Core Components

```
├── lib/
│   ├── fyersApi.ts          # Fyers API v3 integration
│   ├── config.ts            # Secure configuration management
│   ├── autoAuth.ts          # Authentication handler
│   ├── StrategyManager.ts   # Multi-strategy execution engine
│   ├── ui.tsx              # Reusable UI components
│   └── strategies/
│       ├── BaseStrategy.ts  # Abstract strategy interface
│       ├── StraddleStrategy.ts # ATR straddle implementation
│       └── TemplateStrategy.ts # Template for new strategies
├── app/
│   ├── MainApp.tsx         # Main navigation controller
│   ├── auth.tsx            # Authentication screen
│   └── screens/
│       ├── DashboardScreen.tsx      # Main dashboard
│       ├── StrategiesScreen.tsx     # Strategy management
│       ├── PortfolioScreen.tsx      # Portfolio tracking
│       ├── StrategyConfigScreen.tsx # Strategy configuration
│       ├── StrategyDetailsScreen.tsx # Strategy details
│       └── StrategyBrowserScreen.tsx # Available strategies
└── App.tsx                 # App entry point
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+
- Expo CLI
- Fyers Trading Account
- Fyers API Credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd auto-nifty-trader
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npx expo start
```

### Fyers API Setup

1. **Create Fyers Developer Account**
   - Visit [Fyers Developer Portal](https://myapi.fyers.in/)
   - Create a new app
   - Set Redirect URI: `https://myapp.fyers.in/`

2. **Get API Credentials**
   - App ID (format: ABC12345-100)
   - Secret Key
   - Client ID (your Fyers trading account ID)

## 📖 User Guide

### First Time Setup

1. **Launch the App**
   - Open the app on your device/browser

2. **Configure API Credentials**
   - Enter your Fyers App ID and Secret Key
   - These are stored securely on your device

3. **Authenticate with Fyers**
   - Enter your Client ID
   - Complete Fyers OAuth login
   - Copy the auth code from redirect URL

### Daily Trading Workflow

1. **Morning Setup (Before 9:20 AM)**
   ```
   Dashboard → Configure Strategies → Set Parameters
   ```
   - Configure ATR value (typically 100-200)
   - Set entry time (9:20 AM)
   - Set exit time (3:00 PM)
   - Set quantity and risk parameters

2. **Start Trading**
   ```
   Dashboard → Enable All → Start Execution
   ```
   - Strategies will execute automatically at configured times
   - Monitor real-time P&L and positions

3. **Monitor & Control**
   ```
   Portfolio → View Positions
   Strategies → View Details
   ```
   - Track individual strategy performance
   - Adjust parameters if needed
   - Stop execution during high volatility

4. **End of Day**
   ```
   Dashboard → Stop Execution → Disable All
   ```

### Strategy Configuration

#### ATR Straddle Strategy

**Parameters:**
- **Entry Time**: When to enter positions (default: 09:20)
- **Exit Time**: When to exit positions (default: 15:00)
- **Quantity**: Number of lots per leg (default: 50)
- **ATR Value**: Average True Range for strike selection (default: 150)
- **ATR Multiplier**: Multiplier for strike calculation (default: 1.5)
- **Max Loss**: Maximum loss threshold (default: ₹5000)
- **Target Profit**: Profit target (default: ₹3000)

**How it Works:**
1. At entry time, calculates ATM strike: `round(NIFTY_PRICE / 50) * 50`
2. Places BUY orders for both CE and PE at ATM strike
3. Monitors P&L against max loss and target profit
4. Exits all positions at configured exit time

## 🔧 Controls & Buttons

### Dashboard Controls

| Button | Color | Function |
|--------|-------|----------|
| **Start Execution** | 🟢 Green | Begins automated strategy execution (30-second intervals) |
| **Stop Execution** | 🔴 Red | Stops automated execution engine |
| **Enable All** | 🟢 Green | Activates all strategies for trading |
| **Disable All** | 🔴 Red | Deactivates all strategies |

### Strategy Controls

| Action | Purpose |
|--------|---------|
| **Toggle Switch** | Enable/disable individual strategy |
| **Configure** | Open parameter configuration screen |
| **View Details** | Show performance metrics and positions |

### Execution Flow

```
1. Strategies must be ENABLED (individual or bulk)
2. Execution must be STARTED
3. Every 30 seconds: Check enabled strategies for signals
4. Execute trades based on generated signals
```

## 🔒 Security Features

- **Secure Storage**: API credentials encrypted using Expo SecureStore
- **No Hardcoded Secrets**: All sensitive data stored securely on device
- **OAuth Authentication**: Secure Fyers login flow
- **Token Management**: Automatic token refresh and validation

## 🚨 Risk Management

### Built-in Safety Features
- **Max Loss Limits**: Configurable per strategy
- **Position Limits**: Quantity controls
- **Time-based Exits**: Automatic position closure
- **Manual Override**: Emergency stop controls

### Best Practices
1. **Start Small**: Begin with minimal quantities
2. **Monitor Closely**: Watch positions during volatile periods
3. **Set Realistic Targets**: Don't over-leverage
4. **Regular Reviews**: Analyze strategy performance weekly
5. **Market Hours Only**: Ensure strategies run during trading hours

## 📊 Performance Monitoring

### Key Metrics
- **Total P&L**: Aggregate profit/loss across all strategies
- **Individual Strategy P&L**: Per-strategy performance
- **Win Rate**: Percentage of profitable trades
- **Average Trade**: Mean profit/loss per trade
- **Maximum Drawdown**: Largest loss from peak

### Tracking Tools
- Real-time position monitoring
- Historical performance data
- Strategy comparison metrics
- Risk-adjusted returns

## 🛠️ Troubleshooting

### Common Issues

**Authentication Failed**
- Verify App ID and Secret Key
- Check Client ID format
- Ensure redirect URL matches Fyers app settings

**Orders Not Executing**
- Confirm Fyers account has sufficient margin
- Check if market is open
- Verify strategy is enabled and execution is started

**Price Data Issues**
- Check internet connection
- Verify Fyers API token is valid
- Restart app if data seems stale

**App Crashes**
- Clear app cache
- Restart the application
- Check console for error messages

### Support
- Check console logs for detailed error messages
- Verify all API credentials are correct
- Ensure sufficient account balance for trading

## 📈 Future Enhancements

### Planned Features
- Additional strategy templates (Iron Condor, Butterfly, etc.)
- Advanced risk management tools
- Backtesting capabilities
- Performance analytics dashboard
- Multi-broker support
- Paper trading mode

### Roadmap
- Q1: Iron Condor and Butterfly strategies
- Q2: Advanced analytics and reporting
- Q3: Backtesting engine
- Q4: Multi-broker integration