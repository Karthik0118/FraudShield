/**
 * Modern Loading / Splash Screen Component
 *
 * Polished centered branding with Lucide Shield icon, spinner, and clean typography.
 */

import React, {useEffect, useRef} from 'react';
import {View, Text, ActivityIndicator, StyleSheet, Animated} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon from './Icon';

const LoadingScreen: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Animated.View
          style={[
            styles.iconCircle,
            Shadows.md,
            {transform: [{scale: pulseAnim}]},
          ]}>
          <Icon name="Shield" size={40} color={Colors.primary} strokeWidth={2.5} />
        </Animated.View>
        <Text style={styles.appName}>FraudShield</Text>
        <Text style={styles.appTagline}>Smart Security Platform</Text>
      </View>
      <ActivityIndicator
        size="small"
        color={Colors.primary}
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>Securing session...</Text>
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
    marginBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appTagline: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xxs,
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  loadingText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});

export default LoadingScreen;
