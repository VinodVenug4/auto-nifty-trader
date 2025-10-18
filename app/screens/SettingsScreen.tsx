import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Switch } from '../../lib/ui';

interface SettingsScreenProps {
  onLogout: () => void;
  isPaperMode: boolean;
  onToggleMode: (isPaper: boolean) => void;
}

export function SettingsScreen({ onLogout, isPaperMode, onToggleMode }: SettingsScreenProps) {
  // Remove local state, use props directly
  const paperMode = isPaperMode;
  


  const handleModeToggle = (enabled: boolean) => {
    if (!enabled) {
      // Switching to real trading - show warning
      if (typeof window !== 'undefined') {
        // Web - use window.confirm
        const confirmed = window.confirm('You are about to switch to REAL TRADING mode. Real money will be used for trades. Are you sure?');
        if (confirmed) {
          onToggleMode(false);
        }
      } else {
        // Mobile - use Alert
        Alert.alert(
          'Switch to Real Trading',
          'You are about to switch to REAL TRADING mode. Real money will be used for trades. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Switch to Real', 
              style: 'destructive',
              onPress: () => onToggleMode(false)
            }
          ]
        );
      }
    } else {
      // Switching to paper trading - safe
      onToggleMode(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Card style={styles.modeCard}>
        <Text style={styles.sectionTitle}>Trading Mode</Text>
        <View style={styles.modeToggle}>
          <View style={styles.modeInfo}>
            <Text style={styles.modeLabel}>
              {paperMode ? 'Paper Trading' : 'Real Trading'}
            </Text>
            <Text style={styles.modeDescription}>
              {paperMode 
                ? 'Simulated trades with real market data' 
                : 'Live trading with real money'
              }
            </Text>
          </View>
          <Switch
            value={paperMode}
            onValueChange={(newValue) => {
              console.log('Switch onValueChange called with:', newValue);
              handleModeToggle(newValue);
            }}
          />
        </View>
        
        {!paperMode && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ REAL TRADING MODE ACTIVE</Text>
            <Text style={styles.warningSubtext}>
              All trades will use real money from your Fyers account
            </Text>
          </View>
        )}
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Trading Mode Info</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>📊 Paper Trading</Text>
          <Text style={styles.infoText}>
            • Virtual ₹1,00,000 balance{'\n'}
            • Real market data{'\n'}
            • No financial risk{'\n'}
            • Perfect for testing strategies
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>💰 Real Trading</Text>
          <Text style={styles.infoText}>
            • Uses your Fyers account balance{'\n'}
            • Real money at risk{'\n'}
            • Actual profit/loss{'\n'}
            • Requires sufficient margin
          </Text>
        </View>
      </Card>

      <Card style={styles.accountCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Button 
          title="Logout" 
          onPress={onLogout} 
          variant="destructive"
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modeCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modeInfo: {
    flex: 1,
    marginRight: 16,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  warningBox: {
    backgroundColor: '#2A1A1A',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#FFAB91',
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  accountCard: {
    padding: 16,
    marginBottom: 16,
  },
});