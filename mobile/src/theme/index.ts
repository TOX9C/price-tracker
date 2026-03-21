export { colors, Colors } from './colors';
export { spacing, borderRadius } from './spacing';
export { typography } from './typography';

import { colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};

export type Theme = typeof theme;
