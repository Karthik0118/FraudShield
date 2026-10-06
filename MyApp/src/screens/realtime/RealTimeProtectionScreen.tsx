import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../../theme/theme';
import Icon from '../../components/Icon';
import RealTimeProtectionBridge from '../../services/RealTimeProtectionBridge';
import { useFocusEffect } from '@react-navigation/native';

const RealTimeProtectionScreen = () => {
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(false);
  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    const notificationAccess = await RealTimeProtectionBridge.isNotificationAccessEnabled();
    setIsNotificationAccessEnabled(notificationAccess);
    const protectionStatus = await RealTimeProtectionBridge.isRealtimeProtectionEnabled();
    setIsProtectionEnabled(protectionStatus);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      checkStatus();
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const toggleProtection = async (value: boolean) => {
    setIsProtectionEnabled(value);
    await RealTimeProtectionBridge.setRealtimeProtectionEnabled(value);
    // recheck
    checkStatus();
  };

  const openSettings = async () => {
    await RealTimeProtectionBridge.openNotificationAccessSettings();
  };

  const renderSupportedApp = (name: string, iconName: string) => (
    <View style={styles.appRow} key={name}>
      <View style={styles.appRowLeft}>
        <View style={styles.appIconBox}>
          <Icon name={iconName as any} size={20} color={Colors.textSecondary} />
        </View>
        <Text style={styles.appName}>{name}</Text>
      </View>
      <View style={styles.monitoredBadge}>
        <Text style={styles.monitoredText}>Monitored</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <Icon name="Shield" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Real-Time Protection</Text>
          <Text style={styles.headerSubtitle}>Automatic payment monitoring</Text>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Transaction Monitoring</Text>
            <Switch
              value={isProtectionEnabled}
              onValueChange={toggleProtection}
              trackColor={{ false: Colors.textTertiary, true: Colors.primary }}
              thumbColor={Colors.white}
              disabled={loading}
            />
          </View>
          <Text style={[styles.statusText, { color: isProtectionEnabled ? Colors.success : Colors.textSecondary }]}>
            {isProtectionEnabled ? 'Active - Monitoring payment notifications' : 'Disabled'}
          </Text>
        </View>

        {/* Notification Access Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notification Access</Text>
          <View style={styles.accessStatusRow}>
            <Icon
              name={isNotificationAccessEnabled ? 'CheckCircle2' : 'AlertCircle'}
              size={20}
              color={isNotificationAccessEnabled ? Colors.success : Colors.error}
            />
            <Text style={[styles.accessStatusText, { color: isNotificationAccessEnabled ? Colors.success : Colors.error }]}>
              {isNotificationAccessEnabled ? 'Enabled' : 'Not Enabled'}
            </Text>
          </View>
          
          {!isNotificationAccessEnabled && (
            <>
              <Text style={styles.accessExplanation}>
                FraudShield needs notification access to detect payment notifications and analyze transactions automatically.
              </Text>
              <TouchableOpacity style={styles.button} onPress={openSettings}>
                <Text style={styles.buttonText}>Open Notification Access Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Protected Apps Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supported Payment Apps</Text>
          <View style={styles.appsList}>
            {renderSupportedApp('PhonePe', 'Activity')}
            {renderSupportedApp('Google Pay', 'Activity')}
            {renderSupportedApp('Paytm', 'Activity')}
            {renderSupportedApp('BHIM', 'Activity')}
            {renderSupportedApp('WhatsApp Pay', 'Activity')}
            {renderSupportedApp('Banking Apps', 'Activity')}
          </View>
        </View>

        {/* How It Works Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How It Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>1</Text></View>
            <Text style={styles.stepText}>Payment notification arrives</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>2</Text></View>
            <Text style={styles.stepText}>FraudShield extracts transaction details</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>3</Text></View>
            <Text style={styles.stepText}>GCN model analyzes for fraud patterns</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>4</Text></View>
            <Text style={styles.stepText}>Alert shown if risk is detected</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Icon name="Info" size={16} color={Colors.textTertiary} />
          <Text style={styles.disclaimerText}>
            FraudShield only processes payment-related notifications. Personal messages and other notifications are never accessed or stored.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.screenHorizontal,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryFaded || '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg || 16,
    padding: Spacing.cardPadding || 20,
    marginBottom: 16,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    ...Typography.styles.heading3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statusText: {
    ...Typography.styles.body,
    marginTop: 4,
  },
  accessStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accessStatusText: {
    ...Typography.styles.body,
    fontWeight: '600',
    marginLeft: 8,
  },
  accessExplanation: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md || 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
  },
  appsList: {
    marginTop: 4,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  appRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  monitoredBadge: {
    backgroundColor: Colors.successLight || '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  monitoredText: {
    ...Typography.styles.small,
    color: Colors.successDark || '#065F46',
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default RealTimeProtectionScreen;
