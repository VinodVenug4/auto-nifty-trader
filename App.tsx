import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, Button } from './lib/ui.tsx';
import { MainApp } from './app/MainApp.tsx';
import AuthScreen from './app/auth.tsx';
import { SecurityManager } from './lib/security.ts';
import { logger } from './lib/logger.ts';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [deviceSecure, setDeviceSecure] = useState(true);
  const [securityChecked, setSecurityChecked] = useState(false);

  const securityManager = SecurityManager.getInstance();

  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = async () => {
    try {
      // Skip security checks - directly allow access
      setDeviceSecure(true);
      setSecurityChecked(true);
      setIsAppLocked(false);
    } catch (error) {
      logger.error('Security initialization failed', error);
      setDeviceSecure(true);
      setSecurityChecked(true);
      setIsAppLocked(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAppLocked(true);
    securityManager.lockApp();
  };

  // Show loading while checking security
  if (!securityChecked) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Initializing Security...</Text>
      </View>
    );
  }

  // Show security warning for rooted devices
  if (!deviceSecure) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.warningTitle}>⚠️ Security Warning</Text>
        <Text style={styles.warningText}>
          This device appears to be rooted or compromised.{"\n"}
          The app cannot run on insecure devices for your financial safety.
        </Text>
        <Button 
          title="Exit App" 
          onPress={() => {}} 
          variant="destructive"
        />
      </View>
    );
  }

  // Skip lock screen - removed

  // Main app content
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {isAuthenticated ? (
          <MainApp onLogout={handleLogout} />
        ) : (
          <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  lockText: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 24,
  },
});