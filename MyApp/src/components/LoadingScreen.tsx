/**
 * Loading Screen Component
 *
 * Full-screen loading indicator with app branding.
 * Used during the initial authentication state check.
 */

import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {Colors, Typography, Spacing} from '../theme/theme';

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🛡️</Text>
        </View>
        <Text style={styles.appName}>FraudShield</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconText: {
    fontSize: 36,
  },
  appName: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
  },
  spinner: {
    marginBottom: Spacing.lg,
  },
  loadingText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
  },
});

export default LoadingScreen;
