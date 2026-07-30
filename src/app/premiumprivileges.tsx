import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Switch, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function PremiumPrivilegesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [stalkMode, setStalkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStalkMode();
  }, []);

  const fetchStalkMode = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('stalk_mode')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setStalkMode(!!data.stalk_mode);
    } catch (error) {
      console.error('Error fetching stalk mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStalkMode = async (value: boolean) => {
    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ stalk_mode: value })
        .eq('id', user.id);

      if (error) throw error;
      setStalkMode(value);
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error updating Stalk Mode: ' + error.message);
      } else {
        Alert.alert('Error', 'Could not update Stalk Mode: ' + error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const privileges = [
    {
      label: "Select profile badge",
      icon: "ribbon-outline" as const,
      onPress: () => { router.push('/selectbadge'); },
    },
    {
      label: "Select profile theme",
      icon: "color-palette-outline" as const,
      onPress: () => { router.push('/selectthemes'); },
    },
    {
      label: "See who's viewed your profile",
      icon: "eye-outline" as const,
      onPress: () => { router.push('/profile-visitors'); },
    },
    {
      label: "See the profiles whose notifications you've turned on",
      icon: "notifications-outline" as const,
      onPress: () => { router.push('/premium-notifications-list'); },
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Premium Privileges</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.brand} style={{ marginTop: 20 }} />
          ) : (
            <View style={[styles.sectionContent, { backgroundColor: theme.backgroundElement }]}>
              {privileges.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.privilegeItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.privilegeItemLeft}>
                    <Ionicons name={item.icon} size={24} color={theme.brand} />
                    <ThemedText style={styles.privilegeItemLabel}>{item.label}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}

              <View style={styles.privilegeItem}>
                <View style={styles.privilegeItemLeft}>
                  <Ionicons name="eye-off-outline" size={24} color={theme.brand} />
                  <ThemedText style={styles.privilegeItemLabel}>Stalk Mode</ThemedText>
                </View>
                <Switch
                  value={stalkMode}
                  onValueChange={handleToggleStalkMode}
                  disabled={updating}
                  trackColor={{ false: '#767577', true: theme.brand }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : stalkMode ? theme.brand : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.privilegeItem, { borderBottomWidth: 0 }]}
                onPress={privileges[3].onPress}
                activeOpacity={0.7}
              >
                <View style={styles.privilegeItemLeft}>
                  <Ionicons name={privileges[3].icon} size={24} color={theme.brand} />
                  <ThemedText style={styles.privilegeItemLabel}>{privileges[3].label}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
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
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  privilegeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  privilegeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privilegeItemLabel: {
    fontSize: 16,
    marginLeft: Spacing.three,
    flex: 1,
  },
});
