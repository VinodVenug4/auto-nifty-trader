import { BaseStrategy, StrategyConfig, TradeSignal, Position } from './BaseStrategy';

export class StraddleStrategy extends BaseStrategy {
  constructor() {
    const config: StrategyConfig = {
      id: 'straddle-atr',
      name: 'ATR Straddle',
      description: 'NIFTY straddle strategy based on ATR',
      enabled: true,
      parameters: {
        entryTime: '09:20',
        exitTime: '15:00',
        quantity: 50,
        atr: 150,
        atrMultiplier: 1,
        maxLoss: 5000,
        targetProfit: 3000,
        selectedExpiry: 'monthly' // 'monthly' or specific expiry from API
      }
    };
    super(config);
  }

  async analyze(marketData: any): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const { niftyPrice, currentTime } = marketData;
    
    // Check for exit time first
    if (this.isExitTime(currentTime)) {
      signals.push({
        action: 'EXIT_ALL',
        symbol: '',
        quantity: 0,
        orderType: 'MARKET',
        reason: `Exit all positions at ${currentTime}`
      });
      return signals;
    }
    
    if (!this.isEntryTime(currentTime)) return signals;
    
    // Calculate reference strike (rounded current price to nearest 50)
    const referenceStrike = Math.round(niftyPrice / 50) * 50;
    const atr = this.config.parameters.atr || 150;
    const atrMultiplier = this.config.parameters.atrMultiplier || 1;
    const adjustedAtr = Math.round((atr * atrMultiplier) / 50) * 50; // Apply multiplier and round to nearest 50
    
    // Calculate CE and PE strikes
    const ceStrike = referenceStrike + adjustedAtr;
    const peStrike = referenceStrike - adjustedAtr;
    
    // Construct symbols using Fyers format
    const selectedExpiry = this.config.parameters.selectedExpiry;
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
    
    // Entry signals for ATR-based strangle
    signals.push({
      action: 'BUY',
      symbol: ceSymbol,
      quantity: this.config.parameters.quantity,
      orderType: 'MARKET',
      reason: `ATR Strangle - CE at ${ceStrike} (Ref: ${referenceStrike}, ATR: ${atr}x${atrMultiplier}=${adjustedAtr})`
    });
    
    signals.push({
      action: 'BUY',
      symbol: peSymbol,
      quantity: this.config.parameters.quantity,
      orderType: 'MARKET',
      reason: `ATR Strangle - PE at ${peStrike} (Ref: ${referenceStrike}, ATR: ${atr}x${atrMultiplier}=${adjustedAtr})`
    });
    
    return signals;
  }

  onPositionUpdate(positions: Position[]): void {
    this.positions = positions;
    
    // Check exit conditions
    const totalPnL = this.getTotalPnL();
    if (totalPnL <= -this.config.parameters.maxLoss || 
        totalPnL >= this.config.parameters.targetProfit) {
      // Trigger exit
    }
  }

  getRequiredData(): string[] {
    return ['NIFTY50-INDEX', 'ATR', 'TIME', 'TRADING_API'];
  }

  validateConfig(): boolean {
    const params = this.config.parameters;
    return !!(params.entryTime && params.exitTime && params.quantity > 0);
  }

  private isEntryTime(currentTime: string): boolean {
    return currentTime === this.config.parameters.entryTime;
  }

  private isExitTime(currentTime: string): boolean {
    return currentTime === this.config.parameters.exitTime;
  }

  private async getSelectedExpiry(tradingApi: any): Promise<string> {
    const selectedExpiry = this.config.parameters.selectedExpiry;
    
    if (selectedExpiry === 'monthly') {
      return this.getMonthlyExpiry();
    }
    
    // Get available expiries from option chain API
    try {
      const optionChain = await tradingApi.getOptionChain('NSE:NIFTY50-INDEX', 5);
      if (optionChain && optionChain.expiryData && optionChain.expiryData.length > 0) {
        // If specific expiry is selected, find it in available expiries
        const availableExpiries = optionChain.expiryData.map((exp: any) => exp.date);
        if (availableExpiries.includes(selectedExpiry)) {
          // Convert DD-MM-YYYY to YYMMDD format
          const [day, month, year] = selectedExpiry.split('-');
          return year.slice(2) + month + day;
        }
        
        // Default to monthly expiry if selected expiry not found
        return this.getMonthlyExpiry();
      }
    } catch (error) {
      console.error('Failed to get expiry from option chain:', error);
    }
    
    // Fallback to monthly expiry
    return this.getMonthlyExpiry();
  }
  
  private getMonthlyExpiry(): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get last Thursday of current month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const lastThursday = new Date(lastDay);
    lastThursday.setDate(lastDay.getDate() - ((lastDay.getDay() + 3) % 7));
    
    // If last Thursday has passed, get next month's last Thursday
    if (lastThursday < today) {
      const nextMonth = new Date(currentYear, currentMonth + 2, 0);
      const nextLastThursday = new Date(nextMonth);
      nextLastThursday.setDate(nextMonth.getDate() - ((nextMonth.getDay() + 3) % 7));
      return nextLastThursday.toISOString().slice(2, 10).replace(/-/g, '');
    }
    
    return lastThursday.toISOString().slice(2, 10).replace(/-/g, '');
  }
}