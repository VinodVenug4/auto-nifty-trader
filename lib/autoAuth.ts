// Automatic authentication using WebView and deep linking
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export class AutoAuth {
  private static instance: AutoAuth;
  private authCallback: ((authCode: string) => void) | null = null;

  static getInstance(): AutoAuth {
    if (!AutoAuth.instance) {
      AutoAuth.instance = new AutoAuth();
    }
    return AutoAuth.instance;
  }

  // Setup deep link listener
  setupDeepLinking() {
    // Listen for incoming links
    Linking.addEventListener('url', this.handleDeepLink);
    
    // Check if app was opened with a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  // Handle deep link callback
  private handleDeepLink = ({ url }: { url: string }) => {
    console.log('Deep link received:', url);
    
    // Parse auth code from URL
    const authCode = this.extractAuthCode(url);
    if (authCode && this.authCallback) {
      this.authCallback(authCode);
      this.authCallback = null; // Clear callback
    }
  };

  // Extract auth code from redirect URL
  private extractAuthCode(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('auth_code') || urlObj.searchParams.get('code');
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  // Extract auth code from full URL (for web interface)
  static extractCodeFromUrl(fullUrl: string): string | null {
    try {
      console.log('Extracting auth_code from URL:', fullUrl);
      
      // Clean the URL - remove HTML entities and whitespace
      const cleanUrl = fullUrl.trim().replace(/&amp;/g, '&');
      
      // If it's already just a code (JWT format), return as is
      if (!cleanUrl.includes('http') && !cleanUrl.includes('?') && cleanUrl.includes('.')) {
        console.log('Detected direct JWT code:', cleanUrl.substring(0, 50) + '...');
        return cleanUrl;
      }
      
      // First try to extract auth_code parameter
      if (cleanUrl.includes('auth_code=')) {
        try {
          const urlObj = new URL(cleanUrl);
          const authCode = urlObj.searchParams.get('auth_code');
          if (authCode) {
            console.log('Extracted auth_code from URL params:', authCode.substring(0, 50) + '...');
            return authCode;
          }
        } catch (urlError) {
          // Fallback to regex if URL constructor fails
          const match = cleanUrl.match(/[?&]auth_code=([^&\s]+)/);
          if (match) {
            console.log('Extracted auth_code via regex:', match[1].substring(0, 50) + '...');
            return match[1];
          }
        }
      }
      
      // Fallback to code parameter
      if (cleanUrl.includes('code=')) {
        try {
          const urlObj = new URL(cleanUrl);
          const code = urlObj.searchParams.get('code');
          if (code && code !== '200') { // Ignore status code
            console.log('Extracted code from URL params:', code);
            return code;
          }
        } catch (urlError) {
          const match = cleanUrl.match(/[?&]code=([^&\s]+)/);
          if (match && match[1] !== '200') {
            console.log('Extracted code via regex:', match[1]);
            return match[1];
          }
        }
      }
      
      // Handle URL fragments
      if (cleanUrl.includes('#auth_code=')) {
        const parts = cleanUrl.split('#auth_code=');
        if (parts.length > 1) {
          const code = parts[1].split('&')[0].split(' ')[0];
          console.log('Extracted from fragment:', code.substring(0, 50) + '...');
          return code;
        }
      }
      
      console.log('No auth_code found in URL');
      return null;
    } catch (error) {
      console.error('Error extracting auth_code from URL:', error);
      return null;
    }
  }

  // Start automatic authentication
  async startAutoAuth(
    authUrl: string, 
    onAuthCode: (authCode: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.authCallback = onAuthCode;

    try {
      if (Platform.OS === 'web') {
        // Web: Use popup window with message listener
        this.handleWebAuth(authUrl, onAuthCode, onError);
      } else {
        // Mobile: Open in system browser, will redirect back via deep link
        const supported = await Linking.canOpenURL(authUrl);
        if (supported) {
          await Linking.openURL(authUrl);
        } else {
          onError('Cannot open authentication URL');
        }
      }
    } catch (error) {
      onError(`Authentication error: ${error}`);
    }
  }

  // Handle web authentication with popup
  private handleWebAuth(
    authUrl: string,
    onAuthCode: (authCode: string) => void,
    onError: (error: string) => void
  ) {
    // For web, we'll open the Fyers URL directly and let user copy the code
    const popup = window.open(authUrl, 'fyersAuth', 'width=500,height=700,scrollbars=yes');
    
    if (!popup) {
      onError('Popup blocked. Please allow popups for this site.');
      return;
    }

    // Since we can't automatically capture the code due to CORS,
    // we'll trigger the manual code entry flow
    setTimeout(() => {
      onError('MANUAL_CODE_ENTRY'); // Special error code to trigger manual entry
    }, 2000);
  }

  // Cleanup
  cleanup() {
    if (Platform.OS !== 'web') {
      Linking.removeAllListeners('url');
    }
    this.authCallback = null;
  }
}