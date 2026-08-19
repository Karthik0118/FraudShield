/**
 * User Avatar Component
 *
 * Initials-based avatar with deterministic background color from user name.
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {Colors, Typography} from '../theme/theme';

interface UserAvatarProps {
  name: string;
  size?: number;
  style?: ViewStyle;
}

/**
 * Deterministically pick a color from the palette based on the name string.
 */
const getAvatarColor = (name: string): string => {
  const colors = Colors.avatarColors;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Extract initials (up to 2 characters) from a name.
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 64,
  style,
}) => {
  const initials = getInitials(name || '??');
  const backgroundColor = getAvatarColor(name || 'User');
  const fontSize = size * 0.38;

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
        style,
      ]}>
      <Text style={[styles.initials, {fontSize}]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
  },
});

export default UserAvatar;
