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
        atrMultiplier: 1.5,
        maxLoss: 5000,
        targetProfit: 3000
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
    
    // Calculate ATM strike based on NIFTY price
    const atmStrike = Math.round(niftyPrice / 50) * 50;
    const expiry = this.getCurrentExpiry();
    const atr = this.config.parameters.atr || 150;
    
    // Use ATR for strike selection (can be ATM or ATM +/- ATR based on strategy)
    const selectedStrike = atmStrike; // For straddle, use ATM
    
    // Entry signals for straddle
    signals.push({
      action: 'BUY',
      symbol: `NSE:NIFTY${expiry}${selectedStrike}CE`,
      quantity: this.config.parameters.quantity,
      orderType: 'MARKET',
      reason: `Straddle entry - CE leg at ${selectedStrike} (ATR: ${atr})`
    });
    
    signals.push({
      action: 'BUY',
      symbol: `NSE:NIFTY${expiry}${selectedStrike}PE`,
      quantity: this.config.parameters.quantity,
      orderType: 'MARKET',
      reason: `Straddle entry - PE leg at ${selectedStrike} (ATR: ${atr})`
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
    return ['NIFTY50-INDEX', 'ATR', 'TIME'];
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

  private getCurrentExpiry(): string {
    const today = new Date();
    const thursday = new Date(today);
    thursday.setDate(today.getDate() + (4 - today.getDay()));
    return thursday.toISOString().slice(2, 10).replace(/-/g, '');
  }
}