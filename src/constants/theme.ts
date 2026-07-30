/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    brand: '#FF3B30', // Red
    onBrand: '#ffffff',
    border: '#E0E1E6',
    icon: '#60646C',
    tint: '#FF3B30',
    isDark: false,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    brand: '#FF3B30', // Red
    onBrand: '#ffffff',
    border: '#2E3135',
    icon: '#B0B4BA',
    tint: '#FF3B30',
    isDark: true,
  },
  cinema: {
    text: '#E5E7EB',
    background: '#111827',
    backgroundElement: '#1F2937',
    backgroundSelected: '#374151',
    textSecondary: '#9CA3AF',
    brand: '#E50914',
    onBrand: '#FFFFFF',
    border: '#1F2937',
    icon: '#9CA3AF',
    tint: '#E50914',
    isDark: true,
  },
  library: {
    text: '#2D241E',
    background: '#FDFCF0',
    backgroundElement: '#F5F2E8',
    backgroundSelected: '#EAE5D5',
    textSecondary: '#6B5E51',
    brand: '#8B4513',
    onBrand: '#FFFFFF',
    border: '#F5F2E8',
    icon: '#6B5E51',
    tint: '#8B4513',
    isDark: false,
  },
  vinyl: {
    text: '#FFFFFF',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#2C2C2C',
    textSecondary: '#B3B3B3',
    brand: '#1DB954',
    onBrand: '#000000',
    border: '#1E1E1E',
    icon: '#B3B3B3',
    tint: '#1DB954',
    isDark: true,
  },
  arcade: {
    text: '#00FF41',
    background: '#0D0221',
    backgroundElement: '#1A084E',
    backgroundSelected: '#2F1181',
    textSecondary: '#FF00E4',
    brand: '#39FF14',
    onBrand: '#000000',
    border: '#1A084E',
    icon: '#FF00E4',
    tint: '#39FF14',
    isDark: true,
  },
  garage: {
    text: '#D1D5DB',
    background: '#262626',
    backgroundElement: '#333333',
    backgroundSelected: '#404040',
    textSecondary: '#9CA3AF',
    brand: '#F59E0B',
    onBrand: '#000000',
    border: '#333333',
    icon: '#9CA3AF',
    tint: '#F59E0B',
    isDark: true,
  },
  atlas: {
    text: '#1E293B',
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#64748B',
    brand: '#0EA5E9',
    onBrand: '#FFFFFF',
    border: '#F1F5F9',
    icon: '#64748B',
    tint: '#0EA5E9',
    isDark: false,
  },
  kitchen: {
    text: '#374151',
    background: '#FFFFFF',
    backgroundElement: '#F9FAFB',
    backgroundSelected: '#F3F4F6',
    textSecondary: '#6B7280',
    brand: '#10B981',
    onBrand: '#FFFFFF',
    border: '#F9FAFB',
    icon: '#6B7280',
    tint: '#10B981',
    isDark: false,
  },
  stadium: {
    text: '#FFFFFF',
    background: '#064E3B',
    backgroundElement: '#065F46',
    backgroundSelected: '#047857',
    textSecondary: '#A7F3D0',
    brand: '#FACC15',
    onBrand: '#000000',
    border: '#065F46',
    icon: '#A7F3D0',
    tint: '#FACC15',
    isDark: true,
  },
  titanium: {
    text: '#F9FAFB',
    background: '#1F2937',
    backgroundElement: '#374151',
    backgroundSelected: '#4B5563',
    textSecondary: '#9CA3AF',
    brand: '#D1D5DB',
    onBrand: '#111827',
    border: '#374151',
    icon: '#9CA3AF',
    tint: '#D1D5DB',
    isDark: true,
  },
  cosmic: {
    text: '#F5F3FF',
    background: '#2E1065',
    backgroundElement: '#4C1D95',
    backgroundSelected: '#5B21B6',
    textSecondary: '#DDD6FE',
    brand: '#A855F7',
    onBrand: '#FFFFFF',
    border: '#4C1D95',
    icon: '#DDD6FE',
    tint: '#A855F7',
    isDark: true,
  },
} as const;

export type ThemeType = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  eight: 12,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
