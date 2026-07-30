/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeType } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType | 'system'>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try DB first
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('selected_theme')
            .eq('id', user.id)
            .single();
          
          if (data?.selected_theme && data.selected_theme in Colors) {
            setSelectedTheme(data.selected_theme as ThemeType);
            return;
          }
        }

        const savedTheme = await AsyncStorage.getItem('user-theme');
        if (savedTheme && savedTheme in Colors) {
          setSelectedTheme(savedTheme as ThemeType);
        } else {
          setSelectedTheme('system');
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      }
    };

    loadTheme();

    // In a real app, you might want to use an event emitter or a state management library
    // to listen for theme changes. For this task, we'll rely on component re-mounting
    // or adding a simple polling/listener if needed.
  }, []);

  const themeKey = selectedTheme === 'system' 
    ? (systemScheme === 'unspecified' ? 'light' : systemScheme)
    : selectedTheme;

  return Colors[themeKey as ThemeType] || Colors.light;
}
