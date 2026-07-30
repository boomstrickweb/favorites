import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';

export default function PremiumScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const showInfo = (title: string, info: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${info}`);
    } else {
      Alert.alert(title, info);
    }
  };

  const premiumFeatures = [
    {
      title: "Premium profile badge",
      info: "The premium profile badge is a badge visible next to the names of premium users.",
      icon: "ribbon-outline" as const,
    },
    {
      title: "Exclusive profile themes",
      info: "You can choose a theme to match your taste and decide how your profile looks.",
      icon: "color-palette-outline" as const,
    },
    {
      title: "Premium-exclusive animated gifts",
      info: "You can send gifts to your loved ones daily using your gift balance.",
      icon: "gift-outline" as const,
    },
    {
      title: "See who's viewed your profile",
      info: "We show you the profiles that have visited your profile.",
      icon: "eye-outline" as const,
    },
    {
      title: "Stalk Mode",
      info: "You can secretly visit a limited number of profiles per day without them seeing your name in the profile visitors list.",
      icon: "eye-off-outline" as const,
    },
    {
      title: "See others' updates in the Feed (without following)",
      info: "You can add up to 5 profiles to your Feed without following them and see their updates.",
      icon: "newspaper-outline" as const,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Premium</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.description}>
            Upgrade to Premium to unlock exclusive features and enhance your experience.
          </ThemedText>

          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundElement }]}>
            {premiumFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.featureItem,
                  index === premiumFeatures.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => showInfo(feature.title, feature.info)}
                activeOpacity={0.7}
              >
                <View style={styles.featureItemLeft}>
                  <Ionicons name={feature.icon} size={24} color={theme.brand} />
                  <ThemedText style={styles.featureItemLabel}>{feature.title}</ThemedText>
                </View>
                <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  description: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: Spacing.six,
    textAlign: 'center',
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  featureItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureItemLabel: {
    fontSize: 16,
    marginLeft: Spacing.three,
    flex: 1,
  },
});
