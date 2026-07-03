import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert, Platform, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type PrivacyOption = 'Everyone' | 'Your Followers' | 'Followers you follow back' | 'Only Me' | 'No one';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Privacy States
  const [whoSeeFollowers, setWhoSeeFollowers] = useState<PrivacyOption>('Everyone');
  const [whoSeeCollections, setWhoSeeCollections] = useState<PrivacyOption>('Everyone');
  const [whoSeeLikes, setWhoSeeLikes] = useState<PrivacyOption>('Your Followers');
  const [whoCanMessage, setWhoCanMessage] = useState<PrivacyOption>('Everyone');
  const [blockedCount, setBlockedCount] = useState(0);

  const fetchPrivacySettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_followers, privacy_collections, privacy_likes, privacy_messages')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setWhoSeeFollowers(data.privacy_followers as PrivacyOption || 'Everyone');
        setWhoSeeCollections(data.privacy_collections as PrivacyOption || 'Everyone');
        setWhoSeeLikes(data.privacy_likes as PrivacyOption || 'Your Followers');
        setWhoCanMessage(data.privacy_messages as PrivacyOption || 'Everyone');
      }

      // Fetch blocked count
      const { count, error: blockError } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('blocker_id', user.id);
      
      if (!blockError) {
        setBlockedCount(count || 0);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrivacySettings();
  }, [fetchPrivacySettings]);

  const updatePrivacySetting = async (key: string, value: PrivacyOption) => {
    try {
      setSaving(key);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      if (key === 'privacy_followers') setWhoSeeFollowers(value);
      if (key === 'privacy_collections') setWhoSeeCollections(value);
      if (key === 'privacy_likes') setWhoSeeLikes(value);
      if (key === 'privacy_messages') setWhoCanMessage(value);

    } catch (error: any) {
      Alert.alert('Error', 'Failed to update setting: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleTwoFactorSetup = () => {
    router.push('/twofactor');
  };

  const handlePasswordChange = () => {
    router.push('/changepassword');
  };

  const handleDeleteAccount = () => {
    router.push('/deleteaccount');
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{title}</ThemedText>
      <View style={[styles.sectionContent, { backgroundColor: theme.backgroundElement }]}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ 
    icon, 
    label, 
    onPress, 
    value, 
    destructive 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    onPress?: () => void; 
    value?: string;
    destructive?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={destructive ? '#FF3B30' : theme.text} />
        <ThemedText style={[styles.settingItemLabel, destructive && { color: '#FF3B30' }]}>{label}</ThemedText>
      </View>
      <View style={styles.settingItemRight}>
        {value && <ThemedText style={styles.settingItemValue}>{value}</ThemedText>}
        {onPress && <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  const PrivacySelector = ({ 
    label, 
    options, 
    currentValue, 
    onSelect,
    isSaving
  }: { 
    label: string; 
    options: PrivacyOption[]; 
    currentValue: PrivacyOption; 
    onSelect: (val: PrivacyOption) => void;
    isSaving: boolean;
  }) => (
    <View style={styles.privacySelector}>
      <View style={styles.privacyHeader}>
        <ThemedText style={styles.privacyLabel}>{label}</ThemedText>
        {isSaving && <ActivityIndicator size="small" color={theme.brand} />}
      </View>
      <View style={styles.optionsContainer}>
        {options.map((opt) => (
          <TouchableOpacity 
            key={opt}
            style={[
              styles.optionChip, 
              { backgroundColor: currentValue === opt ? theme.brand : theme.backgroundSelected }
            ]}
            onPress={() => onSelect(opt)}
            disabled={isSaving}
          >
            <ThemedText style={[
              styles.optionText, 
              { color: currentValue === opt ? '#FFF' : theme.text }
            ]}>{opt}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">Settings</ThemedText>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Settings</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <SettingSection title="Account preferences, password and security">
            <SettingItem 
              icon="key-outline" 
              label="Change password" 
              onPress={handlePasswordChange} 
            />
            <SettingItem 
              icon="shield-checkmark-outline" 
              label="Two-factor authentication" 
              onPress={handleTwoFactorSetup} 
            />
            <SettingItem 
              icon="trash-outline" 
              label="Delete account" 
              destructive 
              onPress={handleDeleteAccount}
            />
          </SettingSection>

          <SettingSection title="Account privacy">
            <PrivacySelector 
              label="Who can see your followers and who you follow?"
              options={['Everyone', 'Followers you follow back', 'Only Me']}
              currentValue={whoSeeFollowers}
              onSelect={(val) => updatePrivacySetting('privacy_followers', val)}
              isSaving={saving === 'privacy_followers'}
            />
            <View style={styles.divider} />
            <PrivacySelector 
              label="Who can see your collections and feed?"
              options={['Everyone', 'Your Followers', 'Followers you follow back']}
              currentValue={whoSeeCollections}
              onSelect={(val) => updatePrivacySetting('privacy_collections', val)}
              isSaving={saving === 'privacy_collections'}
            />
            <View style={styles.divider} />
            <PrivacySelector 
              label="Who can see the number of likes on your posts and who liked them?"
              options={['Your Followers', 'Followers you follow back', 'Only Me']}
              currentValue={whoSeeLikes}
              onSelect={(val) => updatePrivacySetting('privacy_likes', val)}
              isSaving={saving === 'privacy_likes'}
            />
          </SettingSection>

          <SettingSection title="Blocked">
            <SettingItem 
              icon="ban-outline" 
              label="Blocked accounts" 
              onPress={() => router.push('/blockedaccounts')}
              value={blockedCount.toString()}
            />
          </SettingSection>

          <SettingSection title="Messages">
            <PrivacySelector 
              label="Who can send you a message?"
              options={['Everyone', 'Followers you follow back', 'No one']}
              currentValue={whoCanMessage}
              onSelect={(val) => updatePrivacySetting('privacy_messages', val)}
              isSaving={saving === 'privacy_messages'}
            />
          </SettingSection>

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
  section: {
    marginBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: Spacing.two,
    paddingLeft: Spacing.one,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemLabel: {
    fontSize: 16,
    marginLeft: Spacing.three,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 14,
    opacity: 0.5,
    marginRight: Spacing.two,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacySelector: {
    padding: Spacing.four,
  },
  privacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  privacyLabel: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
    marginRight: Spacing.two,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginHorizontal: Spacing.four,
  },
});
