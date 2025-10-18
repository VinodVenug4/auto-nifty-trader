import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from './lib/ui';
import { MainApp } from './app/MainApp';
import AuthScreen from './app/auth';
import { SecurityManager } from './lib/security';
import { logger } from './lib/logger';

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
      // Check device security (root detection)
      const isSecure = await securityManager.checkDeviceSecurity();
      
      if (!isSecure) {
        setDeviceSecure(false);
        setSecurityChecked(true);
        return;
      }

      // Setup app state listener for background locking
      securityManager.setupAppStateListener(() => {
        setIsAppLocked(true);
      });

      setDeviceSecure(true);
      setSecurityChecked(true);
      
      // Authenticate user on app start
      await authenticateUser();
    } catch (error) {
      logger.error('Security initialization failed', error);
      setDeviceSecure(false);
      setSecurityChecked(true);
    }
  };

  const authenticateUser = async () => {
    try {
      const authenticated = await securityManager.authenticateUser();
      if (authenticated) {
        securityManager.unlockApp();
        setIsAppLocked(false);
      } else {
        // Exit app if authentication fails
        Alert.alert(
          'Authentication Failed',
          'App will close for security',
          [{ text: 'OK', onPress: () => {} }]
        );
      }
    } catch (error) {
      logger.error('Authentication error', error);
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

  // Show lock screen
  if (isAppLocked) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.lockTitle}>🔒 App Locked</Text>
        <Text style={styles.lockText}>Authenticate to continue</Text>
        <Button 
          title="Unlock App" 
          onPress={authenticateUser}
          variant="primary"
        />
      </View>
    );
  }

  // Main app content
  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <MainApp onLogout={handleLogout} />
      ) : (
        <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </View>
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