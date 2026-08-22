import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { PROFILE_THEMES, ProfileTheme, getProfileTheme } from '@/constants/profile-themes';
import { ProfileThemeBackground } from '@/components/profile-theme-background';
import { supabase } from '@/lib/supabase';

const THEMES_LIST: Array<{
  id: string;
  name: string;
  description: string;
  animationLabel: string;
}> = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean standard background without animation',
    animationLabel: 'Standard',
  },
  ...PROFILE_THEMES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    animationLabel: t.animationLabel,
  })),
];

export default function SelectThemeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedThemeId, setSelectedThemeId] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  useEffect(() => {
    const loadSelectedTheme = async () => {
      try {
        setLoading(true);
        // Try DB first
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('selected_theme')
            .eq('id', user.id)
            .single();

          if (data?.selected_theme) {
            setSelectedThemeId(data.selected_theme);
            setLoading(false);
            return;
          }
        }

        // Fallback to AsyncStorage
        const savedTheme = await AsyncStorage.getItem('user-profile-theme');
        if (savedTheme) {
          setSelectedThemeId(savedTheme);
        } else {
          const legacyTheme = await AsyncStorage.getItem('user-theme');
          if (legacyTheme) {
            setSelectedThemeId(legacyTheme);
          }
        }
      } catch (error) {
        console.error('Error loading profile theme:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSelectedTheme();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/premiumprivileges');
    }
  };

  const handleSelectTheme = async (id: string) => {
    try {
      setSavingId(id);
      setSelectedThemeId(id);

      if (id === 'default' || id === 'system') {
        await AsyncStorage.removeItem('user-profile-theme');
        await AsyncStorage.removeItem('user-theme');
      } else {
        await AsyncStorage.setItem('user-profile-theme', id);
        await AsyncStorage.setItem('user-theme', id);
      }

      // Save to DB for user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ selected_theme: id })
          .eq('id', user.id);
      }

      const targetTheme = id === 'default' ? null : getProfileTheme(id);
      const title = 'Profile Theme Updated';
      const msg = targetTheme
        ? `"${targetTheme.name}" animation is now live on your profile!`
        : 'Default profile background restored.';

      if (Platform.OS === 'web') {
        // Subtle alert or continue
      } else {
        Alert.alert(title, msg, [{ text: 'OK' }]);
      }
    } catch (e) {
      console.error('Failed to save profile theme', e);
      Alert.alert('Error', 'Failed to save theme. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const renderThemeItem = ({ item }: { item: (typeof THEMES_LIST)[0] }) => {
    const isSelected = selectedThemeId === item.id;
    const isDefault = item.id === 'default' || item.id === 'system';
    const profileTheme = getProfileTheme(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.themeItem,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isSelected ? theme.brand : theme.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleSelectTheme(item.id)}
        activeOpacity={0.8}
      >
        {/* Animated Thumbnail Preview */}
        <View style={styles.previewCardWrapper}>
          {isDefault ? (
            <View style={[styles.defaultPreview, { backgroundColor: theme.background }]}>
              <Ionicons name="sparkles-outline" size={26} color={theme.textSecondary} />
            </View>
          ) : (
            <ProfileThemeBackground themeId={item.id} isPreview={true} style={styles.animatedThumbnail}>
              <View style={styles.thumbnailOverlay}>
                <View
                  style={[
                    styles.thumbnailPill,
                    {
                      backgroundColor: profileTheme?.cardBg || 'rgba(0,0,0,0.6)',
                      borderColor: profileTheme?.cardBorder || 'rgba(255,255,255,0.2)',
                    },
                  ]}
                >
                  <ThemedText style={styles.thumbnailPillText} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                </View>
              </View>
            </ProfileThemeBackground>
          )}

          {/* Full-screen preview button */}
          {!isDefault && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setPreviewThemeId(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="expand" size={14} color="#FFF" />
            </TouchableOpacity>
          )}

          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: theme.brand }]}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.themeInfo}>
          <View style={styles.nameRow}>
            <ThemedText type="defaultSemiBold" style={styles.themeName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {savingId === item.id && <ActivityIndicator size="small" color={theme.brand} />}
          </View>
          <ThemedText style={styles.themeDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const previewTheme = previewThemeId ? getProfileTheme(previewThemeId) : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Profile Themes</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={THEMES_LIST}
            renderItem={renderThemeItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.headerDescriptionBox}>
                <ThemedText style={styles.descriptionTitle}>
                  Animated Profile Backgrounds
                </ThemedText>
                <ThemedText style={styles.description}>
                  Choose a live animated theme for your profile. Anyone visiting your profile will experience your customized animation!
                </ThemedText>
              </View>
            )}
          />
        )}

        {/* Full-screen Theme Live Preview Modal */}
        <Modal
          visible={!!previewThemeId}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setPreviewThemeId(null)}
        >
          {previewThemeId && (
            <ProfileThemeBackground themeId={previewThemeId} style={styles.modalBackground}>
              <SafeAreaView style={styles.modalSafeArea}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setPreviewThemeId(null)}
                  >
                    <Ionicons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <ThemedText type="subtitle" style={{ color: '#FFF' }}>
                    {previewTheme?.name}
                  </ThemedText>
                  <View style={{ width: 40 }} />
                </View>

                {/* Simulated Profile Glass Card */}
                <View style={styles.modalCardContainer}>
                  <View
                    style={[
                      styles.mockProfileCard,
                      {
                        backgroundColor: previewTheme?.cardBg || 'rgba(15, 20, 30, 0.85)',
                        borderColor: previewTheme?.cardBorder || 'rgba(255, 255, 255, 0.2)',
                      },
                    ]}
                  >
                    <View style={styles.mockAvatar}>
                      <Ionicons name="person" size={40} color={previewTheme?.primaryColor || '#FFF'} />
                    </View>
                    <ThemedText style={[styles.mockName, { color: previewTheme?.textColor || '#FFF' }]}>
                      Profile Preview
                    </ThemedText>
                    <ThemedText style={[styles.mockDesc, { color: previewTheme?.textSecondaryColor || '#CCC' }]}>
                      {previewTheme?.description}
                    </ThemedText>

                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        { backgroundColor: previewTheme?.primaryColor || theme.brand },
                      ]}
                      onPress={() => {
                        handleSelectTheme(previewThemeId);
                        setPreviewThemeId(null);
                      }}
                    >
                      <ThemedText style={styles.applyButtonText}>
                        {selectedThemeId === previewThemeId ? 'Applied' : 'Apply Theme'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </ProfileThemeBackground>
          )}
        </Modal>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  headerDescriptionBox: {
    marginBottom: Spacing.four,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    opacity: 0.75,
    textAlign: 'center',
    lineHeight: 20,
  },
  themeItem: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewCardWrapper: {
    width: '100%',
    height: 110,
    position: 'relative',
    backgroundColor: '#000',
  },
  defaultPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedThumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
  },
  thumbnailPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  thumbnailPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  expandButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 5,
    zIndex: 5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  themeInfo: {
    padding: Spacing.three,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  themeDescription: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
  modalBackground: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  mockProfileCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: Spacing.four,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  mockAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  mockName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  mockDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  applyButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
