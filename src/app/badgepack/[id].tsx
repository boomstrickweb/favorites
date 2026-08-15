import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, ActivityIndicator, Alert, Platform, Modal, TextInput, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { uploadToB2 } from '@/lib/b2';

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

export default function BadgePackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [pack, setPack] = useState<BadgePack | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [badgeName, setBadgeName] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedBadgeForOptions, setSelectedBadgeForOptions] = useState<any>(null);
  const [showBadgeOptionsModal, setShowBadgeOptionsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletePackModal, setShowDeletePackModal] = useState(false);
  const [deletingPack, setDeletingPack] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    if (id) {
      fetchPackDetails();
    }
  }, [id]);

  const fetchPackDetails = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('badge_packs')
        .select('*, profiles(username)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setPack(data);
      setIsOwner(user?.id === data.creator_id);

      // Fetch badges for this pack
      fetchBadges();

    } catch (error: any) {
      console.error('Error fetching pack details:', error.message);
      Alert.alert('Error', 'Could not load badge pack details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('pack_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error: any) {
      console.error('Error fetching badges:', error.message);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        // On web, we sometimes need to explicitly request permissions even though launchImageLibraryAsync handles it
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          window.alert('Permission to access media library was denied');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        // Check format
        const isPng = asset.uri.toLowerCase().endsWith('.png');
        const isSvg = asset.uri.toLowerCase().endsWith('.svg');
        
        // Some pickers don't include extension, check mime type if available
        const mimeType = asset.mimeType;
        const isPngMime = mimeType === 'image/png';
        const isSvgMime = mimeType === 'image/svg+xml';

        if (!isPng && !isSvg && !isPngMime && !isSvgMime) {
          if (Platform.OS === 'web') {
            window.alert('Please select a PNG or SVG image.');
          } else {
            Alert.alert('Error', 'Please select a PNG or SVG image.');
          }
          return;
        }

        setSelectedImage(asset.uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        window.alert('Error picking image: ' + error.message);
      } else {
        Alert.alert('Error', 'Could not pick image: ' + error.message);
      }
    }
  };

  const handleUpload = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Not Available on Mobile',
        'Badge uploading is currently only available on the web version. Please use the web version to upload badges.'
      );
      return;
    }

    if (!badgeName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a badge name');
      } else {
        Alert.alert('Error', 'Please enter a badge name');
      }
      return;
    }
    if (!selectedImage) {
      if (Platform.OS === 'web') {
        window.alert('Please select an image');
      } else {
        Alert.alert('Error', 'Please select an image');
      }
      return;
    }

    try {
      setUploading(true);

      let finalUri = selectedImage;
      let finalFileName = `badge_${Date.now()}.png`;

      // 1. Resize and format
      // Note: ImageManipulator doesn't support SVG, so we assume PNG for bitmapped images
      // If it's already a PNG/SVG we just resize it to 256x256
      if (selectedImage.toLowerCase().endsWith('.png') || !selectedImage.toLowerCase().endsWith('.svg')) {
        const manipulated = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: 256, height: 256 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        finalUri = manipulated.uri;
      } else {
        // For SVG, we keep as is but B2 upload might need specific handling if it's a blob/base64 on web
        finalFileName = `badge_${Date.now()}.svg`;
      }
      
      // 2. Upload to BackBlaze B2
      const imageUrl = await uploadToB2(finalUri, finalFileName, finalFileName.endsWith('.svg') ? 'image/svg+xml' : 'image/png');

      // 3. Save to Supabase
      const { error } = await supabase
        .from('badges')
        .insert({
          pack_id: id,
          name: badgeName.trim(),
          image_url: imageUrl,
        });

      if (error) throw error;

      if (Platform.OS === 'web') {
        window.alert('Badge uploaded successfully!');
      } else {
        Alert.alert('Success', 'Badge uploaded successfully!');
      }
      setShowUploadModal(false);
      setBadgeName('');
      setSelectedImage(null);
      fetchBadges();

    } catch (error: any) {
      console.error('Error uploading badge:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to upload badge: ' + (error.message || 'Unknown error'));
      } else {
        Alert.alert('Error', 'Failed to upload badge: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleBadgeOptions = (badge: any) => {
    setSelectedBadgeForOptions(badge);
    setShowBadgeOptionsModal(true);
  };

  const closeOptionsModal = () => {
    setShowBadgeOptionsModal(false);
  };

  const handleSetAsProfileBadge = async (badge: any) => {
    try {
      if (!currentUser) {
        if (Platform.OS === 'web') {
          window.alert('You must be logged in to set a badge');
        } else {
          Alert.alert('Error', 'You must be logged in to set a badge');
        }
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ profile_badge: badge.id })
        .eq('id', currentUser.id);

      if (error) throw error;
      closeOptionsModal();
      if (Platform.OS === 'web') {
        window.alert('Badge set as profile badge');
      } else {
        Alert.alert('Success', 'Badge set as profile badge');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Failed to set badge: ' + error.message);
      } else {
        Alert.alert('Error', 'Failed to set badge: ' + error.message);
      }
    }
  };

  const performDeleteBadge = async (badge: any) => {
    if (!badge || !badge.id) return;
    try {
      setIsDeleting(true);
      closeOptionsModal();
      // Optimistic update
      setBadges(prev => prev.filter(b => b.id !== badge.id));

      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badge.id);
      
      if (error) {
        console.error('Error deleting badge:', error);
        fetchBadges();
        throw error;
      }
    } catch (error: any) {
      console.error('Failed to delete badge:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete badge: ' + (error.message || 'Unknown error'));
      } else {
        Alert.alert('Error', 'Failed to delete badge: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePack = () => {
    setShowDeletePackModal(true);
  };

  const confirmDeletePack = async () => {
    if (!id) return;
    try {
      setDeletingPack(true);
      const { error } = await supabase
        .from('badge_packs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting badge pack:', error);
        throw error;
      }

      setShowDeletePackModal(false);
      if (Platform.OS === 'web') {
        window.alert('Badge pack deleted successfully');
      } else {
        Alert.alert('Success', 'Badge pack deleted successfully');
      }
      router.replace('/badgemarketplace');
    } catch (error: any) {
      console.error('Failed to delete badge pack:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete pack: ' + (error.message || 'Unknown error'));
      } else {
        Alert.alert('Error', 'Failed to delete pack: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setDeletingPack(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color={theme.brand} style={{ marginTop: 50 }} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!pack) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
            {pack.name}
          </ThemedText>
          {isOwner ? (
            <TouchableOpacity onPress={handleDeletePack} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={22} color="#FF4444" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.packInfoCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.packIconContainer, { backgroundColor: theme.background }]}>
              <Ionicons name={pack.icon as any} size={64} color={theme.brand} />
            </View>
            <ThemedText type="title" style={styles.packName}>{pack.name}</ThemedText>
            <ThemedText style={styles.packCreator}>by {pack.profiles?.username || 'Unknown'}</ThemedText>
            
            {isOwner && (
              <View style={styles.ownerActionsContainer}>
                <TouchableOpacity 
                  style={[styles.uploadButton, { backgroundColor: theme.brand }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Alert.alert(
                        'Not Available on Mobile',
                        'Badge uploading is currently only available on the web version. Please use the web version to upload badges.'
                      );
                      return;
                    }
                    setShowUploadModal(true);
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                  <ThemedText style={styles.uploadButtonText}>Upload Badge</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.deletePackButton, { borderColor: '#FF4444' }]}
                  onPress={handleDeletePack}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF4444" />
                  <ThemedText style={styles.deletePackButtonText}>Delete Pack</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.badgesSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Badges</ThemedText>
            {badges.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.two }}>No badges in this pack yet.</ThemedText>
              </View>
            ) : (
      <View style={styles.badgesGrid}>
        {badges.map(badge => (
          <View key={badge.id} style={[styles.badgeItem, { backgroundColor: theme.backgroundElement }]}>
            <TouchableOpacity 
              style={styles.moreButton} 
              onPress={() => handleBadgeOptions(badge)}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <Image source={{ uri: badge.image_url }} style={styles.badgeImage} />
            <ThemedText style={styles.badgeItemName} numberOfLines={1}>{badge.name}</ThemedText>
          </View>
        ))}
      </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showBadgeOptionsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeOptionsModal}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={closeOptionsModal} 
          />
          <ThemedView style={styles.optionsModalContent}>
            <View style={styles.optionsHeader}>
              <ThemedText type="subtitle" numberOfLines={1}>{selectedBadgeForOptions?.name}</ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => handleSetAsProfileBadge(selectedBadgeForOptions)}
            >
              <Ionicons name="person-circle-outline" size={24} color={theme.text} />
              <ThemedText style={styles.optionText}>Set as profile badge</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => performDeleteBadge(selectedBadgeForOptions)}
            >
              <Ionicons name="trash-outline" size={24} color="#FF4444" />
              <ThemedText style={[styles.optionText, { color: '#FF4444' }]}>Delete</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { borderBottomWidth: 0 }]} 
              onPress={closeOptionsModal}
            >
              <Ionicons name="close-outline" size={24} color={theme.textSecondary} />
              <ThemedText style={[styles.optionText, { color: theme.textSecondary }]}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showDeletePackModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeletePackModal(false)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowDeletePackModal(false)} 
          />
          <ThemedView style={styles.optionsModalContent}>
            <View style={styles.confirmDeleteContainer}>
              <View style={styles.optionsHeader}>
                <ThemedText type="subtitle" style={{ color: '#FF4444' }}>Delete Badge Pack?</ThemedText>
              </View>
              
              <ThemedText style={styles.confirmDeleteText}>
                Are you sure you want to delete &quot;{pack?.name}&quot;? All badges inside this pack will also be permanently deleted.
              </ThemedText>

              <TouchableOpacity 
                style={[styles.confirmDeleteButton, deletingPack && { opacity: 0.6 }]} 
                onPress={confirmDeletePack}
                disabled={deletingPack}
              >
                {deletingPack ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFF" />
                    <ThemedText style={styles.confirmDeleteButtonText}>Delete Pack</ThemedText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelDeleteButton} 
                onPress={() => setShowDeletePackModal(false)}
                disabled={deletingPack}
              >
                <ThemedText style={[styles.cancelDeleteButtonText, { color: theme.textSecondary }]}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Upload New Badge</ThemedText>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <ThemedText style={styles.inputLabel}>Badge Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: 'rgba(128,128,128,0.2)', borderWidth: 1 }]}
                placeholder="Enter badge name"
                placeholderTextColor={theme.textSecondary}
                value={badgeName}
                onChangeText={setBadgeName}
              />

              <ThemedText style={styles.inputLabel}>Badge Image (256x256 PNG/SVG)</ThemedText>
              <TouchableOpacity 
                style={[styles.imagePicker, { backgroundColor: theme.background, borderColor: theme.brand, borderWidth: 1, borderStyle: 'dashed' }]}
                onPress={handlePickImage}
              >
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.pickerPlaceholder}>
                    <Ionicons name="image-outline" size={40} color={theme.brand} />
                    <ThemedText style={{ color: theme.brand, marginTop: Spacing.two }}>Select Image</ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: theme.brand }, (uploading || !selectedImage || !badgeName) && { opacity: 0.5 }]}
                onPress={handleUpload}
                disabled={uploading || !selectedImage || !badgeName}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.createButtonText}>Upload Badge</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  packInfoCard: {
    padding: Spacing.six,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  packIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  packName: {
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  packCreator: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: Spacing.six,
  },
  ownerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: 25,
    gap: Spacing.two,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deletePackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 25,
    borderWidth: 1,
    gap: Spacing.two,
  },
  deletePackButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: Spacing.four,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.ten,
    opacity: 0.8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  badgeItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: Spacing.one,
    resizeMode: 'contain',
  },
  badgeItemName: {
    fontSize: 12,
    textAlign: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 6,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.six,
    paddingHorizontal: Spacing.two,
  },
  modalScroll: {
    paddingBottom: Spacing.ten,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
  },
  input: {
    borderRadius: 10,
    padding: Spacing.four,
    fontSize: 16,
    marginBottom: Spacing.four,
  },
  imagePicker: {
    height: 200,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.six,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pickerPlaceholder: {
    alignItems: 'center',
  },
  createButton: {
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsModalContent: {
    width: '88%',
    maxWidth: 380,
    alignSelf: 'center',
    borderRadius: 20,
    padding: Spacing.five,
  },
  optionsHeader: {
    paddingBottom: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    alignItems: 'center',
    width: '100%',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    gap: Spacing.three,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmDeleteContainer: {
    alignItems: 'center',
    width: '100%',
  },
  confirmDeleteText: {
    textAlign: 'center',
    marginVertical: Spacing.four,
    fontSize: 15,
    lineHeight: 22,
  },
  confirmDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#FF4444',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    width: '100%',
    marginTop: Spacing.two,
  },
  confirmDeleteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelDeleteButton: {
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
    alignItems: 'center',
    width: '100%',
  },
  cancelDeleteButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
