// Base strategy interface for all trading strategies
export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  type: 'CE' | 'PE' | 'EQUITY';
}

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  quantity: number;
  price?: number;
  orderType: 'MARKET' | 'LIMIT';
  reason: string;
}

export abstract class BaseStrategy {
  protected config: StrategyConfig;
  protected positions: Position[] = [];
  protected isActive: boolean = false;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  abstract analyze(marketData: any): Promise<TradeSignal[]>;
  abstract onPositionUpdate(positions: Position[]): void;
  abstract getRequiredData(): string[];
  abstract validateConfig(): boolean;

  // Common methods
  getId(): string { return this.config.id; }
  getName(): string { return this.config.name; }
  getDescription(): string { return this.config.description; }
  isEnabled(): boolean { return this.config.enabled; }
  getConfig(): StrategyConfig { return this.config; }
  
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  updateConfig(newConfig: Partial<StrategyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getPositions(): Position[] { return this.positions; }
  
  getTotalPnL(): number {
    return this.positions.reduce((total, pos) => total + pos.pnl, 0);
  }
}