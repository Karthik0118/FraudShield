/**
 * Modern Typography System
 *
 * System fonts with balanced scale and weights for clarity.
 */

import {Platform, TextStyle} from 'react-native';

const fontFamily = Platform.select({
  android: 'Roboto',
  ios: 'System',
  default: 'System',
});

const Typography = {
  fontFamily,

  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 34,
  },

  lineHeights: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 36,
    display: 42,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  styles: {
    displayLarge: {
      fontSize: 34,
      lineHeight: 42,
      fontWeight: '700' as const,
      fontFamily,
      letterSpacing: -0.5,
    } as TextStyle,
    heading1: {
      fontSize: 26,
      lineHeight: 34,
      fontWeight: '700' as const,
      fontFamily,
      letterSpacing: -0.4,
    } as TextStyle,
    heading2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600' as const,
      fontFamily,
      letterSpacing: -0.3,
    } as TextStyle,
    heading3: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
      fontFamily,
      letterSpacing: -0.2,
    } as TextStyle,
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400' as const,
      fontFamily,
    } as TextStyle,
    bodyMedium: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
      fontFamily,
    } as TextStyle,
    bodySemibold: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600' as const,
      fontFamily,
    } as TextStyle,
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      fontFamily,
    } as TextStyle,
    captionMedium: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      fontFamily,
    } as TextStyle,
    small: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '400' as const,
      fontFamily,
    } as TextStyle,
    button: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600' as const,
      fontFamily,
      letterSpacing: 0.2,
    } as TextStyle,
    buttonSmall: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      fontFamily,
      letterSpacing: 0.1,
    } as TextStyle,
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      fontFamily,
      letterSpacing: 0.1,
    } as TextStyle,
  },
};

export default Typography;
