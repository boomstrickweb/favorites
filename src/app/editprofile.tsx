import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [x, setX] = useState('');
  const [pinterest, setPinterest] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || '');
          setInstagram(data.instagram_url || '');
          setFacebook(data.facebook_url || '');
          setX(data.x_url || '');
          setPinterest(data.pinterest_url || '');
          setSnapchat(data.snapchat_url || '');
          setInterests(data.interests || []);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Avoid synchronous setState in effect warning by checking if already loading or just letting it run
    // Since fetchProfile sets loading to true, it's safer to call it
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Could not pick image');
    }
  }

  async function uploadAvatar(uri: string) {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user on upload!');

      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Convert URI to Blob
      let blob: Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        blob = await response.blob();
      } else {
        // For native, fetch(uri).blob() can be problematic.
        // We use XMLHttpRequest which is more reliable for local files in React Native.
        blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            console.error('[EditProfile] XHR Error:', e);
            reject(new Error('Failed to fetch local file'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        }) as Blob;
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          avatar_url: avatarUrl,
          instagram_url: instagram,
          facebook_url: facebook,
          x_url: x,
          pinterest_url: pinterest,
          snapchat_url: snapchat,
          interests: interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: handleBack }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const interestIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Arts & Crafts': 'brush',
    'Collecting': 'archive',
    'Gaming & Tech': 'game-controller',
    'Outdoor & Adventure': 'leaf',
    'Sports & Fitness': 'fitness',
    'Music & Performance': 'musical-notes',
    'Food & Drink': 'restaurant',
    'Domestic & Lifestyle': 'home',
    'Literature & Mental Fitness': 'book'
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Edit Profile</ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.brand} />
            ) : (
              <ThemedText style={{ color: theme.brand, fontWeight: '700' }}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name="person" size={40} color={theme.textSecondary} />
                  </View>
                )}
                <View style={[styles.editIconBadge, { backgroundColor: theme.brand }]}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <ThemedText style={styles.avatarLabel}>Change Profile Picture</ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your Name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Bio</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Interests & Hobbies</ThemedText>
            <View style={styles.interestsContainer}>
              {[
                'Arts & Crafts',
                'Collecting',
                'Gaming & Tech',
                'Outdoor & Adventure',
                'Sports & Fitness',
                'Music & Performance',
                'Food & Drink',
                'Domestic & Lifestyle',
                'Literature & Mental Fitness'
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.interestChip,
                    { backgroundColor: interests.includes(item) ? theme.brand : theme.backgroundElement },
                    interests.includes(item) && styles.interestChipSelected
                  ]}
                  onPress={() => toggleInterest(item)}
                >
                  <Ionicons 
                    name={interestIcons[item]} 
                    size={16} 
                    color={interests.includes(item) ? '#fff' : theme.textSecondary} 
                    style={{ marginRight: 6 }}
                  />
                  <ThemedText 
                    style={[
                      styles.interestText,
                      { color: interests.includes(item) ? '#fff' : theme.textSecondary }
                    ]}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Social Accounts</ThemedText>

            <View style={styles.section}>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-instagram" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.socialInput, { color: theme.text }]}
                  value={instagram}
                  onChangeText={setInstagram}
                  placeholder="Instagram URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-facebook" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.socialInput, { color: theme.text }]}
                  value={facebook}
                  onChangeText={setFacebook}
                  placeholder="Facebook URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-twitter" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.socialInput, { color: theme.text }]}
                  value={x}
                  onChangeText={setX}
                  placeholder="X (Twitter) URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-pinterest" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.socialInput, { color: theme.text }]}
                  value={pinterest}
                  onChangeText={setPinterest}
                  placeholder="Pinterest URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-snapchat" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.socialInput, { color: theme.text }]}
                  value={snapchat}
                  onChangeText={setSnapchat}
                  placeholder="Snapchat URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    paddingHorizontal: Spacing.four,
    height: 56,
  },
  headerTitle: {
    fontSize: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.two,
    opacity: 0.6,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.two,
    opacity: 0.8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
    paddingVertical: Spacing.two,
    gap: Spacing.three,
  },
  socialInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  interestChipSelected: {
    borderColor: 'rgba(0,0,0,0.1)',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
