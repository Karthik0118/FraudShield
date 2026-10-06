/**
 * Risk Factor List Component
 *
 * Renders risk factor progress bars with severity colors.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Typography, Spacing} from '../theme/theme';
import {RiskFactor} from '../types/transaction';
import {getSeverityColor} from '../utils/fraudPatternDetector';

interface Props {
  factors: RiskFactor[];
}

const RiskFactorList: React.FC<Props> = ({factors}) => {
  return (
    <View>
      {factors.map((factor, idx) => {
        const color = getSeverityColor(factor.severity);
        return (
          <View key={idx} style={styles.factorRow}>
            <View style={styles.factorLabelRow}>
              <Text style={styles.factorLabel}>{factor.label}</Text>
              <Text style={[styles.factorPercent, {color}]}>
                {factor.level}%
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {width: `${factor.level}%` as any, backgroundColor: color},
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  factorRow: {
    marginBottom: Spacing.md,
  },
  factorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorLabel: {
    ...Typography.styles.captionMedium,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontSize: 11,
  },
  factorPercent: {
    ...Typography.styles.small,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default RiskFactorList;
