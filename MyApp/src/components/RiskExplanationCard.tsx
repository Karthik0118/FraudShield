/**
 * Risk Explanation Card
 *
 * Renders the "Explain My Risk" section with risk factors and reasons.
 * All data is locally computed — no external API.
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon from './Icon';
import {RiskExplanation} from '../utils/riskAnalysis';
import RiskFactorList from './RiskFactorList';

interface Props {
  explanation: RiskExplanation;
}

const RiskExplanationCard: React.FC<Props> = ({explanation}) => {
  const [expanded, setExpanded] = useState(true);

  const riskColor =
    explanation.overallRisk === 'CRITICAL' || explanation.overallRisk === 'HIGH'
      ? Colors.error
      : explanation.overallRisk === 'MEDIUM'
      ? Colors.warning
      : Colors.success;

  const riskBg =
    explanation.overallRisk === 'CRITICAL' || explanation.overallRisk === 'HIGH'
      ? Colors.errorLight
      : explanation.overallRisk === 'MEDIUM'
      ? Colors.warningLight
      : Colors.successLight;

  const riskBorder =
    explanation.overallRisk === 'CRITICAL' || explanation.overallRisk === 'HIGH'
      ? Colors.errorBorder
      : explanation.overallRisk === 'MEDIUM'
      ? Colors.warningBorder
      : Colors.successBorder;

  const riskEmoji =
    explanation.overallRisk === 'CRITICAL'
      ? '🔴'
      : explanation.overallRisk === 'HIGH'
      ? '🔴'
      : explanation.overallRisk === 'MEDIUM'
      ? '🟠'
      : '🟢';

  return (
    <View style={[styles.container, Shadows.card]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}>
        <Icon
          name="Info"
          size={18}
          color={Colors.primary}
          style={{marginRight: 6}}
        />
        <Text style={styles.title}>Explain My Risk</Text>
        <Icon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={18}
          color={Colors.textTertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <View>
          {/* Risk Level Banner */}
          <View
            style={[
              styles.riskBanner,
              {backgroundColor: riskBg, borderColor: riskBorder},
            ]}>
            <Text style={styles.riskEmoji}>{riskEmoji}</Text>
            <View style={{flex: 1}}>
              <Text style={[styles.riskLevel, {color: riskColor}]}>
                {explanation.overallRisk} RISK
              </Text>
              <Text style={styles.riskSummary}>{explanation.summary}</Text>
            </View>
          </View>

          {/* Reasons */}
          {explanation.reasons.length > 0 && (
            <View style={styles.reasonsSection}>
              <Text style={styles.sectionLabel}>Why this was flagged:</Text>
              {explanation.reasons.map((reason, idx) => (
                <View key={idx} style={styles.reasonRow}>
                  <Text style={styles.reasonBullet}>•</Text>
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Risk Factors */}
          {explanation.factors.length > 0 && (
            <View style={styles.factorsSection}>
              <Text style={styles.sectionLabel}>Risk Factors:</Text>
              <RiskFactorList factors={explanation.factors} />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  riskEmoji: {
    fontSize: 20,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  riskLevel: {
    ...Typography.styles.bodySemibold,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  riskSummary: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  reasonsSection: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.styles.captionMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs + 2,
  },
  reasonBullet: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginRight: 8,
    lineHeight: 20,
  },
  reasonText: {
    ...Typography.styles.caption,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  factorsSection: {
    marginTop: Spacing.lg,
  },
});

export default RiskExplanationCard;
