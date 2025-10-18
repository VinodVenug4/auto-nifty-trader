// Secure configuration management
import * as SecureStore from 'expo-secure-store';

export class SecureConfig {
  private static instance: SecureConfig;
  private appId: string = '';
  private secretKey: string = '';

  static getInstance(): SecureConfig {
    if (!SecureConfig.instance) {
      SecureConfig.instance = new SecureConfig();
    }
    return SecureConfig.instance;
  }

  async setCredentials(appId: string, secretKey: string) {
    this.appId = appId;
    this.secretKey = secretKey;
    
    // Store securely on device
    try {
      await SecureStore.setItemAsync('fyers_app_id', appId);
      await SecureStore.setItemAsync('fyers_secret_key', secretKey);
    } catch (error) {
      // Fallback to memory storage for web
      console.warn('SecureStore not available, using memory storage');
    }
  }

  async getCredentials() {
    if (!this.appId || !this.secretKey) {
      try {
        this.appId = await SecureStore.getItemAsync('fyers_app_id') || '';
        this.secretKey = await SecureStore.getItemAsync('fyers_secret_key') || '';
      } catch (error) {
        // Web fallback
        console.warn('SecureStore not available');
      }
    }
    
    return {
      appId: this.appId,
      secretKey: this.secretKey,
      redirectUri: 'https://myapp.fyers.in/'
    };
  }

  hasCredentials(): boolean {
    return !!(this.appId && this.secretKey);
  }

  clearCredentials() {
    this.appId = '';
    this.secretKey = '';
    try {
      SecureStore.deleteItemAsync('fyers_app_id');
      SecureStore.deleteItemAsync('fyers_secret_key');
    } catch (error) {
      console.warn('SecureStore not available');
    }
  }
}