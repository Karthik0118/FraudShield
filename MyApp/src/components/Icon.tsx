/**
 * Lucide React Icon System for React Native
 *
 * Implements standard Lucide React icons with consistent 24x24 geometry,
 * stroke weights, and colors. Built purely in React Native for 100% cross-platform
 * runtime stability.
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Colors from '../theme/colors';

export type IconName =
  | 'Home'
  | 'User'
  | 'Settings'
  | 'Shield'
  | 'ShieldCheck'
  | 'Lock'
  | 'Mail'
  | 'Phone'
  | 'Eye'
  | 'EyeOff'
  | 'LogOut'
  | 'ChevronRight'
  | 'ChevronLeft'
  | 'AlertCircle'
  | 'CheckCircle2'
  | 'Check'
  | 'KeyRound'
  | 'Activity'
  | 'Sparkles'
  | 'Clock'
  | 'Calendar'
  | 'Edit3'
  | 'Info'
  | 'X'
  | 'ArrowRight'
  | 'ScanLine'
  | 'MessageSquare';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = Colors.textPrimary,
  strokeWidth = 2,
  style,
}) => {
  const scale = size / 24;

  const renderIconContent = () => {
    switch (name) {
      case 'Home':
        return (
          <View style={iconStyles.canvas}>
            {/* Roof */}
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 6,
                width: 12,
                height: 12,
                borderTopWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '45deg'}],
                borderTopLeftRadius: 2,
              }}
            />
            {/* Base */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 5,
                width: 14,
                height: 10,
                borderLeftWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderBottomWidth: strokeWidth,
                borderColor: color,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
            {/* Door */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 9,
                width: 6,
                height: 6,
                borderTopWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
              }}
            />
          </View>
        );

      case 'User':
        return (
          <View style={iconStyles.canvas}>
            {/* Head */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Body */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 4,
                width: 16,
                height: 8,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderTopWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
              }}
            />
          </View>
        );

      case 'Settings':
        return (
          <View style={iconStyles.canvas}>
            {/* Outer cog base */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Inner circle */}
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Cross teeth */}
            <View
              style={{
                position: 'absolute',
                top: 1,
                left: 11,
                width: 2,
                height: 4,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 1,
                left: 11,
                width: 2,
                height: 4,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 1,
                width: 4,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 11,
                right: 1,
                width: 4,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
        );

      case 'Shield':
      case 'ShieldCheck':
        return (
          <View style={iconStyles.canvas}>
            {/* Shield Outline */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 4,
                width: 16,
                height: 14,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {name === 'ShieldCheck' ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 8,
                  height: 4,
                  borderLeftWidth: strokeWidth,
                  borderBottomWidth: strokeWidth,
                  borderColor: color,
                  transform: [{rotate: '-45deg'}],
                }}
              />
            ) : null}
          </View>
        );

      case 'Lock':
        return (
          <View style={iconStyles.canvas}>
            {/* Shackle */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 7,
                width: 10,
                height: 9,
                borderTopLeftRadius: 5,
                borderTopRightRadius: 5,
                borderWidth: strokeWidth,
                borderBottomWidth: 0,
                borderColor: color,
              }}
            />
            {/* Body */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 5,
                width: 14,
                height: 11,
                borderRadius: 3,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Keyhole */}
            <View
              style={{
                position: 'absolute',
                bottom: 7,
                left: 11,
                width: 2,
                height: 3,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
        );

      case 'Mail':
        return (
          <View style={iconStyles.canvas}>
            {/* Envelope Body */}
            <View
              style={{
                position: 'absolute',
                top: 5,
                left: 3,
                width: 18,
                height: 14,
                borderRadius: 3,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* V Flap */}
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 7,
                width: 10,
                height: 8,
                borderBottomWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '-45deg'}],
              }}
            />
          </View>
        );

      case 'Phone':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 6,
                width: 12,
                height: 18,
                borderRadius: 4,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Screen indicator */}
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 10,
                width: 4,
                height: 1.5,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            {/* Home button */}
            <View
              style={{
                position: 'absolute',
                bottom: 5,
                left: 10.5,
                width: 3,
                height: 3,
                borderRadius: 1.5,
                borderWidth: 1,
                borderColor: color,
              }}
            />
          </View>
        );

      case 'Eye':
        return (
          <View style={iconStyles.canvas}>
            {/* Eye Shape */}
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 3,
                width: 18,
                height: 10,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
                transform: [{scaleY: 0.8}],
              }}
            />
            {/* Pupil */}
            <View
              style={{
                position: 'absolute',
                top: 9,
                left: 9,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'EyeOff':
        return (
          <View style={iconStyles.canvas}>
            {/* Eye Shape */}
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 3,
                width: 18,
                height: 10,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
                transform: [{scaleY: 0.8}],
              }}
            />
            {/* Pupil */}
            <View
              style={{
                position: 'absolute',
                top: 9,
                left: 9,
                width: 6,
                height: 6,
                borderRadius: 3,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Slash */}
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 2,
                width: 20,
                height: strokeWidth,
                backgroundColor: color,
                transform: [{rotate: '-45deg'}],
              }}
            />
          </View>
        );

      case 'LogOut':
        return (
          <View style={iconStyles.canvas}>
            {/* Door Frame */}
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 10,
                height: 16,
                borderTopWidth: strokeWidth,
                borderBottomWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
                borderColor: color,
              }}
            />
            {/* Arrow shaft */}
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 10,
                width: 9,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
            {/* Arrow head */}
            <View
              style={{
                position: 'absolute',
                top: 9,
                right: 3,
                width: 6,
                height: 6,
                borderTopWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '45deg'}],
              }}
            />
          </View>
        );

      case 'ChevronRight':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 9,
                width: 8,
                height: 8,
                borderTopWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '45deg'}],
              }}
            />
          </View>
        );

      case 'ChevronLeft':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 9,
                width: 8,
                height: 8,
                borderBottomWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '45deg'}],
              }}
            />
          </View>
        );

      case 'AlertCircle':
        return (
          <View style={iconStyles.canvas}>
            {/* Circle */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Exclamation line */}
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 11,
                width: 2,
                height: 6,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            {/* Dot */}
            <View
              style={{
                position: 'absolute',
                bottom: 6,
                left: 11,
                width: 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'CheckCircle2':
        return (
          <View style={iconStyles.canvas}>
            {/* Circle */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Checkmark */}
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                width: 8,
                height: 5,
                borderLeftWidth: strokeWidth,
                borderBottomWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '-45deg'}],
              }}
            />
          </View>
        );

      case 'Check':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 6,
                width: 12,
                height: 7,
                borderLeftWidth: strokeWidth,
                borderBottomWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '-45deg'}],
              }}
            />
          </View>
        );

      case 'KeyRound':
        return (
          <View style={iconStyles.canvas}>
            {/* Head circle */}
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Stem */}
            <View
              style={{
                position: 'absolute',
                bottom: 5,
                right: 5,
                width: 9,
                height: strokeWidth,
                backgroundColor: color,
                transform: [{rotate: '-45deg'}],
              }}
            />
            {/* Teeth */}
            <View
              style={{
                position: 'absolute',
                bottom: 4,
                right: 7,
                width: strokeWidth,
                height: 4,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'Activity':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 3,
                width: 4,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 7,
                width: 5,
                height: 10,
                borderLeftWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
                transform: [{skewX: '20deg'}],
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 11,
                right: 3,
                width: 6,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'Sparkles':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 7,
                width: 10,
                height: 10,
                borderWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '45deg'}, {scale: 0.7}],
                borderRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 3,
                width: 6,
                height: 6,
                borderWidth: strokeWidth - 0.5,
                borderColor: color,
                transform: [{rotate: '45deg'}, {scale: 0.6}],
              }}
            />
          </View>
        );

      case 'Clock':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Hour hand */}
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 11,
                width: 2,
                height: 5,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            {/* Minute hand */}
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 11,
                width: 5,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
        );

      case 'Calendar':
        return (
          <View style={iconStyles.canvas}>
            {/* Header hooks */}
            <View
              style={{
                position: 'absolute',
                top: 2,
                left: 7,
                width: 2,
                height: 4,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 7,
                width: 2,
                height: 4,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            {/* Calendar body */}
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 16,
                height: 16,
                borderRadius: 3,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Divider line */}
            <View
              style={{
                position: 'absolute',
                top: 9,
                left: 4,
                width: 16,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'Edit3':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 14,
                borderWidth: strokeWidth,
                borderColor: color,
                borderRadius: 2,
                transform: [{rotate: '45deg'}],
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 3,
                width: 8,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'Info':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 7,
                left: 11,
                width: 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 11,
                width: 2,
                height: 5,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
        );

      case 'X':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 4,
                width: 16,
                height: strokeWidth,
                backgroundColor: color,
                transform: [{rotate: '45deg'}],
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 4,
                width: 16,
                height: strokeWidth,
                backgroundColor: color,
                transform: [{rotate: '-45deg'}],
              }}
            />
          </View>
        );

      case 'ArrowRight':
        return (
          <View style={iconStyles.canvas}>
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 4,
                width: 14,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 4,
                width: 7,
                height: 7,
                borderTopWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '45deg'}],
              }}
            />
          </View>
        );

      case 'ScanLine':
        return (
          <View style={iconStyles.canvas}>
            {/* Horizontal scan line */}
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: 3,
                right: 3,
                height: strokeWidth,
                backgroundColor: color,
              }}
            />
            {/* Top-left corner */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 6,
                height: 6,
                borderTopWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Top-right corner */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 6,
                height: 6,
                borderTopWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Bottom-left corner */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 3,
                width: 6,
                height: 6,
                borderBottomWidth: strokeWidth,
                borderLeftWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Bottom-right corner */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                right: 3,
                width: 6,
                height: 6,
                borderBottomWidth: strokeWidth,
                borderRightWidth: strokeWidth,
                borderColor: color,
              }}
            />
          </View>
        );

      case 'MessageSquare':
        return (
          <View style={iconStyles.canvas}>
            {/* Bubble body */}
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 18,
                height: 14,
                borderRadius: 3,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
            {/* Tail */}
            <View
              style={{
                position: 'absolute',
                bottom: 3,
                left: 6,
                width: 5,
                height: 5,
                borderLeftWidth: strokeWidth,
                borderBottomWidth: strokeWidth,
                borderColor: color,
                transform: [{rotate: '0deg'}],
              }}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name}>
      <View
        style={{
          width: 24,
          height: 24,
          transform: [{scale}],
        }}>
        {renderIconContent()}
      </View>
    </View>
  );
};

const iconStyles = StyleSheet.create({
  canvas: {
    width: 24,
    height: 24,
    position: 'relative',
  },
});

export default Icon;
