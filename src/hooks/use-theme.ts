/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ThemeType } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeKey = systemScheme === 'dark' ? 'dark' : 'light';
  return Colors[themeKey as ThemeType] || Colors.light;
}
