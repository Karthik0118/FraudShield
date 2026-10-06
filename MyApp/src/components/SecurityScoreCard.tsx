/**
 * Security Score Card Component
 *
 * Displays the FraudShield Security Score calculated locally.
 * Not an official banking score — derived from in-app activity.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon from './Icon';
import {SecurityScoreData} from '../utils/securityScore';

interface Props {
  scoreData: SecurityScoreData;
}

const SecurityScoreCard: React.FC<Props> = ({scoreData}) => {
  if (!scoreData.hasEnoughData) {
    return (
      <View style={[styles.container, Shadows.card]}>
        <View style={styles.header}>
          <Icon name="Shield" size={18} color={Colors.primary} style={{marginRight: 6}} />
          <Text style={styles.title}>FraudShield Security Score</Text>
        </View>
        <View style={styles.noDataBox}>
          <Icon name="Info" size={20} color={Colors.textTertiary} />
          <Text style={styles.noDataText}>
            Not enough activity to calculate a reliable score.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, Shadows.card]}>
      <View style={styles.header}>
        <Icon name="Shield" size={18} color={Colors.primary} style={{marginRight: 6}} />
        <Text style={styles.title}>FraudShield Security Score</Text>
      </View>

      {/* Score Circle */}
      <View style={styles.scoreSection}>
        <View style={[styles.scoreCircle, {borderColor: scoreData.color}]}>
          <Text style={[styles.scoreNumber, {color: scoreData.color}]}>
            {scoreData.score}
          </Text>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>
        <View
          style={[
            styles.labelBadge,
            {
              backgroundColor: scoreData.color + '15',
              borderColor: scoreData.color + '30',
            },
          ]}>
          <Text style={[styles.labelText, {color: scoreData.color}]}>
            {scoreData.label.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Transaction Safety</Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${scoreData.breakdown.transactionSafety}%` as any,
                backgroundColor: scoreData.color,
              },
            ]}
          />
        </View>
        <Text style={styles.breakdownDesc}>
          {scoreData.breakdown.description}
        </Text>
      </View>

      <View style={styles.disclaimer}>
        <Icon name="Info" size={12} color={Colors.textTertiary} style={{marginRight: 4}} />
        <Text style={styles.disclaimerText}>
          This is an in-app security metric, not an official banking score.
        </Text>
      </View>
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
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
  },
  noDataBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noDataText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
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
  labelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
  },
  labelText: {
    ...Typography.styles.captionMedium,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  breakdownSection: {
    marginBottom: Spacing.md,
  },
  breakdownTitle: {
    ...Typography.styles.captionMedium,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownDesc: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
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
});

export default SecurityScoreCard;
