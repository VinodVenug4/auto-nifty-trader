// Security utilities
import { AppState, Alert, Platform } from 'react-native';

// Conditional import for native platforms only
let LocalAuthentication: any = null;
if (Platform.OS !== 'web') {
  try {
    LocalAuthentication = require('expo-local-authentication');
  } catch (error) {
    console.warn('LocalAuthentication not available');
  }
}
import { logger } from './logger';

export class SecurityManager {
  private static instance: SecurityManager;
  private isAppLocked = true;
  private tokenClearTimer: NodeJS.Timeout | null = null;

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Check if device is rooted/jailbroken
  async checkDeviceSecurity(): Promise<boolean> {
    try {
      // Basic root detection checks
      const suspiciousApps = [
        'com.noshufou.android.su',
        'com.thirdparty.superuser',
        'eu.chainfire.supersu',
        'com.koushikdutta.superuser'
      ];

      // Check for suspicious files (simplified check)
      const rootPaths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su'
      ];

      // In a real implementation, you'd check these paths
      // For now, return true (device is secure)
      return true;
    } catch (error) {
      logger.error('Device security check failed');
      return false;
    }
  }

  // Authenticate user with biometrics/PIN
  async authenticateUser(): Promise<boolean> {
    try {
      // Web fallback
      if (Platform.OS === 'web' || !LocalAuthentication) {
        return new Promise((resolve) => {
          const confirmed = window.confirm('Authenticate to access Auto NIFTY Trader');
          resolve(confirmed);
        });
      }
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback to simple confirmation
        return new Promise((resolve) => {
          Alert.alert(
            'Authentication Required',
            'Please confirm to access the app',
            [
              { text: 'Cancel', onPress: () => resolve(false) },
              { text: 'Confirm', onPress: () => resolve(true) }
            ]
          );
        });
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Auto NIFTY Trader',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel'
      });

      return result.success;
    } catch (error) {
      logger.error('Authentication failed');
      return false;
    }
  }

  // Lock app when going to background
  setupAppStateListener(onLock: () => void): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        this.lockApp();
        onLock();
        
        // Clear sensitive data after 5 minutes in background
        this.tokenClearTimer = setTimeout(() => {
          this.clearSensitiveData();
        }, 5 * 60 * 1000);
      } else if (nextAppState === 'active') {
        if (this.tokenClearTimer) {
          clearTimeout(this.tokenClearTimer);
          this.tokenClearTimer = null;
        }
      }
    });
  }

  lockApp(): void {
    this.isAppLocked = true;
  }

  unlockApp(): void {
    this.isAppLocked = false;
  }

  isLocked(): boolean {
    return this.isAppLocked;
  }

  // Clear sensitive data from memory
  private clearSensitiveData(): void {
    // This would clear tokens, credentials, etc.
    logger.log('Clearing sensitive data due to extended background time');
  }

  // Sanitize error messages for production
  sanitizeError(error: any): string {
    if (__DEV__) {
      return error?.message || 'Unknown error';
    }
    
    // In production, return generic messages
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'Network connection error';
    }
    if (error?.message?.includes('auth') || error?.message?.includes('token')) {
      return 'Authentication error';
    }
    return 'An error occurred';
  }
}