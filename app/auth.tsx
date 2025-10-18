import React, { useState, useEffect } from 'react';
import { View, Alert, TextInput as RNTextInput, Platform, ScrollView } from 'react-native';
import { Text, Button, Card, styles, TextInput } from '../lib/ui.tsx';
import { FyersAPI, FyersCredentials } from '../lib/fyersApi.ts';
import { SecureConfig } from '../lib/config.ts';
import { Linking } from 'react-native';

const secureConfig = SecureConfig.getInstance();
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

  const [authUrl, setAuthUrl] = useState('');

  const openFyersLogin = async () => {
    if (!credentials.clientId) {
      Alert.alert('Error', 'Please enter your Client ID first');
      return;
    }

    try {
      const config = await secureConfig.getCredentials();
      const url = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&state=sample_state`;
      
      setAuthUrl(url);
      setStatus('Click the link below to open Fyers login. After login, paste the redirect URL.');
      
      // Also try to open directly
      try {
        await Linking.openURL(url);
      } catch (linkError) {
        console.log('Direct linking failed, user can click the link');
      }
      
    } catch (error) {
      setStatus('Failed to generate login URL.');
      console.error('Auth error:', error);
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
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('fyers_token', tokenResult.token!);
          } else {
            const { setItemAsync } = require('expo-secure-store');
            await setItemAsync('fyers_token', tokenResult.token!);
          }
        } catch (error) {
          console.log('Token storage failed:', error);
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

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setStatus('Logged out. Enter Client ID to login again.');
    
    // Clear stored token
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('fyers_token');
      } else {
        const { deleteItemAsync } = require('expo-secure-store');
        deleteItemAsync('fyers_token').catch(console.log);
      }
    } catch (error) {
      console.log('Token clear failed:', error);
    }
    
    // Reset auth state but keep config
    setCredentials({ clientId: '', otp: '', pin: '' });
    // Don't clear config - keep it for next login
  };

  // Check for existing credentials
  useEffect(() => {
    const checkExistingConfig = async () => {
      const hasCredentials = await secureConfig.hasCredentials();
      
      if (hasCredentials) {
        const config = await secureConfig.getCredentials();
        fyersApi = new FyersAPI(config);
        setConfigSet(true);
        
        // Check if already authenticated
        try {
          let token = null;
          if (typeof localStorage !== 'undefined') {
            token = localStorage.getItem('fyers_token');
          } else {
            const { getItemAsync } = require('expo-secure-store');
            token = await getItemAsync('fyers_token');
          }
          
          if (token) {
            fyersApi.setAccessToken(token);
            setIsAuthenticated(true);
            setStatus('Already authenticated. Ready to trade.');
          } else {
            setStatus('Ready to login');
          }
        } catch (error) {
          console.log('Token retrieval failed:', error);
          setStatus('Ready to login');
        }
      } else {
        setConfigSet(false);
        setStatus('Configure API credentials first');
      }
    };
    
    checkExistingConfig();
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>
          Fyers Authentication
        </Text>
        <Text style={{ marginBottom: 20, opacity: 0.8 }}>
          Login to your Fyers account to enable live trading
        </Text>
      </Card>

      <View style={{ backgroundColor: '#151b22', padding: 12, borderRadius: 14, marginVertical: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>API Configuration - {Platform.OS}</Text>
        <Text style={{ marginBottom: 15, opacity: 0.8, fontSize: 12 }}>Enter your Fyers API credentials (stored securely on device)</Text>
        
        
        <Text style={{ marginBottom: 6, opacity: 0.8 }}>App ID (with -100)</Text>
        <RNTextInput
          value={appIdInput}
          onChangeText={setAppIdInput}
          placeholder="e.g., ABC12345-100"
          autoCapitalize="none"
          style={[styles.input, { marginBottom: 15 }]}
        />
        
        <Text style={{ marginBottom: 6, opacity: 0.8 }}>Secret Key</Text>
        <RNTextInput
          value={secretKeyInput}
          onChangeText={setSecretKeyInput}
          placeholder="Enter your secret key"
          secureTextEntry
          style={[styles.input, { marginBottom: 15 }]}
        />
        
        <Button
          title="Save Configuration"
          onPress={saveConfig}
        />
      </View>

      {configSet && !isAuthenticated ? (
        <Card>
          <TextInput
            label="Client ID"
            value={credentials.clientId}
            onChangeText={(text) => setCredentials(prev => ({ ...prev, clientId: text }))}
            placeholder="Enter your Fyers Client ID (e.g., XA12345)"
            autoCapitalize="none"
          />
          
          <View style={{ marginBottom: 20 }}>
            <Button
              title={isLoading ? "Opening Login..." : "🚀 Login with Fyers"}
              onPress={openFyersLogin}
              disabled={isLoading || !credentials.clientId}
            />
          </View>
          
          {authUrl && (
            <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#1E3A8A', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#93C5FD', marginBottom: 8 }}>Login URL Generated:</Text>
              <Text 
                style={{ fontSize: 12, color: '#60A5FA', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL(authUrl)}
              >
                Click here to open Fyers login
              </Text>
            </View>
          )}
          
          <TextInput
            label="Paste Redirect URL or Auth Code Here"
            value={credentials.otp}
            onChangeText={(text) => {
              console.log('Input text:', text);
              let finalValue = text;
              
              // First try to extract auth_code (Fyers uses this)
              if (text.includes('auth_code=')) {
                const match = text.match(/[?&]auth_code=([^&\s]+)/);
                if (match) {
                  finalValue = match[1];
                }
              }
              // Fallback to code parameter
              else if (text.includes('code=')) {
                const match = text.match(/[?&]code=([^&\s]+)/);
                if (match) {
                  finalValue = match[1];
                }
              }
              
              setCredentials(prev => ({ ...prev, otp: finalValue }));
            }}
            placeholder="After login, paste the full redirect URL here..."
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
          
          <View style={{ marginTop: 15 }}>
            <Button
              title={isLoading ? "Verifying..." : "Complete Login"}
              onPress={handleLogin}
              disabled={isLoading || !credentials.otp}
            />
          </View>
          
          <Text style={{ fontSize: 11, opacity: 0.6, marginTop: 10, lineHeight: 16 }}>
            📝 Steps:\n
            1. Enter your Client ID above\n
            2. Click "🚀 Login with Fyers"\n
            3. Click the blue link that appears to open browser\n
            4. Login with your Fyers credentials\n
            5. After login, copy the ENTIRE redirect URL\n
            6. Paste the redirect URL above and click "Complete Login"
          </Text>
        </Card>
      ) : null}

      {isAuthenticated ? (
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
          
          <Button 
            title="Reset API Config" 
            onPress={() => {
              secureConfig.clearCredentials();
              setConfigSet(false);
              setStatus('Configure API credentials first');
            }} 
            variant="secondary" 
          />
        </Card>
      ) : null}

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
          4. Use Client ID to authenticate
        </Text>
      </Card>
    </ScrollView>
  );
}