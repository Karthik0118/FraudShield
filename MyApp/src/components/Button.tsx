/**
 * Reusable Button Component
 *
 * Supports primary/secondary/outline/danger variants, loading spinner,
 * disabled state, and proper touch feedback.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Colors, Typography, Spacing} from '../theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    variantStyles[variant]?.button,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variantStyles[variant]?.text,
    isDisabled && styles.disabledText,
    textStyle,
  ];

  const spinnerColor =
    variant === 'outline' || variant === 'ghost'
      ? Colors.primary
      : Colors.white;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.buttonVertical,
    paddingHorizontal: Spacing.buttonHorizontal,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    ...Typography.styles.button,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

const variantStyles: Record<
  ButtonVariant,
  {button: ViewStyle; text: TextStyle}
> = {
  primary: {
    button: {
      backgroundColor: Colors.primary,
    },
    text: {
      color: Colors.textInverse,
    },
  },
  secondary: {
    button: {
      backgroundColor: Colors.primaryFaded,
    },
    text: {
      color: Colors.primary,
    },
  },
  outline: {
    button: {
      backgroundColor: 'transparent',
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
    },
    text: {
      color: Colors.textInverse,
    },
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
    },
    text: {
      color: Colors.primary,
    },
  },
};

export default Button;
