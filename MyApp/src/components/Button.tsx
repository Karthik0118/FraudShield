/**
 * Modern Button Component
 *
 * Supports primary, secondary, outline, danger, ghost variants.
 * Features left/right Lucide icon support, size scaling, loading spinner,
 * and tactile press feedback.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon, {IconName} from './Icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = true,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    sizeStyles[size].button,
    variantStyles[variant]?.button,
    variant === 'primary' && Shadows.sm,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    isDisabled && variant === 'primary' && styles.disabledPrimary,
    style,
  ];

  const textStyles = [
    styles.text,
    sizeStyles[size].text,
    variantStyles[variant]?.text,
    isDisabled && styles.disabledText,
    textStyle,
  ];

  const getIconColor = () => {
    if (isDisabled) return Colors.textTertiary;
    switch (variant) {
      case 'primary':
      case 'danger':
        return Colors.white;
      case 'secondary':
      case 'ghost':
        return Colors.primary;
      case 'outline':
        return Colors.textPrimary;
      default:
        return Colors.textPrimary;
    }
  };

  const spinnerColor =
    variant === 'outline' || variant === 'ghost' || variant === 'secondary'
      ? Colors.primary
      : Colors.white;

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{disabled: isDisabled, busy: loading}}>
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={iconSize}
              color={getIconColor()}
              style={styles.leftIcon}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && (
            <Icon
              name={rightIcon}
              size={iconSize}
              color={getIconColor()}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  text: {
    ...Typography.styles.button,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledPrimary: {
    backgroundColor: Colors.disabled,
  },
  disabledText: {
    color: Colors.textTertiary,
  },
});

const sizeStyles: Record<
  ButtonSize,
  {button: ViewStyle; text: TextStyle}
> = {
  sm: {
    button: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      minHeight: 38,
      borderRadius: Spacing.borderRadius.sm,
    },
    text: {
      ...Typography.styles.buttonSmall,
    },
  },
  md: {
    button: {
      paddingVertical: Spacing.buttonVertical,
      paddingHorizontal: Spacing.buttonHorizontal,
      minHeight: Spacing.buttonHeight,
      borderRadius: Spacing.borderRadius.md,
    },
    text: {
      ...Typography.styles.button,
    },
  },
  lg: {
    button: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xxl,
      minHeight: 56,
      borderRadius: Spacing.borderRadius.lg,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
    },
  },
};

const variantStyles: Record<
  ButtonVariant,
  {button: ViewStyle; text: TextStyle}
> = {
  primary: {
    button: {
      backgroundColor: Colors.primary,
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    text: {
      color: Colors.textInverse,
    },
  },
  secondary: {
    button: {
      backgroundColor: Colors.primaryFaded,
      borderWidth: 1,
      borderColor: Colors.primaryBorder,
    },
    text: {
      color: Colors.primary,
    },
  },
  outline: {
    button: {
      backgroundColor: Colors.white,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    text: {
      color: Colors.textPrimary,
    },
  },
  danger: {
    button: {
      backgroundColor: Colors.error,
      borderWidth: 1,
      borderColor: Colors.error,
    },
    text: {
      color: Colors.textInverse,
    },
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    text: {
      color: Colors.primary,
    },
  },
};

export default Button;
