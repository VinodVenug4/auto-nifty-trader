// Trading logic and strategy implementation
export interface Position {
  id: string;
  symbol: string;
  type: 'CE' | 'PE';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'ACTIVE' | 'PROFIT' | 'LOSS';
  entryTime: Date;
}

export class TradingEngine {
  private positions: Position[] = [];
  private isPaperMode = true;
  private isActive = false;

  constructor(paperMode = true) {
    this.isPaperMode = paperMode;
  }

  // Round to nearest 50
  roundTo50(price: number): number {
    return Math.round(price / 50) * 50;
  }

  // Calculate strike prices based on strategy
  calculateStrikes(niftyPrice: number, atr: number) {
    const roundedNifty = this.roundTo50(niftyPrice);
    const roundedATR = this.roundTo50(atr);
    
    return {
      ceStrike: roundedNifty + roundedATR,
      peStrike: roundedNifty + roundedATR
    };
  }

  // Execute trades at 09:20 AM
  async executeEntry(niftyPrice: number, atr: number) {
    if (!this.isActive) return;

    const { ceStrike, peStrike } = this.calculateStrikes(niftyPrice, atr);
    
    // Simulate option prices (in real app, fetch from Fyers API)
    const cePrice = Math.random() * 100 + 50;
    const pePrice = Math.random() * 100 + 50;

    const cePosition: Position = {
      id: `CE_${Date.now()}`,
      symbol: `NIFTY${ceStrike}CE`,
      type: 'CE',
      qty: 75,
      entryPrice: cePrice,
      currentPrice: cePrice,
      pnl: 0,
      status: 'ACTIVE',
      entryTime: new Date()
    };

    const pePosition: Position = {
      id: `PE_${Date.now() + 1}`,
      symbol: `NIFTY${peStrike}PE`,
      type: 'PE',
      qty: 75,
      entryPrice: pePrice,
      currentPrice: pePrice,
      pnl: 0,
      status: 'ACTIVE',
      entryTime: new Date()
    };

    this.positions.push(cePosition, pePosition);
    return { cePosition, pePosition };
  }

  // Exit all positions at 15:00 PM
  async executeExit() {
    const exitedPositions = [...this.positions];
    this.positions = [];
    return exitedPositions;
  }

  // Update position prices and P&L
  updatePositions(marketData: any) {
    this.positions.forEach(position => {
      // Simulate price updates
      const priceChange = (Math.random() - 0.5) * 10;
      position.currentPrice = Math.max(1, position.currentPrice + priceChange);
      position.pnl = (position.currentPrice - position.entryPrice) * position.qty;
      position.status = position.pnl > 0 ? 'PROFIT' : position.pnl < 0 ? 'LOSS' : 'ACTIVE';
    });
  }

  getPositions(): Position[] {
    return this.positions;
  }

  getTotalPnL(): number {
    return this.positions.reduce((total, pos) => total + pos.pnl, 0);
  }

  setActive(active: boolean) {
    this.isActive = active;
  }

  setPaperMode(paperMode: boolean) {
    this.isPaperMode = paperMode;
  }
}