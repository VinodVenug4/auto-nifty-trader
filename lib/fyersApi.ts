// Fyers API integration
import { logger } from './logger';
import { SecurityManager } from './security';

export interface FyersCredentials {
  clientId: string;
  otp: string;
  pin: string;
}

export interface FyersConfig {
  appId: string;
  secretKey: string;
  redirectUri: string;
}

export class FyersAPI {
  private accessToken: string | null = null;
  private config: FyersConfig;
  private baseUrl = 'https://api-t1.fyers.in/api/v3';
  private tokenClearTimer: NodeJS.Timeout | null = null;

  constructor(config: FyersConfig) {
    this.config = config;
  }

  // Step 1: Generate auth code URL
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state: Math.random().toString(36).substring(7)
    });
    return `https://api-t1.fyers.in/api/v3/generate-authcode?${params}`;
  }

  // Step 2: Login with Client ID, OTP, and PIN
  async login(credentials: FyersCredentials): Promise<{ success: boolean; authCode?: string; error?: string }> {
    try {
      // Verify OTP and PIN to get auth code
      const authResponse = await fetch(`${this.baseUrl}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_key: credentials.clientId + '_' + Date.now(),
          identity_type: 'pin',
          identifier: credentials.otp,
          pin: credentials.pin,
          recaptcha_token: ''
        })
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.s === 'ok') {
          // Generate auth code
          const authCodeResponse = await fetch(`${this.baseUrl}/generate-authcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fy_id: credentials.clientId,
              app_id: this.config.appId.split('-')[0],
              redirect_uri: this.config.redirectUri,
              appType: 'WEB',
              code_challenge: '',
              state: 'sample_state',
              scope: '',
              nonce: '',
              response_type: 'code',
              create_cookie: true
            })
          });

          if (authCodeResponse.ok) {
            const data = await authCodeResponse.json();
            return { success: true, authCode: data.auth_code };
          }
        }
      }
      
      return { success: false, error: 'Invalid OTP or PIN' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Step 3: Exchange auth code for access token
  async getAccessToken(authCode: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const appIdHash = await this.hashAppId();
      
      const response = await fetch(`${this.baseUrl}/validate-authcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          appIdHash: appIdHash,
          code: authCode
        })
      });

      const data = await response.json();
      logger.log('Token response received');
      
      if (response.ok && data.s === 'ok') {
        this.accessToken = data.access_token;
        return { success: true, token: data.access_token };
      } else {
        return { success: false, error: data.message || 'Failed to get access token' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get NIFTY 50 current price (can also get from option chain)
  async getNiftyPrice(): Promise<number> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      // Try option chain first for more comprehensive data
      const optionChain = await this.getOptionChain('NSE:NIFTY50-INDEX', 1);
      if (optionChain && optionChain.underlyingPrice > 0) {
        return optionChain.underlyingPrice;
      }
      
      // Fallback to quotes API
      const response = await fetch(`https://api-t1.fyers.in/data/quotes?symbols=NSE:NIFTY50-INDEX`, {
        method: 'GET',
        headers: { 
          'Authorization': `${this.config.appId}:${this.accessToken}`
        }
      });
      
      const data = await response.json();
      logger.log('NIFTY price data received');
      
      if (response.ok && data.s === 'ok' && data.d && data.d.length > 0) {
        const niftyData = data.d[0];
        if (niftyData && niftyData.v && niftyData.v.lp) {
          return parseFloat(niftyData.v.lp);
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return 0;
  }

  // Get option chain data
  async getOptionChain(symbol: string = 'NSE:NIFTY50-INDEX', strikeCount: number = 5): Promise<any> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/data/options-chain-v3?symbol=${encodeURIComponent(symbol)}&strikecount=${strikeCount}`, {
        method: 'GET',
        headers: { 
          'Authorization': `${this.config.appId}:${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok') {
          return {
            callOi: data.data.callOi,
            putOi: data.data.putOi,
            expiryData: data.data.expiryData,
            indiaVix: data.data.indiavixData,
            optionsChain: data.data.optionsChain,
            underlyingPrice: data.data.optionsChain.find((item: any) => item.option_type === '')?.ltp || 0
          };
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return null;
  }

  // Place order
  async placeOrder(orderData: {
    symbol: string;
    qty: number;
    type: 'BUY' | 'SELL';
    productType: 'CNC' | 'INTRADAY' | 'MARGIN';
    orderType: 'MARKET' | 'LIMIT';
    price?: number;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/orders/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `${this.config.appId}:${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: orderData.symbol,
          qty: orderData.qty,
          type: orderData.orderType === 'MARKET' ? 2 : 1,
          side: orderData.type === 'BUY' ? 1 : -1,
          productType: orderData.productType,
          limitPrice: orderData.price || 0,
          stopPrice: 0,
          validity: 'DAY',
          disclosedQty: 0,
          offlineOrder: false,
          stopLoss: 0,
          takeProfit: 0
        })
      });

      const data = await response.json();
      
      if (response.ok && data.s === 'ok') {
        return { success: true, orderId: data.id };
      } else {
        return { success: false, error: data.message || 'Order placement failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get positions
  async getPositions(): Promise<any[]> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/positions`, {
        headers: { 'Authorization': `${this.config.appId}:${this.accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok') {
          return data.netPositions || [];
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return [];
  }

  // Get account funds/balance
  async getFunds(): Promise<{ availableBalance: number; totalBalance: number; usedMargin: number; realizedPnL: number }> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/funds`, {
        headers: { 'Authorization': `${this.config.appId}:${this.accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok' && data.fund_limit) {
          // Parse fund_limit array based on official API structure
          const totalBalance = data.fund_limit.find((item: any) => item.id === 1)?.equityAmount || 0;
          const utilizedAmount = data.fund_limit.find((item: any) => item.id === 2)?.equityAmount || 0;
          const availableBalance = data.fund_limit.find((item: any) => item.id === 10)?.equityAmount || 0;
          const realizedPnL = data.fund_limit.find((item: any) => item.id === 4)?.equityAmount || 0;
          
          return {
            availableBalance: parseFloat(availableBalance.toString()),
            totalBalance: parseFloat(totalBalance.toString()),
            usedMargin: parseFloat(utilizedAmount.toString()),
            realizedPnL: parseFloat(realizedPnL.toString())
          };
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return { availableBalance: 0, totalBalance: 0, usedMargin: 0, realizedPnL: 0 };
  }

  // Get order history (pending orders)
  async getOrderHistory(): Promise<any[]> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/orders`, {
        headers: { 'Authorization': `${this.config.appId}:${this.accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok') {
          return data.orderBook || [];
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return [];
  }

  // Get trade history (executed trades)
  async getTradeHistory(): Promise<any[]> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/tradebook`, {
        headers: { 'Authorization': `${this.config.appId}:${this.accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok') {
          return data.tradeBook || [];
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return [];
  }

  private async hashAppId(): Promise<string> {
    // Fyers v3 requires SHA256 hash of appId:secretKey
    const data = this.config.appId + ':' + this.config.secretKey;
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      // Web Crypto API
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto
      return btoa(data).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    
    // Clear token after 8 hours for security
    if (this.tokenClearTimer) {
      clearTimeout(this.tokenClearTimer);
    }
    
    this.tokenClearTimer = setTimeout(() => {
      this.clearToken();
    }, 8 * 60 * 60 * 1000); // 8 hours
  }

  // Place multiple orders
  async placeMultipleOrders(orders: {
    symbol: string;
    qty: number;
    type: 'BUY' | 'SELL';
    productType: 'CNC' | 'INTRADAY' | 'MARGIN';
    orderType: 'MARKET' | 'LIMIT';
    price?: number;
  }[]): Promise<{ success: boolean; results?: any[]; error?: string }> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const orderPayload = orders.map(orderData => ({
        symbol: orderData.symbol,
        qty: orderData.qty,
        type: orderData.orderType === 'MARKET' ? 2 : 1,
        side: orderData.type === 'BUY' ? 1 : -1,
        productType: orderData.productType,
        limitPrice: orderData.price || 0,
        stopPrice: 0,
        validity: 'DAY',
        disclosedQty: 0,
        offlineOrder: false,
        stopLoss: 0,
        takeProfit: 0
      }));

      const response = await fetch(`https://api-t1.fyers.in/api/v3/multi-order/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `${this.config.appId}:${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();
      
      if (response.ok && data.s === 'ok') {
        return { success: true, results: data.data };
      } else {
        return { success: false, error: data.message || 'Multi-order placement failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Exit all positions
  async exitAllPositions(): Promise<{ success: boolean; error?: string }> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/positions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${this.config.appId}:${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exit_all: 1 })
      });

      const data = await response.json();
      
      if (response.ok && data.s === 'ok') {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Exit all positions failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Exit position by ID
  async exitPosition(positionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/positions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${this.config.appId}:${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: positionId })
      });

      const data = await response.json();
      
      if (response.ok && data.s === 'ok') {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Exit position failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Cancel pending order
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`https://api-t1.fyers.in/api/v3/orders/sync`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${this.config.appId}:${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: orderId })
      });

      const data = await response.json();
      
      if (response.ok && data.s === 'ok') {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Order cancellation failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get market quotes for symbols
  async getQuotes(symbols: string[]): Promise<any[]> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(`https://api-t1.fyers.in/data/quotes?symbols=${encodeURIComponent(symbolsParam)}`, {
        method: 'GET',
        headers: { 
          'Authorization': `${this.config.appId}:${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok' && data.d) {
          return data.d.map((quote: any) => ({
            symbol: quote.n,
            ltp: quote.v?.lp || 0,
            change: quote.v?.ch || 0,
            changePercent: quote.v?.chp || 0,
            open: quote.v?.open_price || 0,
            high: quote.v?.high_price || 0,
            low: quote.v?.low_price || 0,
            prevClose: quote.v?.prev_close_price || 0,
            volume: quote.v?.volume || 0,
            bid: quote.v?.bid || 0,
            ask: quote.v?.ask || 0,
            spread: quote.v?.spread || 0,
            atp: quote.v?.atp || 0,
            fyToken: quote.v?.fyToken || '',
            exchange: quote.v?.exchange || '',
            description: quote.v?.description || ''
          }));
        }
      }
    } catch (error) {
      const securityManager = SecurityManager.getInstance();
      logger.error(securityManager.sanitizeError(error));
    }
    
    return [];
  }

  // Get single symbol quote
  async getQuote(symbol: string): Promise<any> {
    const quotes = await this.getQuotes([symbol]);
    return quotes.length > 0 ? quotes[0] : null;
  }

  clearToken(): void {
    this.accessToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fyers_token');
    }
    logger.log('Token cleared for security');
  }

  // Clear token when app goes to background
  onAppBackground(): void {
    // Clear token after 5 minutes in background
    setTimeout(() => {
      this.clearToken();
    }, 5 * 60 * 1000);
  }
}