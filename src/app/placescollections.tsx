import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type PlacesCollectionView = 'main' | 'countries';

interface FavoriteCountry {
  id: string;
  value: string;
  rating_mode: 'general' | 'aspects';
  rating_general: number;
  rating_gastronomy: number;
  rating_culture: number;
  rating_nature: number;
  rating_vibe: number;
  rating_affordability: number;
  traveled: boolean;
  metadata?: {
    image?: string;
    region?: string;
    iso2?: string;
    details?: any;
  };
}

export default function PlacesCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const [currentView, setCurrentView] = useState<PlacesCollectionView>('main');
  const [loading, setLoading] = useState(true);
  const [favoriteCountries, setFavoriteCountries] = useState<FavoriteCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<FavoriteCountry | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [paramUserId]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = paramUserId || user?.id;
      if (!targetUserId) return;
      
      const isOwn = user?.id === targetUserId;
      setIsOwnProfile(isOwn);

      // Privacy Check
      if (!isOwn) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('privacy_collections')
          .eq('id', targetUserId)
          .single();
        
        if (profileError) throw profileError;

        const privacy = profileData?.privacy_collections || 'Everyone';
        if (privacy !== 'Everyone') {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user?.id)
            .eq('following_id', targetUserId)
            .maybeSingle();
          
          const isFollowing = !!followData;

          const { data: followerData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', targetUserId)
            .eq('following_id', user?.id)
            .maybeSingle();
          
          const followsBack = !!followerData;

          if (
            (privacy === 'Your Followers' && !isFollowing) ||
            (privacy === 'Followers you follow back' && (!isFollowing || !followsBack))
          ) {
            Alert.alert('Privacy', 'This user has restricted who can see their collections.');
            router.back();
            return;
          }
        }
      }

      const { data, error } = await supabase
        .from('places_favorites')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "places_favorites" does not exist')) {
          console.warn('places_favorites table might not exist yet');
          return;
        }
        throw error;
      }

      if (data) {
        setFavoriteCountries(data);
      }
    } catch (error: any) {
      console.error('Error fetching places collections:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (value: any) => {
    if (!value) return 'Unknown';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.name || value.title || JSON.stringify(value);
    }
    return String(value);
  };

  const removeCountry = async (id: string) => {
    if (!isOwnProfile) return;
    
    const item = favoriteCountries.find(c => c.id === id);
    if (!item) return;

    Alert.alert(
      'Remove Country',
      `Are you sure you want to remove ${getDisplayName(item.value)} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('places_favorites')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              setFavoriteCountries(prev => prev.filter(c => c.id !== id));
              if (selectedCountry?.id === id) {
                setIsDetailModalVisible(false);
              }
            } catch (error: any) {
              Alert.alert('Error', 'Could not remove country.');
              console.error('Error removing country:', error.message);
            }
          }
        }
      ]
    );
  };

  const renderRatingStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons 
            key={star} 
            name={star <= rating ? "star" : "star-outline"} 
            size={16} 
            color={star <= rating ? "#FFCC00" : theme.textSecondary} 
          />
        ))}
      </View>
    );
  };

  const renderMainView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.menuContainer}>
        {/* Favorite Countries Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('countries')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="flag" size={24} color={theme.brand} />
              <ThemedText style={styles.previewSectionTitle}>Favorite Countries</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteCountries.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.countryCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('countries')}
              >
                {item.metadata?.image ? (
                  <Image 
                    source={{ uri: item.metadata.image }} 
                    style={styles.countryImage} 
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.countryImage, styles.placeholderImage]}>
                    <Ionicons name="flag" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.countryInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{getDisplayName(item.value)}</ThemedText>
                  <ThemedText style={styles.regionText} numberOfLines={1}>{getDisplayName(item.metadata?.region)}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteCountries.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('countries')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteCountries.length} countries</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCountriesView = () => (
    <View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setCurrentView('main')}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
        <ThemedText style={styles.backButtonText}>Back to Places</ThemedText>
      </TouchableOpacity>
      
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Favorite Countries</ThemedText>
      
      <View style={styles.list}>
        {favoriteCountries.map(country => (
          <TouchableOpacity 
            key={country.id} 
            style={[styles.item, { backgroundColor: theme.backgroundElement }]}
            onPress={() => {
              setSelectedCountry(country);
              setIsDetailModalVisible(true);
            }}
          >
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.itemRemoveButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  removeCountry(country.id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            )}
            <View style={styles.itemInfo}>
              {country.metadata?.image && (
                <Image 
                  source={{ uri: country.metadata.image }} 
                  style={styles.itemImage} 
                  resizeMode="contain"
                />
              )}
              <View style={styles.itemTextContainer}>
                <ThemedText style={styles.itemText}>{getDisplayName(country.value)}</ThemedText>
                {country.rating_mode === 'general' ? (
                  renderRatingStars(country.rating_general)
                ) : (
                  <View style={styles.starsContainer}>
                    <Ionicons name="star" size={16} color="#FFCC00" />
                    <ThemedText style={{ fontSize: 12, marginLeft: 4, color: theme.textSecondary }}>
                      {((country.rating_gastronomy + country.rating_culture + country.rating_nature + country.rating_vibe + country.rating_affordability) / 5).toFixed(1)}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.itemRight}>
              {country.traveled && <Ionicons name="airplane" size={20} color={theme.brand} style={{ marginRight: 10 }} />}
              {isOwnProfile && (
                <TouchableOpacity onPress={() => removeCountry(country.id)}>
                  <Ionicons name="trash-outline" size={20} color={theme.brand} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {favoriteCountries.length === 0 && (
          <ThemedText style={styles.emptyText}>No countries added yet.</ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: currentView === 'main' ? 'Places Collections' : 'Favorite Countries',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: Spacing.two, marginRight: Spacing.two }}>
              {isOwnProfile ? (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/findsoulmate',
                    params: { category: 'places_favorites' }
                  })}
                >
                  <Ionicons name="heart" size={24} color={theme.brand} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/compare',
                    params: { userId: paramUserId, userName: 'User', highlightCategory: 'places_favorites' }
                  })}
                >
                  <Ionicons name="swap-horizontal" size={24} color={theme.brand} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }} 
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.brand} style={{ marginTop: 50 }} />
          ) : (
            <>
              {currentView === 'main' && renderMainView()}
              {currentView === 'countries' && renderCountriesView()}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>{getDisplayName(selectedCountry?.value)}</ThemedText>
              <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedCountry && (
              <ScrollView>
                {selectedCountry.metadata?.image && (
                  <Image 
                    source={{ uri: selectedCountry.metadata.image }} 
                    style={styles.modalImage} 
                    resizeMode="contain"
                  />
                )}
                
                {selectedCountry.rating_mode === 'general' ? (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>General Rating</ThemedText>
                    {renderRatingStars(selectedCountry.rating_general)}
                  </View>
                ) : (
                  <>
                    {(isOwnProfile || selectedCountry.rating_gastronomy > 0) && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Gastronomy</ThemedText>
                        {renderRatingStars(selectedCountry.rating_gastronomy)}
                      </View>
                    )}

                    {(isOwnProfile || selectedCountry.rating_culture > 0) && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Culture</ThemedText>
                        {renderRatingStars(selectedCountry.rating_culture)}
                      </View>
                    )}

                    {(isOwnProfile || selectedCountry.rating_nature > 0) && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Nature</ThemedText>
                        {renderRatingStars(selectedCountry.rating_nature)}
                      </View>
                    )}

                    {(isOwnProfile || selectedCountry.rating_vibe > 0) && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Vibe</ThemedText>
                        {renderRatingStars(selectedCountry.rating_vibe)}
                      </View>
                    )}

                    {(isOwnProfile || selectedCountry.rating_affordability > 0) && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Affordability</ThemedText>
                        {renderRatingStars(selectedCountry.rating_affordability)}
                      </View>
                    )}
                  </>
                )}

                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Region</ThemedText>
                  <ThemedText>{getDisplayName(selectedCountry.metadata?.region || selectedCountry.metadata?.details?.continent || 'N/A')}</ThemedText>
                </View>

                {selectedCountry.metadata?.details?.capital && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Capital</ThemedText>
                    <ThemedText>{getDisplayName(selectedCountry.metadata.details.capital)}</ThemedText>
                  </View>
                )}

                {selectedCountry.metadata?.details?.currency && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Currency</ThemedText>
                    <ThemedText>{getDisplayName(selectedCountry.metadata.details.currency)}</ThemedText>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Traveled</ThemedText>
                  <Ionicons 
                    name={selectedCountry.traveled ? "checkmark-circle" : "close-circle-outline"} 
                    size={24} 
                    color={selectedCountry.traveled ? "#4CD964" : theme.textSecondary} 
                  />
                </View>

              </ScrollView>
            )}
          </ThemedView>
        </View>
      </Modal>
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
  scrollContent: {
    padding: Spacing.four,
  },
  menuContainer: {
    gap: Spacing.four,
  },
  previewSection: {
    marginBottom: Spacing.four,
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemPreviewList: {
    gap: 0,
  },
  seeAllFooter: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    marginTop: Spacing.two,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    gap: Spacing.four,
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.three,
    position: 'relative',
  },
  itemRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  countryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderImage: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryInfo: {
    flex: 1,
  },
  regionText: {
    fontSize: 12,
    opacity: 0.6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: Spacing.four,
  },
  list: {
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 12,
    position: 'relative',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  itemImage: {
    width: 60,
    height: 40,
    borderRadius: 4,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: Spacing.four,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.four,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  detailLabel: {
    fontSize: 16,
    opacity: 0.8,
  },
  modalDeleteButton: {
    display: 'none',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: Spacing.three,
  },
});
