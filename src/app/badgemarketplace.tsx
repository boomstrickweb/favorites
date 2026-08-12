import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, TextInput, ActivityIndicator, Modal, Switch, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface BadgePack {
  id: string;
  name: string;
  creator_id: string;
  icon: string;
  is_public: boolean;
  profiles?: {
    username: string;
  };
}

export default function BadgeMarketplaceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [badgePacks, setBadgePacks] = useState<BadgePack[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'yours' | 'saved'>('general');

  // Create Pack Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBadgePacks();
  }, [activeTab]);

  const fetchBadgePacks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('badge_packs')
        .select('*, profiles(username)');

      if (activeTab === 'yours') {
        if (!user) return;
        query = query.eq('creator_id', user.id);
      } else if (activeTab === 'general') {
        query = query.eq('is_public', true);
      } else {
        // Saved packs logic (placeholder for now)
        setBadgePacks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBadgePacks(data || []);
    } catch (error: any) {
      console.error('Error fetching badge packs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePack = async () => {
    if (!newPackName.trim()) {
      Alert.alert('Error', 'Please enter a pack name');
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a pack');

      // Check if name is unique
      const { data: existing } = await supabase
        .from('badge_packs')
        .select('id')
        .eq('name', newPackName.trim())
        .maybeSingle();

      if (existing) {
        Alert.alert('Error', 'A pack with this name already exists');
        return;
      }

      const { error } = await supabase
        .from('badge_packs')
        .insert({
          name: newPackName.trim(),
          is_public: isPublic,
          creator_id: user.id,
          icon: 'gift', // default icon
        });

      if (error) throw error;

      setNewPackName('');
      setIsPublic(true);
      setShowCreateModal(false);
      
      // If we are in "yours" or "general" (and it's public), refresh
      if (activeTab === 'yours' || (activeTab === 'general' && isPublic)) {
        fetchBadgePacks();
      } else {
        // If we created a private pack while on general, maybe switch to yours?
        // For now just alert success
        Alert.alert('Success', 'Badge pack created!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/premiumprivileges');
    }
  };

  const filteredPacks = badgePacks.filter(pack => 
    pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pack.profiles?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Badge Marketplace</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            placeholder="Search badge packs..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.brand} />
              <ThemedText style={styles.actionButtonText}>Create pack</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: theme.backgroundElement },
                activeTab === 'yours' && { borderColor: theme.brand, borderWidth: 1 }
              ]}
              onPress={() => setActiveTab('yours')}
            >
              <Ionicons name="person-outline" size={24} color={theme.brand} />
              <ThemedText style={styles.actionButtonText}>Your packs</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: theme.backgroundElement },
                activeTab === 'saved' && { borderColor: theme.brand, borderWidth: 1 }
              ]}
              onPress={() => setActiveTab('saved')}
            >
              <Ionicons name="bookmark-outline" size={24} color={theme.brand} />
              <ThemedText style={styles.actionButtonText}>Saved</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : 
                 activeTab === 'yours' ? 'Your Badge Packs' :
                 activeTab === 'saved' ? 'Saved Badge Packs' :
                 'General Badge Packs'}
              </ThemedText>
              {activeTab !== 'general' && (
                <TouchableOpacity onPress={() => setActiveTab('general')}>
                  <ThemedText style={{ color: theme.brand }}>Show General</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            
            {loading ? (
              <ActivityIndicator size="small" color={theme.brand} style={{ marginTop: 20 }} />
            ) : filteredPacks.length > 0 ? (
              <View style={styles.packsGrid}>
                {filteredPacks.map(pack => (
                  <TouchableOpacity 
                    key={pack.id} 
                    style={[styles.packCard, { backgroundColor: theme.backgroundElement }]}
                    onPress={() => router.push(`/badgepack/${pack.id}`)}
                  >
                    <View style={[styles.packIconContainer, { backgroundColor: theme.background }]}>
                      <Ionicons name={pack.icon as any} size={32} color={theme.brand} />
                    </View>
                    <ThemedText style={styles.packName} numberOfLines={1}>{pack.name}</ThemedText>
                    <ThemedText style={styles.packCreator} numberOfLines={1}>
                      by {pack.profiles?.username || 'Unknown'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.emptyText}>No badge packs found</ThemedText>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Create Badge Pack</ThemedText>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <ThemedText style={styles.inputLabel}>Pack Name</ThemedText>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.backgroundElement }]}
                  placeholder="Enter pack name..."
                  placeholderTextColor={theme.textSecondary}
                  value={newPackName}
                  onChangeText={setNewPackName}
                  maxLength={30}
                />

                <View style={styles.toggleRow}>
                  <View>
                    <ThemedText style={styles.toggleLabel}>Public Pack</ThemedText>
                    <ThemedText style={styles.toggleSublabel}>
                      {isPublic ? 'Everyone can see and save this pack' : 'Only you can see this pack'}
                    </ThemedText>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: '#767577', true: theme.brand }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isPublic ? theme.brand : '#f4f3f4'}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: theme.brand }]}
                  onPress={handleCreatePack}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.createButtonText}>Create</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.seven,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 40,
    fontSize: 16,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.six,
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  actionButtonText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: Spacing.four,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  packCard: {
    width: '47%',
    padding: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  packIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  packName: {
    fontWeight: '600',
    fontSize: 14,
  },
  packCreator: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: Spacing.eight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.six,
    paddingBottom: Platform.OS === 'ios' ? Spacing.ten : Spacing.six,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  modalBody: {
    gap: Spacing.four,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  modalInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    fontSize: 16,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleSublabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  createButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.six,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
