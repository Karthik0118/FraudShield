/**
 * Modern Error Banner Component
 *
 * Polished alert banner with Lucide AlertCircle icon, optional retry/dismiss actions.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors, Typography, Spacing} from '../theme/theme';
import Icon from './Icon';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Icon name="AlertCircle" size={18} color={Colors.error} />
        </View>
        <Text style={styles.message}>{message}</Text>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error">
            <Icon name="X" size={16} color={Colors.errorDark} />
          </TouchableOpacity>
        )}
      </View>
      {onRetry && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onRetry}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry action">
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.errorLight,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: Spacing.sm + 2,
    marginTop: 1,
  },
  message: {
    ...Typography.styles.caption,
    color: Colors.errorDark,
    fontWeight: Typography.weights.medium,
    flex: 1,
    lineHeight: 19,
  },
  dismissButton: {
    marginLeft: Spacing.sm,
    padding: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  retryButton: {
    backgroundColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  retryText: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.semibold,
    color: Colors.error,
  },
});

export default ErrorMessage;
