import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { icon: 'videocam', label: 'Movies' },
  { icon: 'musical-notes', label: 'Music' },
  { icon: 'book', label: 'Books' },
  { icon: 'car', label: 'Vehicles' },
  { icon: 'game-controller', label: 'Games' },
];

export default function IntroScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, [router]);

  if (checking) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.brand + '15' }]}>
              <ThemedText style={styles.logoHeart}>♡</ThemedText>
            </View>
            <ThemedText type="title" style={styles.title}>
              fav<ThemedText type="title" style={{ color: theme.brand }}>♡</ThemedText>rites
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              A social network for people to share the things they love.
            </ThemedText>
          </View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat, i) => (
              <View key={i} style={styles.categoryItem}>
                <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name={cat.icon as any} size={24} color={theme.brand} />
                </View>
                <ThemedText style={styles.categoryLabel}>{cat.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/signin')}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.buttonText}>Sign In</ThemedText>
            <Ionicons name="log-in" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.backgroundElement, marginTop: Spacing.three }]}
            onPress={() => router.push('/signup')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.buttonText, { color: theme.text }]}>Get Started</ThemedText>
            <Ionicons name="arrow-forward" size={20} color={theme.text} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <ThemedText style={styles.footerNote}>
            Join the community today
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    maxWidth: MaxContentWidth,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoHeart: {
    fontSize: 60,
    color: '#FF3B30',
    marginTop: 5,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#60646C',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
    lineHeight: 24,
    maxWidth: 300,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.four,
    width: '100%',
    marginTop: Spacing.two,
  },
  categoryItem: {
    alignItems: 'center',
    width: (width - Spacing.four * 2 - Spacing.four * 3) / 4,
    maxWidth: 80,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  footer: {
    width: '100%',
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  button: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerNote: {
    marginTop: Spacing.three,
    fontSize: 14,
    opacity: 0.5,
    fontWeight: '500',
  },
});
