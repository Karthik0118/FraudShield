/**
 * Unified Theme
 *
 * Single import point for all design tokens.
 */

import Colors from './colors';
import Typography from './typography';
import Spacing from './spacing';

const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
};

const Theme = {
  Colors,
  Typography,
  Spacing,
  Shadows,
};

export {Colors, Typography, Spacing, Shadows};
export default Theme;
