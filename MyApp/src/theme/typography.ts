/**
 * Typography Scale
 *
 * Uses system fonts for optimal rendering on both iOS and Android.
 * Scale follows a consistent ratio for visual harmony.
 */

import {Platform} from 'react-native';

const fontFamily = Platform.select({
  android: 'Roboto',
  ios: 'System',
  default: 'System',
});

const Typography = {
  fontFamily,

  // Font sizes
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },

  // Line heights
  lineHeights: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 38,
    display: 44,
  },

  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Pre-composed text styles
  styles: {
    displayLarge: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700' as const,
      fontFamily,
    },
    heading1: {
      fontSize: 30,
      lineHeight: 38,
      fontWeight: '700' as const,
      fontFamily,
    },
    heading2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
      fontFamily,
    },
    heading3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
      fontFamily,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400' as const,
      fontFamily,
    },
    bodyMedium: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
      fontFamily,
    },
    bodySemibold: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600' as const,
      fontFamily,
    },
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      fontFamily,
    },
    captionMedium: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      fontFamily,
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '400' as const,
      fontFamily,
    },
    button: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600' as const,
      fontFamily,
    },
    buttonSmall: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      fontFamily,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      fontFamily,
    },
  },
};

export default Typography;
