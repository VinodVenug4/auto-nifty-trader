# Quick Start Guide - Auto NIFTY Trader

## 🚀 Get Trading in 10 Minutes

### Step 1: Setup Fyers Account (5 minutes)

1. **Get Fyers API Credentials**
   - Visit [Fyers Developer Portal](https://myapi.fyers.in/)
   - Create new app with these settings:
     - **App Name**: Auto NIFTY Trader
     - **Redirect URI**: `https://myapp.fyers.in/`
     - **App Type**: Web App
   - Note down:
     - **App ID**: (format: ABC12345-100)
     - **Secret Key**: (long string)
     - **Client ID**: (your trading account ID)

### Step 2: Launch & Configure App (2 minutes)

1. **Start the App**
   ```bash
   npx expo start
   ```

2. **Enter API Credentials**
   - Open app → Enter App ID and Secret Key
   - Click "Save Configuration"

3. **Authenticate**
   - Enter your Client ID
   - Click "🚀 Login with Fyers"
   - Complete login in popup
   - Copy auth code from URL and paste back

### Step 3: Configure Strategy (2 minutes)

1. **Go to Strategies Tab**
   - Find "ATR Straddle" strategy
   - Click "Configure"

2. **Set Parameters**
   ```
   Entry Time: 09:20
   Exit Time: 15:00
   Quantity: 25 (start small!)
   ATR Value: 150
   Max Loss: ₹2000
   Target: ₹1500
   ```

3. **Save Configuration**

### Step 4: Start Trading (1 minute)

1. **Enable Strategy**
   - Toggle ON the ATR Straddle strategy

2. **Start Execution**
   - Go to Dashboard
   - Click "Start Execution" (green button)
   - Monitor in Portfolio tab

## ⚡ Daily Workflow

### Morning (Before 9:20 AM)
```
1. Open app
2. Check strategy is enabled
3. Verify parameters
4. Start execution
```

### During Market Hours
```
1. Monitor Portfolio tab
2. Watch P&L in real-time
3. Emergency stop if needed
```

### End of Day
```
1. Stop execution
2. Review performance
3. Plan for next day
```

## 🎯 Key Controls

| Button | When to Use |
|--------|-------------|
| **Start Execution** | Begin automated trading |
| **Stop Execution** | Pause all trading |
| **Enable All** | Activate all strategies |
| **Disable All** | Deactivate all strategies |

## 🚨 Safety First

### Risk Management
- **Start Small**: Use quantity 25 or less initially
- **Set Limits**: Configure max loss (₹2000-5000)
- **Monitor Closely**: Watch first few trades
- **Emergency Stop**: Use "Stop Execution" if needed

### Best Practices
- Test during low volatility days
- Don't trade on event days (budget, RBI meetings)
- Keep sufficient margin in account
- Review performance weekly

## 📊 Understanding the Strategy

### ATR Straddle Strategy
- **What**: Buys both Call and Put options at ATM strike
- **When**: Enters at 9:20 AM, exits at 3:00 PM
- **Why**: Profits from volatility in either direction
- **Risk**: Limited to premium paid

### Example Trade
```
NIFTY at 24,500
→ Buy 24500 CE at ₹80
→ Buy 24500 PE at ₹75
→ Total cost: ₹155 per lot
→ Profit if NIFTY moves beyond 24345-24655
```

## 🔧 Troubleshooting

### Common Issues

**"Not authenticated" error**
- Re-login through Auth screen
- Check if token expired

**Orders not executing**
- Verify sufficient margin
- Check if market is open
- Ensure strategy is enabled

**App crashes**
- Restart the app
- Clear browser cache (for web)

**Wrong strike prices**
- Check ATR value setting
- Verify NIFTY price is updating

## 📱 App Navigation

```
Dashboard → Overview, controls, quick actions
Strategies → Manage and configure strategies  
Portfolio → View positions and P&L
Settings → Logout and app settings
```

## 💡 Pro Tips

### Optimization
- **ATR Value**: Adjust based on market volatility (100-200)
- **Timing**: Avoid first 10 minutes of market opening
- **Quantity**: Scale up gradually after consistent profits
- **Exit**: Consider manual exit during high volatility

### Monitoring
- Check positions every 30 minutes
- Watch for unusual market movements
- Keep track of daily P&L limits
- Review strategy performance weekly

## 🎓 Learning Path

### Week 1: Basics
- Understand the interface
- Run strategy with minimal quantity
- Learn to read P&L

### Week 2: Optimization
- Adjust ATR values
- Experiment with timing
- Track performance metrics

### Week 3: Advanced
- Add risk management rules
- Consider multiple strategies
- Analyze historical performance

## 📞 Support

### Self-Help
1. Check console logs for errors
2. Verify all credentials are correct
3. Ensure sufficient account balance
4. Test with paper trading first

### Documentation
- **README.md**: Complete user guide
- **DEVELOPER_GUIDE.md**: Adding new strategies
- **API_REFERENCE.md**: Technical documentation

## 🚀 Next Steps

Once comfortable with basic trading:

1. **Add More Strategies**: Explore Iron Condor, Butterfly
2. **Optimize Parameters**: Fine-tune based on performance
3. **Risk Management**: Implement advanced stop-loss rules
4. **Portfolio Diversification**: Use multiple strategies
5. **Performance Analysis**: Track and improve results

## ⚠️ Important Disclaimers

- **Risk Warning**: Trading involves substantial risk of loss
- **No Guarantees**: Past performance doesn't guarantee future results
- **Test First**: Always test with small amounts initially
- **Market Risk**: Be aware of market volatility and events
- **Technical Risk**: Software may have bugs or connectivity issues

Start small, learn continuously, and trade responsibly! 🎯