/**
 * Modern Color Palette
 *
 * Professional, high-contrast palette tailored for FraudShield.
 * Uses slate neutrals and deep indigo primary for an enterprise fintech feel.
 */

const Colors = {
  // Brand colors
  primary: '#4F46E5',         // Indigo 600
  primaryHover: '#4338CA',    // Indigo 700
  primaryLight: '#6366F1',    // Indigo 500
  primaryDark: '#3730A3',     // Indigo 800
  primaryFaded: '#EEF2FF',    // Indigo 50
  primaryBorder: '#C7D2FE',   // Indigo 200

  // Semantic: Success
  success: '#10B981',         // Emerald 500
  successDark: '#047857',     // Emerald 700
  successLight: '#ECFDF5',    // Emerald 50
  successBorder: '#A7F3D0',   // Emerald 200

  // Semantic: Warning
  warning: '#F59E0B',         // Amber 500
  warningDark: '#B45309',     // Amber 700
  warningLight: '#FFFBEB',    // Amber 50
  warningBorder: '#FDE68A',   // Amber 200

  // Semantic: Error / Danger
  error: '#EF4444',           // Red 500
  errorDark: '#B91C1C',       // Red 700
  errorLight: '#FEF2F2',      // Red 50
  errorBorder: '#FECACA',     // Red 200

  // Semantic: Info
  info: '#3B82F6',            // Blue 500
  infoDark: '#1D4ED8',        // Blue 700
  infoLight: '#EFF6FF',       // Blue 50
  infoBorder: '#BFDBFE',      // Blue 200

  // Neutrals & Surfaces
  white: '#FFFFFF',
  background: '#F8FAFC',      // Slate 50
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',// Slate 100
  surfaceTertiary: '#E2E8F0', // Slate 200
  surfaceHover: '#F8FAFC',
  
  // Borders & Dividers
  border: '#E2E8F0',          // Slate 200
  borderLight: '#F1F5F9',     // Slate 100
  borderFocus: '#6366F1',     // Indigo 500
  divider: '#E2E8F0',         // Slate 200

  // Text Hierarchy
  textPrimary: '#0F172A',     // Slate 900
  textSecondary: '#475569',   // Slate 600
  textTertiary: '#94A3B8',    // Slate 400
  textMuted: '#CBD5E1',       // Slate 300
  textInverse: '#FFFFFF',
  textLink: '#4F46E5',

  // Misc
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  disabled: '#CBD5E1',
  disabledBackground: '#F1F5F9',
  placeholder: '#94A3B8',

  // Avatar deterministic accents
  avatarColors: [
    '#4F46E5', '#7C3AED', '#2563EB', '#0891B2',
    '#059669', '#D97706', '#DC2626', '#DB2777',
  ],
};

export default Colors;
