import { StorageManager } from './storage';

// Paper trading simulation with real market data
export interface PaperTrade {
  id: string;
  symbol: string;
  quantity: number;
  type: 'BUY' | 'SELL';
  price: number;
  timestamp: number;
  status: 'EXECUTED' | 'PENDING';
}

export interface PaperPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  type: 'CE' | 'PE' | 'EQUITY';
  entryTime: number;
}

export class PaperTradingAPI {
  private virtualBalance: number = 100000;
  private positions: Map<string, PaperPosition> = new Map();
  private trades: PaperTrade[] = [];
  private pendingOrders: any[] = [];
  private fyersApi: any;
  private storage = StorageManager.getInstance();

  constructor(fyersApi: any) {
    this.fyersApi = fyersApi;
    this.loadPersistentData();
  }

  private loadPersistentData(): void {
    const data = this.storage.getPaperTradingData();
    this.virtualBalance = data.balance;
    this.trades = data.trades;
    this.pendingOrders = data.pendingOrders || [];
    
    // Restore positions
    this.positions.clear();
    data.positions.forEach(pos => {
      this.positions.set(pos.symbol, pos);
    });
  }

  private savePersistentData(): void {
    this.storage.savePaperTradingData({
      balance: this.virtualBalance,
      positions: Array.from(this.positions.values()),
      trades: this.trades,
      pendingOrders: this.pendingOrders
    });
  }

  async placeOrder(orderData: {
    symbol: string;
    qty: number;
    type: 'BUY' | 'SELL';
    productType: string;
    orderType: string;
    price?: number;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Get current market price
      const currentPrice = await this.getCurrentPrice(orderData.symbol);
      const executionPrice = orderData.orderType === 'MARKET' ? currentPrice : (orderData.price || currentPrice);
      
      // Create trade record
      const trade: PaperTrade = {
        id: `PAPER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: orderData.symbol,
        quantity: orderData.qty,
        type: orderData.type,
        price: executionPrice,
        timestamp: Date.now(),
        status: 'EXECUTED'
      };

      this.trades.push(trade);

      // Update positions
      this.updatePosition(trade);

      // Update virtual balance
      const tradeValue = executionPrice * orderData.qty;
      if (orderData.type === 'BUY') {
        this.virtualBalance -= tradeValue;
      } else {
        this.virtualBalance += tradeValue;
      }

      // Save to persistent storage
      this.savePersistentData();

      return { success: true, orderId: trade.id };
    } catch (error) {
      return { success: false, error: 'Paper trading execution failed' };
    }
  }

  async getPositions(): Promise<PaperPosition[]> {
    // Update current prices for all positions
    for (const position of this.positions.values()) {
      try {
        const currentPrice = await this.getCurrentPrice(position.symbol);
        position.currentPrice = currentPrice;
        position.pnl = (currentPrice - position.entryPrice) * position.quantity;
      } catch (error) {
        console.error('Failed to update position price:', error);
      }
    }

    return Array.from(this.positions.values()).filter(pos => pos.quantity !== 0);
  }

  getTrades(): PaperTrade[] {
    return [...this.trades].reverse(); // Most recent first
  }

  getVirtualBalance(): number {
    return this.virtualBalance;
  }

  getTotalPnL(): number {
    return Array.from(this.positions.values())
      .reduce((total, pos) => total + pos.pnl, 0);
  }

  // Get pending orders (mock for paper trading)
  getPendingOrders(): any[] {
    return [...this.pendingOrders];
  }

  // Cancel pending order (paper trading)
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    const orderIndex = this.pendingOrders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      this.pendingOrders.splice(orderIndex, 1);
      this.savePersistentData();
      return { success: true };
    }
    return { success: false, error: 'Order not found' };
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // For NIFTY index
      if (symbol.includes('NIFTY50-INDEX')) {
        return await this.fyersApi.getNiftyPrice();
      }

      // For options, use mock pricing based on NIFTY movement
      if (symbol.includes('CE') || symbol.includes('PE')) {
        const niftyPrice = await this.fyersApi.getNiftyPrice();
        return this.calculateOptionPrice(symbol, niftyPrice);
      }

      // Fallback mock price
      return 50 + Math.random() * 100;
    } catch (error) {
      // Return mock price if API fails
      return 50 + Math.random() * 100;
    }
  }

  private calculateOptionPrice(symbol: string, niftyPrice: number): number {
    // Extract strike from symbol (simplified)
    const strikeMatch = symbol.match(/(\d{5})(CE|PE)/);
    if (!strikeMatch) return 50;

    const strike = parseInt(strikeMatch[1]);
    const optionType = strikeMatch[2];
    
    // Simple option pricing model
    const moneyness = niftyPrice - strike;
    
    if (optionType === 'CE') {
      // Call option
      return Math.max(0, moneyness) + Math.random() * 30 + 10;
    } else {
      // Put option
      return Math.max(0, -moneyness) + Math.random() * 30 + 10;
    }
  }

  private updatePosition(trade: PaperTrade): void {
    const existing = this.positions.get(trade.symbol);

    if (!existing) {
      // New position
      if (trade.type === 'BUY') {
        this.positions.set(trade.symbol, {
          symbol: trade.symbol,
          quantity: trade.quantity,
          entryPrice: trade.price,
          currentPrice: trade.price,
          pnl: 0,
          type: this.getPositionType(trade.symbol),
          entryTime: trade.timestamp
        });
      }
    } else {
      // Update existing position
      if (trade.type === 'BUY') {
        // Average down
        const totalQty = existing.quantity + trade.quantity;
        const totalValue = (existing.entryPrice * existing.quantity) + (trade.price * trade.quantity);
        existing.entryPrice = totalValue / totalQty;
        existing.quantity = totalQty;
      } else {
        // Reduce position
        existing.quantity -= trade.quantity;
        if (existing.quantity <= 0) {
          this.positions.delete(trade.symbol);
        }
      }
    }
  }

  private getPositionType(symbol: string): 'CE' | 'PE' | 'EQUITY' {
    if (symbol.includes('CE')) return 'CE';
    if (symbol.includes('PE')) return 'PE';
    return 'EQUITY';
  }

  // Reset paper trading account
  reset(): void {
    this.virtualBalance = 100000;
    this.positions.clear();
    this.trades = [];
    this.pendingOrders = [];
    this.savePersistentData();
  }
}