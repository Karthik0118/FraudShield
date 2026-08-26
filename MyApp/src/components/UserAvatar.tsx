/**
 * Modern User Avatar Component
 *
 * Initials-based avatar with deterministic vibrant styling and subtle border.
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {Colors, Typography, Shadows} from '../theme/theme';

interface UserAvatarProps {
  name: string;
  size?: number;
  style?: ViewStyle;
  showRing?: boolean;
}

const getAvatarColor = (name: string): string => {
  const colors = Colors.avatarColors;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || '??').toUpperCase();
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 56,
  style,
  showRing = false,
}) => {
  const initials = getInitials(name || 'User');
  const backgroundColor = getAvatarColor(name || 'User');
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        showRing && styles.ring,
        Shadows.sm,
        style,
      ]}>
      <Text style={[styles.initials, {fontSize, lineHeight: fontSize + 4}]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  ring: {
    borderColor: Colors.primaryBorder,
    borderWidth: 2.5,
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
  },
});

export default UserAvatar;
