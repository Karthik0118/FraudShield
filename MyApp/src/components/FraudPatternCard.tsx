/**
 * Fraud Pattern Card Component
 *
 * Displays detected fraud patterns with severity indicators.
 * Only shows patterns that were actually detected from real data.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon from './Icon';
import {FraudPattern} from '../types/transaction';
import {getSeverityColor, getSeverityEmoji} from '../utils/fraudPatternDetector';

interface Props {
  patterns: FraudPattern[];
}

const FraudPatternCard: React.FC<Props> = ({patterns}) => {
  if (patterns.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, Shadows.card]}>
      <View style={styles.header}>
        <Icon name="Zap" size={18} color={Colors.primary} style={{marginRight: 6}} />
        <Text style={styles.title}>Detected Patterns</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{patterns.length}</Text>
        </View>
      </View>

      {patterns.map((pattern, index) => (
        <View
          key={pattern.id}
          style={[
            styles.patternItem,
            index === patterns.length - 1 && styles.patternItemLast,
          ]}>
          <View style={styles.patternHeader}>
            <Text style={styles.severityEmoji}>
              {getSeverityEmoji(pattern.severity)}
            </Text>
            <Text style={styles.patternTitle}>{pattern.title}</Text>
            {pattern.value && (
              <View
                style={[
                  styles.valueBadge,
                  {
                    backgroundColor:
                      getSeverityColor(pattern.severity) + '15',
                    borderColor: getSeverityColor(pattern.severity) + '30',
                  },
                ]}>
                <Text
                  style={[
                    styles.valueText,
                    {color: getSeverityColor(pattern.severity)},
                  ]}>
                  {pattern.value}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.patternDescription}>{pattern.description}</Text>
        </View>
      ))}
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
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Spacing.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  countText: {
    ...Typography.styles.small,
    fontWeight: '700',
    color: Colors.primary,
  },
  patternItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  patternItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  patternTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    marginLeft: 8,
  },
  valueText: {
    ...Typography.styles.small,
    fontWeight: '600',
  },
  patternDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    lineHeight: 19,
    paddingLeft: 22,
  },
});

export default FraudPatternCard;
