import * as SecureStore from 'expo-secure-store';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';

export function useFyersAuth() {
  const clientId = 'YOUR_FYERS_APP_ID-100';
  const redirectUri = makeRedirectUri({ scheme: 'expo-autotrader' });
  const discovery = { authorizationEndpoint: 'https://api.fyers.in/api/v3/generate-authcode' };
  const [request, response, promptAsync] = useAuthRequest({ clientId, redirectUri, responseType: 'code' }, discovery);
  
  const handleResponse = async () => {
    if (response?.type === 'success') {
      try {
        const tokenRes = await fetch('https://your-backend/fyers/token', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response.params) 
        });
        if (!tokenRes.ok) throw new Error('Token exchange failed');
        const { access_token } = await tokenRes.json();
        await SecureStore.setItemAsync('fyers:access', access_token);
      } catch (error) {
        console.error('Auth error:', error);
        throw error;
      }
    }
  };
  
  return { request, response, promptAsync, handleResponse };
}
