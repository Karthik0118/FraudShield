import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import DeviceSecurityBridge, {
  SecurityScanResult,
  DeviceSecurityAssessment,
  evaluateDeviceSecurity,
  DeviceRiskReason,
} from '../../services/DeviceSecurityBridge';

const DeviceSecurityScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [assessment, setAssessment] = useState<DeviceSecurityAssessment | null>(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    const result = await DeviceSecurityBridge.runSecurityScan();
    if (result) {
      const evaluation = evaluateDeviceSecurity(result);
      setAssessment(evaluation);
      
      // Save risk state to async storage to prevent spamming notifications (basic logic for demonstration)
      // If critical, notify if changed.
      // (This logic can also live in HomeScreen or App.tsx for background check)
    }
    setScanning(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const handleAction = async (actionType?: string) => {
    switch (actionType) {
      case 'accessibility':
      case 'security':
        await DeviceSecurityBridge.openSecuritySettings();
        break;
      case 'developer':
        await DeviceSecurityBridge.openDeveloperSettings();
        break;
      case 'apps':
        await DeviceSecurityBridge.openAppSettings();
        break;
      case 'notification':
        // Notification listener settings is best handled by standard action or fall back to security
        await DeviceSecurityBridge.openSecuritySettings();
        break;
      default:
        await DeviceSecurityBridge.openSecuritySettings();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'danger':
        return {name: 'AlertTriangle' as const, color: Colors.error};
      case 'warning':
        return {name: 'AlertCircle' as const, color: Colors.warning};
      default:
        return {name: 'Info' as const, color: Colors.primary};
    }
  };

  if (loading && !assessment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing device security...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={scanning} onRefresh={runScan} />
        }>
        
        {/* Status Banner */}
        {assessment && (
          <View
            style={[
              styles.statusBanner,
              assessment.riskLevel === 'CRITICAL' && styles.statusBannerCritical,
              assessment.riskLevel === 'HIGH' && styles.statusBannerHigh,
              assessment.riskLevel === 'MEDIUM' && styles.statusBannerMedium,
              assessment.riskLevel === 'LOW' && styles.statusBannerLow,
            ]}>
            <Icon
              name={
                assessment.riskLevel === 'CRITICAL' || assessment.riskLevel === 'HIGH'
                  ? 'AlertTriangle'
                  : assessment.riskLevel === 'MEDIUM'
                  ? 'AlertCircle'
                  : 'ShieldCheck'
              }
              size={32}
              color={assessment.color}
              strokeWidth={2.5}
            />
            <Text style={[styles.statusTitle, {color: assessment.color}]}>
              {assessment.label}
            </Text>
            {assessment.riskLevel !== 'LOW' ? (
              <Text style={styles.statusSubtitle}>
                These signals may indicate increased device security risk. They do not prove that your device has been compromised.
              </Text>
            ) : (
              <Text style={styles.statusSubtitle}>
                No significant security risks were detected.
              </Text>
            )}
          </View>
        )}

        {/* Security Score Card */}
        {assessment && (
          <View style={[styles.card, Shadows.card]}>
            <View style={styles.cardHeader}>
              <Icon name="Shield" size={18} color={Colors.primary} style={{marginRight: 6}} />
              <Text style={styles.cardTitle}>Device Security Score</Text>
            </View>
            <View style={styles.scoreSection}>
              <View style={[styles.scoreCircle, {borderColor: assessment.color}]}>
                <Text style={[styles.scoreNumber, {color: assessment.color}]}>
                  {assessment.score}
                </Text>
                <Text style={styles.scoreLabel}>SCORE</Text>
              </View>
              <Text style={styles.checksText}>
                {assessment.passedChecks} of {assessment.totalChecks} Checks Passed
              </Text>
            </View>
            <View style={styles.disclaimer}>
              <Icon name="Info" size={12} color={Colors.textTertiary} style={{marginRight: 4}} />
              <Text style={styles.disclaimerText}>
                Device Security Score evaluates local configuration. It is separate from the FraudShield Financial Safety Score.
              </Text>
            </View>
          </View>
        )}

        {/* Actionable Reasons */}
        {assessment && assessment.reasons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Risks</Text>
            {assessment.reasons.map((reason: DeviceRiskReason, index: number) => {
              const iconDef = getSeverityIcon(reason.severity);
              return (
                <View key={reason.id} style={[styles.reasonCard, Shadows.sm]}>
                  <View style={styles.reasonHeader}>
                    <Icon name={iconDef.name} size={20} color={iconDef.color} />
                    <Text style={styles.reasonTitle}>{reason.title}</Text>
                  </View>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                  
                  {reason.actionLabel && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAction(reason.actionType)}>
                      <Text style={styles.actionButtonText}>{reason.actionLabel}</Text>
                      <Icon name="ChevronRight" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Scan Actions */}
        <Button
          title={scanning ? "Scanning..." : "Scan Device Again"}
          onPress={runScan}
          disabled={scanning}
          variant="primary"
          style={styles.scanButton}
        />
        
        {assessment && (
          <Text style={styles.timestamp}>
            Last checked: {new Date(assessment.scanTimestamp).toLocaleString()}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  statusBanner: {
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  statusBannerCritical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBannerHigh: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBannerMedium: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusBannerLow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusTitle: {
    ...Typography.styles.heading2,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  statusSubtitle: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreLabel: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: -2,
  },
  checksText: {
    ...Typography.styles.bodyMedium,
    color: Colors.textSecondary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  disclaimerText: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    flex: 1,
    lineHeight: 16,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reasonCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  reasonTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  reasonDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  scanButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timestamp: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

export default DeviceSecurityScreen;
