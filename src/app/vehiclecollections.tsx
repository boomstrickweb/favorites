import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type VehicleCollectionView = 'main' | 'passenger car' | 'bus' | 'multipurpose passenger vehicle (mpv)' | 'truck' | 'motorcycle' | 'low speed vehicle (lsv)';

export default function VehicleCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<VehicleCollectionView>('main');
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [targetUserName, setTargetUserName] = useState('User');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ratingMode, setRatingMode] = useState<'none' | 'general' | 'aspects'>('none');
  const [generalRating, setGeneralRating] = useState(0);
  const [vehicleAspectRatings, setVehicleAspectRatings] = useState({
    performance: 0,
    design: 0,
    driving: 0,
    usability: 0,
    offroad: 0,
    space: 0,
    safety: 0,
    versatility: 0,
    exclusivity: 0,
    powerWeight: 0,
    customization: 0,
    ridingExperience: 0,
    towing: 0,
    durability: 0,
    utility: 0,
    roadPresence: 0,
    history: 0,
    luxury: 0,
    capacity: 0,
    fun: 0,
    eco: 0,
    maneuverability: 0,
  });

  const VEHICLE_CATEGORIES = [
    { id: 'passenger car', label: 'Passenger Car', icon: 'car' as const, color: '#007AFF' },
    { id: 'multipurpose passenger vehicle (mpv)', label: 'MPV', icon: 'apps' as const, color: '#FF9500' },
    { id: 'motorcycle', label: 'Motorcycle', icon: 'bicycle' as const, color: '#FF3B30' },
    { id: 'truck', label: 'Truck', icon: 'construct' as const, color: '#4CD964' },
    { id: 'bus', label: 'Bus', icon: 'bus' as const, color: '#5856D6' },
    { id: 'low speed vehicle (lsv)', label: 'LSV', icon: 'leaf' as const, color: '#34C759' },
  ];

  useEffect(() => {
    async function setupCollections() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = paramUserId || user?.id;
        
        if (targetUserId) {
          setUserId(targetUserId);
          const isOwn = user?.id === targetUserId;
          setIsOwnProfile(isOwn);

          // Fetch profile for username
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name, privacy_collections')
            .eq('id', targetUserId)
            .single();
          
          if (!profileError && profileData) {
            setTargetUserName(profileData.full_name || profileData.username || 'User');
          }

          // Privacy Check
          if (!isOwn) {
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
          
          // Fetch all vehicle favorites
          const { data, error } = await supabase
            .from('vehicle_favorites')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setFavorites(data || []);
        }
      } catch (error) {
        console.error('Error setting up vehicle collections:', error);
      } finally {
        setLoading(false);
      }
    }
    setupCollections();
  }, [paramUserId]);

  const removeFavorite = async (id: string) => {
    if (!isOwnProfile) return;
    try {
      const { error } = await supabase
        .from('vehicle_favorites')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error removing favorite:', error);
        Alert.alert('Error', 'Failed to remove favorite: ' + error.message);
        return;
      }
      
      setFavorites(prev => prev.filter(f => f.id !== id));
      if (selectedVehicle?.id === id) {
        setSelectedVehicle(null);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove favorite');
    }
  };

  const updateRatings = async () => {
    if (!selectedVehicle || !isOwnProfile) return;
    
    try {
      if (ratingMode === 'none') {
        Alert.alert('Error', 'Please select a rating mode');
        return;
      }

      const ratingData = ratingMode === 'general' 
        ? { mode: 'general', value: generalRating }
        : { mode: 'aspects', ...vehicleAspectRatings };

      const updatedMetadata = {
        ...selectedVehicle.metadata,
        aspect_ratings: ratingMode === 'aspects' ? vehicleAspectRatings : undefined,
        rating: ratingData
      };

      const { error } = await supabase
        .from('vehicle_favorites')
        .update({
          rating_mode: ratingMode,
          rating_general: ratingMode === 'general' ? generalRating : 0,
          metadata: updatedMetadata
        })
        .eq('id', selectedVehicle.id);

      if (error) throw error;

      // Update local state
      setFavorites(prev => prev.map(f => f.id === selectedVehicle.id ? {
        ...f,
        rating_mode: ratingMode,
        rating_general: ratingMode === 'general' ? generalRating : 0,
        metadata: updatedMetadata
      } : f));
      
      setSelectedVehicle(prev => ({
        ...prev,
        rating_mode: ratingMode,
        rating_general: ratingMode === 'general' ? generalRating : 0,
        metadata: updatedMetadata
      }));

      setIsEditing(false);
      Alert.alert('Success', 'Ratings updated successfully');
    } catch (error: any) {
      console.error('Error updating ratings:', error);
      Alert.alert('Error', error.message || 'Failed to update ratings');
    }
  };

  const handleVehiclePress = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsEditing(false);
    
    const rating = vehicle.metadata?.rating;
    if (rating) {
      setRatingMode(rating.mode || 'general');
      if (rating.mode === 'aspects') {
        setVehicleAspectRatings({
          ...vehicleAspectRatings,
          ...rating
        });
        setGeneralRating(0);
      } else {
        setGeneralRating(rating.value || 0);
        setVehicleAspectRatings({
          performance: 0, design: 0, driving: 0, usability: 0,
          offroad: 0, space: 0, safety: 0, versatility: 0,
          exclusivity: 0, powerWeight: 0, customization: 0, ridingExperience: 0,
          towing: 0, durability: 0, utility: 0, roadPresence: 0,
          history: 0, luxury: 0, capacity: 0,
          fun: 0, eco: 0, maneuverability: 0
        });
      }
    } else {
      setRatingMode(vehicle.rating_mode || 'none');
      setGeneralRating(vehicle.rating_general || 0);
      if (vehicle.metadata?.aspect_ratings) {
        setVehicleAspectRatings({
          ...vehicleAspectRatings,
          ...vehicle.metadata.aspect_ratings
        });
      } else {
        setVehicleAspectRatings({
          performance: 0, design: 0, driving: 0, usability: 0,
          offroad: 0, space: 0, safety: 0, versatility: 0,
          exclusivity: 0, powerWeight: 0, customization: 0, ridingExperience: 0,
          towing: 0, durability: 0, utility: 0, roadPresence: 0,
          history: 0, luxury: 0, capacity: 0,
          fun: 0, eco: 0, maneuverability: 0
        });
      }
    }
  };

  const renderAspectRating = (key: keyof typeof vehicleAspectRatings, label: string, show: boolean) => {
    if (!show) return null;
    return (
      <View style={styles.aspectRow}>
        <ThemedText style={styles.aspectLabel}>{label}</ThemedText>
        <View style={styles.aspectStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity 
              key={star} 
              onPress={() => setVehicleAspectRatings(prev => ({ ...prev, [key]: star }))}
            >
              <Ionicons 
                name={star <= vehicleAspectRatings[key] ? "star" : "star-outline"} 
                size={20} 
                color={star <= vehicleAspectRatings[key] ? "#FFCC00" : theme.text} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };


  const renderHeader = () => {
    let title = 'Vehicle Collections';
    if (currentView !== 'main') {
      const cat = VEHICLE_CATEGORIES.find(c => c.id === currentView);
      title = cat ? cat.label : 'Vehicles';
    }

    return (
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => currentView === 'main' ? router.back() : setCurrentView('main')}
          style={styles.backButton}
        >
          <Ionicons name={currentView === 'main' ? "chevron-back" : "arrow-back"} size={28} color={theme.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>{title}</ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {isOwnProfile ? (
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push({
                pathname: '/findsoulmate',
                params: { category: 'vehicle_favorites' }
              })}
            >
              <Ionicons name="heart" size={24} color={theme.brand} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push({
                pathname: '/compare',
                params: { userId: userId, userName: targetUserName, highlightCategory: 'vehicle_favorites' }
              })}
            >
              <Ionicons name="swap-horizontal" size={24} color={theme.brand} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMainView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {VEHICLE_CATEGORIES.map((cat) => {
        const items = favorites.filter(f => f.type === cat.id);
        if (!isOwnProfile && items.length === 0) return null;

        return (
          <View key={cat.id} style={styles.previewSection}>
            <TouchableOpacity 
              style={styles.previewSectionHeader}
              onPress={() => setCurrentView(cat.id as VehicleCollectionView)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
                <ThemedText style={styles.previewSectionTitle}>{cat.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={styles.itemPreviewList}>
              {items.slice(0, 3).map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                  onPress={() => handleVehiclePress(item)}
                >
                  {item.metadata?.image ? (
                    <Image source={{ uri: item.metadata.image }} style={[styles.favoriteImage, { width: 50, height: 50 }]} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.placeholderImage, { width: 50, height: 50 }]}>
                      <ThemedText style={{ fontSize: 20 }}>🚗</ThemedText>
                    </View>
                  )}
                  <View style={styles.favoriteInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ThemedText style={styles.favoriteSubtitle}>{item.metadata?.make_name || item.metadata?.make || ''}</ThemedText>
                      <View style={styles.starsRow}>
                        <Ionicons name="star" size={10} color="#FFCC00" />
                        <ThemedText style={{ fontSize: 10, marginLeft: 2, opacity: 0.7 }}>
                          {item.rating_mode === 'aspects' ? 'Aspects' : `${item.rating_general}/5`}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {items.length > 3 && (
                <TouchableOpacity onPress={() => setCurrentView(cat.id as VehicleCollectionView)} style={styles.seeAllFooter}>
                  <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {items.length} items</ThemedText>
                </TouchableOpacity>
              )}
              {items.length === 0 && (
                <View style={styles.emptyInline}>
                  <ThemedText style={styles.emptyInlineText}>No {cat.label.toLowerCase()} favorites yet.</ThemedText>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderCollectionView = (type: string) => {
    const items = favorites.filter(f => f.type === type);
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>
              {isOwnProfile ? 'No favorites in this category yet.' : 'No favorites shared in this category.'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.favoritesGrid}>
            {items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement }]}
                onPress={() => handleVehiclePress(item)}
              >
                {item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={styles.favoriteImage} />
                ) : (
                  <View style={[styles.favoriteImage, styles.placeholderImage]}>
                    <ThemedText style={{ fontSize: 32 }}>🚗</ThemedText>
                  </View>
                )}
                <View style={styles.favoriteInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <ThemedText style={styles.favoriteSubtitle}>{item.metadata?.make_name || item.metadata?.make || ''}</ThemedText>
                    <View style={styles.starsRow}>
                      <Ionicons name="star" size={12} color="#FFCC00" />
                      <ThemedText style={{ fontSize: 11, marginLeft: 2, opacity: 0.7 }}>
                        {item.rating_mode === 'aspects' ? 'Aspects' : `${item.rating_general}/5`}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                {isOwnProfile && (
                  <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
        {currentView === 'main' ? renderMainView() : renderCollectionView(currentView)}
      </SafeAreaView>

      <Modal
        visible={!!selectedVehicle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVehicle(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedVehicle?.value}</ThemedText>
                <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
                  <Ionicons name="close-circle" size={32} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: Spacing.four }}>
                <View style={styles.personInfoRow}>
                  {selectedVehicle?.metadata?.image ? (
                    <Image 
                      source={{ uri: selectedVehicle.metadata.image }} 
                      style={styles.modalThumbnail} 
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                      <ThemedText style={styles.placeholderText}>🚗</ThemedText>
                    </View>
                  )}
                  <View style={styles.personMeta}>
                    <ThemedText type="defaultSemiBold" style={{ color: theme.brand }}>Make</ThemedText>
                    <ThemedText style={styles.metaText}>{selectedVehicle?.metadata?.make_name || selectedVehicle?.metadata?.make || 'N/A'}</ThemedText>
                    
                    <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: theme.brand }]}>Type</ThemedText>
                    <ThemedText style={styles.metaText}>{selectedVehicle?.type === 'multipurpose passenger vehicle (mpv)' ? 'MPV' : selectedVehicle?.type === 'low speed vehicle (lsv)' ? 'LSV' : selectedVehicle?.type.charAt(0).toUpperCase() + selectedVehicle?.type.slice(1)}</ThemedText>
                  </View>
                </View>

                {isOwnProfile && (
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={[styles.editButton, isEditing && { backgroundColor: theme.brand }]} 
                      onPress={() => setIsEditing(!isEditing)}
                    >
                      <Ionicons name={isEditing ? "close-outline" : "create-outline"} size={20} color={isEditing ? "#fff" : theme.brand} />
                      <ThemedText style={[styles.editButtonText, isEditing && { color: "#fff" }]}>{isEditing ? "Cancel Editing" : "Edit Ratings"}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {isEditing ? (
                  <View style={styles.ratingSection}>
                    <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: theme.brand }]}>Edit Ratings</ThemedText>
                    <View style={styles.ratingModeContainer}>
                      <TouchableOpacity 
                        style={[styles.ratingModeButton, ratingMode === 'general' && { backgroundColor: theme.brand }]}
                        onPress={() => setRatingMode('general')}
                      >
                        <ThemedText style={[styles.ratingModeText, ratingMode === 'general' && { color: '#fff' }]}>General</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.ratingModeButton, ratingMode === 'aspects' && { backgroundColor: theme.brand }]}
                        onPress={() => setRatingMode('aspects')}
                      >
                        <ThemedText style={[styles.ratingModeText, ratingMode === 'aspects' && { color: '#fff' }]}>Aspects</ThemedText>
                      </TouchableOpacity>
                    </View>

                    {ratingMode === 'general' && (
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity key={star} onPress={() => setGeneralRating(star)}>
                            <Ionicons 
                              name={star <= generalRating ? "star" : "star-outline"} 
                              size={32} 
                              color={star <= generalRating ? "#FFCC00" : theme.text} 
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {ratingMode === 'aspects' && (
                      <View style={styles.aspectsContainer}>
                        {renderAspectRating('performance', 'Performance & Speed', selectedVehicle?.type === 'passenger car')}
                        {renderAspectRating('design', 'Design & Aesthetics', selectedVehicle?.type === 'passenger car')}
                        {renderAspectRating('driving', 'Driving Dynamics', selectedVehicle?.type === 'passenger car')}
                        {renderAspectRating('usability', 'Daily Usability', selectedVehicle?.type === 'passenger car')}

                        {renderAspectRating('offroad', 'Off-Road Capability', selectedVehicle?.type === 'multipurpose passenger vehicle (mpv)')}
                        {renderAspectRating('space', 'Cabin & Cargo Space', selectedVehicle?.type === 'multipurpose passenger vehicle (mpv)')}
                        {renderAspectRating('safety', 'Safety & Reliability', selectedVehicle?.type === 'multipurpose passenger vehicle (mpv)')}
                        {renderAspectRating('versatility', 'Versatility & Adventure', selectedVehicle?.type === 'multipurpose passenger vehicle (mpv)')}

                        {renderAspectRating('exclusivity', 'Exclusivity & Heritage', selectedVehicle?.type === 'motorcycle')}
                        {renderAspectRating('powerWeight', 'Power-to-Weight Ratio', selectedVehicle?.type === 'motorcycle')}
                        {renderAspectRating('customization', 'Customization Potential', selectedVehicle?.type === 'motorcycle')}
                        {renderAspectRating('ridingExperience', 'Riding Experience', selectedVehicle?.type === 'motorcycle')}

                        {renderAspectRating('towing', 'Towing & Payload Capacity', selectedVehicle?.type === 'truck')}
                        {renderAspectRating('durability', 'Durability & Ruggedness', selectedVehicle?.type === 'truck')}
                        {renderAspectRating('utility', 'Utility & Functionality', selectedVehicle?.type === 'truck')}
                        {renderAspectRating('roadPresence', 'Road Presence', selectedVehicle?.type === 'truck')}

                        {renderAspectRating('history', 'Historical Significance', selectedVehicle?.type === 'bus')}
                        {renderAspectRating('luxury', 'Luxury & Customization', selectedVehicle?.type === 'bus')}
                        {renderAspectRating('capacity', 'Passenger Capacity', selectedVehicle?.type === 'bus')}

                        {renderAspectRating('fun', 'Recreational Fun', selectedVehicle?.type === 'low speed vehicle (lsv)')}
                        {renderAspectRating('eco', 'Eco-Friendliness', selectedVehicle?.type === 'low speed vehicle (lsv)')}
                        {renderAspectRating('maneuverability', 'Compact Maneuverability', selectedVehicle?.type === 'low speed vehicle (lsv)')}
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.saveButton, { backgroundColor: theme.brand }]} 
                      onPress={updateRatings}
                    >
                      <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.detailCard}>
                    {selectedVehicle?.rating_mode === 'general' && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>General Rating</ThemedText>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons 
                              key={star}
                              name={star <= selectedVehicle.rating_general ? "star" : "star-outline"} 
                              size={16} 
                              color={star <= selectedVehicle.rating_general ? "#FFCC00" : theme.text} 
                            />
                          ))}
                          <ThemedText style={{ marginLeft: Spacing.one }}>{selectedVehicle.rating_general}/5</ThemedText>
                        </View>
                      </View>
                    )}
                    
                    {selectedVehicle?.rating_mode === 'aspects' && selectedVehicle?.metadata?.aspect_ratings && (
                      <View style={styles.aspectsSection}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Aspect Ratings</ThemedText>
                        {Object.entries(selectedVehicle.metadata.aspect_ratings).map(([key, value]) => (
                          value !== 0 ? (
                            <View key={key} style={styles.detailRow}>
                              <ThemedText style={styles.detailLabel}>
                                {getAspectLabel(key)}
                              </ThemedText>
                              <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Ionicons 
                                    key={star}
                                    name={star <= (value as number) ? "star" : "star-outline"} 
                                    size={14} 
                                    color={star <= (value as number) ? "#FFCC00" : theme.text} 
                                  />
                                ))}
                                <ThemedText style={{ marginLeft: Spacing.one, fontSize: 12 }}>{value}/5</ThemedText>
                              </View>
                            </View>
                          ) : null
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </ThemedView>
          </SafeAreaView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const getAspectLabel = (key: string) => {
  const labels: Record<string, string> = {
    performance: 'Performance & Speed',
    design: 'Design & Aesthetics',
    driving: 'Driving Dynamics',
    usability: 'Daily Usability',
    offroad: 'Off-Road Capability',
    space: 'Cabin & Cargo Space',
    safety: 'Safety & Reliability',
    versatility: 'Versatility & Adventure',
    exclusivity: 'Exclusivity & Heritage',
    powerWeight: 'Power-to-Weight Ratio',
    customization: 'Customization Potential',
    ridingExperience: 'Riding Experience',
    towing: 'Towing & Payload Capacity',
    durability: 'Durability & Ruggedness',
    utility: 'Utility & Functionality',
    roadPresence: 'Road Presence',
    history: 'Historical Significance',
    luxury: 'Luxury & Customization',
    capacity: 'Passenger Capacity',
    fun: 'Recreational Fun',
    eco: 'Eco-Friendliness',
    maneuverability: 'Compact Maneuverability',
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemPreviewList: {
    gap: 0,
  },
  seeAllFooter: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    marginTop: Spacing.two,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyInline: {
    padding: Spacing.four,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyInlineText: {
    opacity: 0.5,
    fontSize: 14,
  },
  favoritesGrid: {
    gap: Spacing.three,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.three,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: Spacing.three,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  searchButton: {
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: 25,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryTabs: {
    marginVertical: Spacing.two,
  },
  categoryTab: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginRight: Spacing.two,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  personInfoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  modalThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  personMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  metaText: {
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  metaLabel: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
  editActions: {
    marginVertical: Spacing.two,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    gap: Spacing.two,
  },
  editButtonText: {
    fontWeight: '600',
  },
  ratingSection: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  ratingModeContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  ratingModeButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  ratingModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  aspectsContainer: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  aspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  aspectLabel: {
    fontSize: 14,
    flex: 1,
  },
  aspectStars: {
    flexDirection: 'row',
    gap: 4,
  },
  saveButton: {
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 16,
    padding: Spacing.three,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.05)',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  aspectsSection: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
});
