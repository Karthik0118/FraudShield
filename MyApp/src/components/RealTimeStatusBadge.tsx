import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../theme/theme';

interface RealTimeStatusBadgeProps {
  sourceApp: string;
  isRealtime: boolean;
}

const RealTimeStatusBadge: React.FC<RealTimeStatusBadgeProps> = ({ sourceApp, isRealtime }) => {
  if (!isRealtime) return null;

  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>⚡ Real-Time · {sourceApp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    backgroundColor: Colors.primaryFaded || '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.primaryBorder || '#C7D2FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...Typography.styles.small,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default RealTimeStatusBadge;
