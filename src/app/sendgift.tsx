import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, Platform, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInUp, 
  Layout, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  Easing
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = (Math.min(width, MaxContentWidth) - Spacing.four * 2 - Spacing.three * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface Gift {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPremium: boolean;
  color: string;
  animationType: 'pulse' | 'shake' | 'float';
}

const GIFTS: Gift[] = [
  // Standard Gifts
  { id: 'heart', name: 'Heart', icon: 'heart', isPremium: false, color: '#FF2D55', animationType: 'pulse' },
  { id: 'thumbs-up', name: 'Thumbs Up', icon: 'thumbs-up', isPremium: false, color: '#007AFF', animationType: 'shake' },
  { id: 'rose', name: 'Rose', icon: 'flower', isPremium: false, color: '#FF3B30', animationType: 'float' },
  { id: 'coffee', name: 'Coffee', icon: 'cafe', isPremium: false, color: '#A2845E', animationType: 'pulse' },
  { id: 'chocolate', name: 'Chocolate', icon: 'nutrition', isPremium: false, color: '#7B3F00', animationType: 'float' },
  { id: 'candy', name: 'Candy', icon: 'ice-cream', isPremium: false, color: '#FF9500', animationType: 'shake' },
  { id: 'cookie', name: 'Cookie', icon: 'disc', isPremium: false, color: '#C58C5A', animationType: 'pulse' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza', isPremium: false, color: '#FFCC00', animationType: 'float' },
  
  // Premium Gifts
  { id: 'clapperboard', name: 'Clapperboard', icon: 'videocam', isPremium: true, color: '#5856D6', animationType: 'shake' },
  { id: 'golden-book', name: 'Golden Book', icon: 'book', isPremium: true, color: '#FFD700', animationType: 'pulse' },
  { id: 'vinyl-record', name: 'Vinyl Record', icon: 'musical-notes', isPremium: true, color: '#333333', animationType: 'float' },
  { id: 'golden-controller', name: 'Golden Controller', icon: 'game-controller', isPremium: true, color: '#FFD700', animationType: 'shake' },
  { id: 'car-key', name: 'Car Key', icon: 'key', isPremium: true, color: '#8E8E93', animationType: 'pulse' },
  { id: 'golden-ball', name: 'Golden Ball', icon: 'football', isPremium: true, color: '#FFD700', animationType: 'float' },
  { id: 'titanium-phone', name: 'Titanium Phone', icon: 'phone-portrait', isPremium: true, color: '#B4B4B4', animationType: 'pulse' },
  { id: 'compass', name: 'Compass', icon: 'compass', isPremium: true, color: '#5AC8FA', animationType: 'shake' },
  { id: 'chef-hat', name: 'Chef Hat', icon: 'restaurant', isPremium: true, color: '#FFFFFF', animationType: 'float' },
];

function AnimatedGiftIcon({ icon, color, type }: { icon: keyof typeof Ionicons.glyphMap, color: string, type: Gift['animationType'] }) {
  const animation = useSharedValue(0);

  useEffect(() => {
    if (type === 'pulse') {
      animation.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (type === 'shake') {
      animation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 100 }),
          withTiming(0, { duration: 100 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    } else if (type === 'float') {
      animation.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    if (type === 'pulse') {
      return {
        transform: [{ scale: 1 + animation.value * 0.15 }],
      };
    } else if (type === 'shake') {
      return {
        transform: [{ rotate: `${animation.value}deg` }],
      };
    } else if (type === 'float') {
      return {
        transform: [{ translateY: animation.value * -8 }],
      };
    }
    return {};
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={icon} size={32} color={color} />
    </Animated.View>
  );
}

export default function SendGiftScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [giftsSentToday, setGiftsSentToday] = useState(0);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check premium status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      
      setIsPremium(!!profile?.is_premium);

      // Check gifts sent today
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .gte('created_at', today);

      if (!error) {
        setGiftsSentToday(count || 0);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleSendGift = async (gift: Gift) => {
    if (gift.isPremium && !isPremium) {
      Alert.alert(
        'Premium Feature',
        'This gift is exclusive to Premium users. Would you like to upgrade?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium') }
        ]
      );
      return;
    }

    if (!isPremium && giftsSentToday >= 3) {
      Alert.alert(
        'Limit Reached',
        'Non-premium users can send up to 3 gifts per day. Upgrade to Premium for unlimited gifts!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium') }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('gifts').insert({
        sender_id: user.id,
        receiver_id: userId,
        gift_type: gift.id,
      });

      if (error) throw error;

      Alert.alert('Success', `You sent a ${gift.name} to ${userName}!`);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  const renderGiftItem = ({ item, index }: { item: Gift; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 50).duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[
          styles.giftItem,
          { backgroundColor: theme.backgroundElement }
        ]}
        onPress={() => handleSendGift(item)}
        disabled={loading}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <AnimatedGiftIcon icon={item.icon} color={item.color} type={item.animationType} />
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}
        </View>
        <ThemedText style={styles.giftName}>{item.name}</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Send Gift to {userName}</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {fetchingStatus ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={GIFTS}
            keyExtractor={(item) => item.id}
            renderItem={renderGiftItem}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={
              <View style={styles.infoContainer}>
                {!isPremium && (
                  <View style={[styles.limitBadge, { backgroundColor: theme.brand + '20' }]}>
                    <ThemedText style={[styles.limitText, { color: theme.brand }]}>
                      Daily Limit: {giftsSentToday}/3 Gifts Used
                    </ThemedText>
                  </View>
                )}
                {isPremium && (
                  <View style={[styles.limitBadge, { backgroundColor: '#FFD70020' }]}>
                    <ThemedText style={[styles.limitText, { color: '#B8860B' }]}>
                      Premium User: Unlimited Gifts
                    </ThemedText>
                  </View>
                )}
              </View>
            }
          />
        )}
      </SafeAreaView>
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
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
    paddingBottom: Spacing.eight,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  infoContainer: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  limitBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
  },
  limitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  giftItem: {
    width: ITEM_SIZE,
    padding: Spacing.two,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    position: 'relative',
  },
  giftName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#333',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
