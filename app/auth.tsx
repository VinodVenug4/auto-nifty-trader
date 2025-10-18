import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Text, Button, Card, TextInput, styles } from '../lib/ui';
import { FyersAPI, FyersCredentials } from '../lib/fyersApi';
import { SecureConfig } from '../lib/config';
import { AutoAuth } from '../lib/autoAuth';

const secureConfig = SecureConfig.getInstance();
const autoAuth = AutoAuth.getInstance();
let fyersApi: FyersAPI;

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [credentials, setCredentials] = useState<FyersCredentials>({
    clientId: '',
    otp: '',
    pin: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [configSet, setConfigSet] = useState(false);
  const [appIdInput, setAppIdInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [status, setStatus] = useState('Configure API credentials first');

  const saveConfig = async () => {
    if (!appIdInput || !secretKeyInput) {
      Alert.alert('Error', 'Please enter both App ID and Secret Key');
      return;
    }

    await secureConfig.setCredentials(appIdInput, secretKeyInput);
    const config = await secureConfig.getCredentials();
    fyersApi = new FyersAPI(config);
    setConfigSet(true);
    setStatus('API credentials saved. Enter your Client ID to begin.');
    Alert.alert('Success', 'API credentials saved securely');
  };

  const openFyersLogin = async () => {
    try {
      const config = await secureConfig.getCredentials();
      
      // Generate Fyers OAuth URL using v3
      const authUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&state=sample_state`;
      
      setStatus('Opening Fyers login...');
      setIsLoading(true);
      
      // Use automatic authentication
      await autoAuth.startAutoAuth(
        authUrl,
        // Success callback - automatically handle auth code
        async (authCode: string) => {
          setStatus('Authentication successful! Getting access token...');
          
          try {
            const tokenResult = await fyersApi.getAccessToken(authCode);
            
            if (tokenResult.success) {
              setIsAuthenticated(true);
              setStatus('Login successful! Ready to trade.');
              
              // Store token securely
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('fyers_token', tokenResult.token!);
              }
              
              Alert.alert('Success', 'Successfully logged in to Fyers!');
              onAuthSuccess?.();
            } else {
              setStatus(`Token exchange failed: ${tokenResult.error}`);
              Alert.alert('Error', `Login failed: ${tokenResult.error}`);
            }
          } catch (error) {
            setStatus(`Error: ${error}`);
            Alert.alert('Error', `Login error: ${error}`);
          } finally {
            setIsLoading(false);
          }
        },
        // Error callback
        (error: string) => {
          if (error === 'MANUAL_CODE_ENTRY') {
            // Switch to manual code entry mode
            setStatus('Login opened in popup. After login, copy the code from URL and paste below.');
            setOtpSent(true);
            setIsLoading(false);
          } else {
            setStatus(`Authentication failed: ${error}`);
            Alert.alert('Error', error);
            setIsLoading(false);
          }
        }
      );
      
    } catch (error) {
      setStatus(`Error: ${error}`);
      Alert.alert('Error', 'Failed to start authentication');
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!credentials.otp) {
      Alert.alert('Error', 'Please enter the auth code');
      return;
    }

    setIsLoading(true);
    setStatus('Getting access token...');

    try {
      // Exchange auth code for access token
      const tokenResult = await fyersApi.getAccessToken(credentials.otp);
      
      if (tokenResult.success) {
        setIsAuthenticated(true);
        setStatus('Login successful! Ready to trade.');
        
        // Store token securely
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('fyers_token', tokenResult.token!);
        }
        
        Alert.alert('Success', 'Successfully logged in to Fyers!');
        onAuthSuccess?.();
      } else {
        setStatus(`Token exchange failed: ${tokenResult.error}`);
        Alert.alert('Error', `Login failed: ${tokenResult.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
      Alert.alert('Error', `Login error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStatus('Logged out. Enter Client ID to login again.');
    
    // Clear stored token
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fyers_token');
    }
    
    // Reset auth state but keep config
    setCredentials({ clientId: '', otp: '', pin: '' });
    setOtpSent(false);
    // Don't clear config - keep it for next login
  };

  // Check for existing credentials and setup deep linking
  useEffect(() => {
    const checkExistingConfig = async () => {
      if (secureConfig.hasCredentials()) {
        const config = await secureConfig.getCredentials();
        fyersApi = new FyersAPI(config);
        setConfigSet(true);
        
        // Check if already authenticated
        if (typeof localStorage !== 'undefined') {
          const token = localStorage.getItem('fyers_token');
          if (token) {
            fyersApi.setAccessToken(token);
            setIsAuthenticated(true);
            setStatus('Already authenticated. Ready to trade.');
          } else {
            setStatus('Ready for automatic login');
          }
        }
      }
    };
    
    // Setup deep linking for mobile
    autoAuth.setupDeepLinking();
    
    checkExistingConfig();
    
    // Cleanup on unmount
    return () => {
      autoAuth.cleanup();
    };
  }, []);

  const testConnection = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      setStatus('Testing connection...');
      const niftyPrice = await fyersApi.getNiftyPrice();
      setStatus(`Connection OK! NIFTY: ₹${niftyPrice.toFixed(2)}`);
      Alert.alert('Success', `NIFTY 50: ₹${niftyPrice.toFixed(2)}`);
    } catch (error) {
      setStatus(`Connection test failed: ${error}`);
      Alert.alert('Error', 'Connection test failed');
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>
          Fyers Authentication
        </Text>
        <Text style={{ marginBottom: 20, opacity: 0.8 }}>
          Login to your Fyers account to enable live trading
        </Text>
      </Card>

      {!configSet ? (
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>API Configuration</Text>
          <Text style={{ marginBottom: 15, opacity: 0.8, fontSize: 12 }}>Enter your Fyers API credentials (stored securely on device)</Text>
          
          <TextInput
            label="App ID (with -100)"
            value={appIdInput}
            onChangeText={setAppIdInput}
            placeholder="e.g., ABC12345-100"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Secret Key"
            value={secretKeyInput}
            onChangeText={setSecretKeyInput}
            placeholder="Enter your secret key"
            secureTextEntry
          />
          
          <Button
            title="Save Configuration"
            onPress={saveConfig}
          />
        </Card>
      ) : !isAuthenticated ? (
        <Card>
          <TextInput
            label="Client ID"
            value={credentials.clientId}
            onChangeText={(text) => setCredentials(prev => ({ ...prev, clientId: text }))}
            placeholder="Enter your Fyers Client ID (e.g., XA12345)"
            autoCapitalize="none"
            editable={!otpSent}
          />
          
          {!otpSent ? (
            <>
              <Button
                title={isLoading ? "Opening Login..." : "🚀 Login with Fyers"}
                onPress={openFyersLogin}
                disabled={isLoading}
              />
              
              <Text style={{ fontSize: 12, opacity: 0.7, marginTop: 10, textAlign: 'center' }}>
                Opens Fyers login in popup window
              </Text>
            </>
          ) : (
            <>
              <TextInput
                label="Redirect URL or Auth Code"
                value={credentials.otp}
                onChangeText={(text) => {
                  console.log('Input text:', text);
                  // Auto-extract code if full URL is pasted
                  const extractedCode = AutoAuth.extractCodeFromUrl(text);
                  console.log('Extracted code:', extractedCode);
                  const finalValue = extractedCode || text;
                  setCredentials(prev => ({ ...prev, otp: finalValue }));
                }}
                placeholder="Paste the full redirect URL here..."
                autoCapitalize="none"
                multiline={true}
                numberOfLines={4}
                style={{ minHeight: 100 }}
              />
              
              {credentials.otp && (
                <Text style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                  Code detected: {credentials.otp.length > 50 ? credentials.otp.substring(0, 50) + '...' : credentials.otp}
                </Text>
              )}
              
              <Button
                title={isLoading ? "Verifying..." : "Complete Login"}
                onPress={handleLogin}
                disabled={isLoading || !credentials.otp}
              />
              
              <Button
                title="Open Login Again"
                onPress={() => { setOtpSent(false); openFyersLogin(); }}
                variant="secondary"
              />
              
              <Text style={{ fontSize: 11, opacity: 0.6, marginTop: 10, lineHeight: 16 }}>
                📝 After login, Fyers will redirect to a URL like:\n
                https://myapp.fyers.in/?code=ABC123...\n
                Copy the code after "?code=" and paste above
              </Text>
            </>
          )}
        </Card>
      ) : (
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#059669' }}>
            ✅ Successfully Authenticated
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Logged in as: {credentials.clientId}
          </Text>
          
          <View style={{ marginBottom: 10 }}>
            <Button title="Test Connection" onPress={testConnection} variant="secondary" />
          </View>
          
          <Button title="Logout" onPress={handleLogout} variant="danger" />
        </Card>
      )}

      <Card>
        <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 5 }}>Status:</Text>
        <Text style={{ opacity: 0.8 }}>{status}</Text>
      </Card>

      <Card>
        <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 10 }}>Setup Instructions:</Text>
        <Text style={{ fontSize: 12, opacity: 0.7, lineHeight: 18 }}>
          Security: API credentials are stored securely on device using Expo SecureStore.{'\n'}{'\n'}
          Fyers Setup:{'\n'}
          1. Create User App in Fyers Developer Portal{'\n'}
          2. Set Redirect URI: https://myapp.fyers.in/{'\n'}
          3. Enter App ID and Secret Key in the app{'\n'}
          4. Use Client ID + OTP + PIN to authenticate
        </Text>
      </Card>
    </View>
  );
}