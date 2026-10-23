import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, Platform, ActivityIndicator, FlatList, Dimensions, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { GIFTS, Gift, GiftIconDisplay, IconFamily } from '@/components/Gifts';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = (Math.min(width, MaxContentWidth) - Spacing.four * 2 - Spacing.three * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'halloween', label: '🎃 Halloween' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: '⭐ Premium' },
];

function AnimatedGiftIcon({ icon, iconFamily = 'Ionicons', color, type }: { icon: string, iconFamily?: IconFamily, color: string, type: Gift['animationType'] }) {
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
      <GiftIconDisplay icon={icon} iconFamily={iconFamily} size={32} color={color} />
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

      // Check premium specific constraint: same gift to same user once per day
      if (isPremium) {
        const today = new Date().toISOString().split('T')[0];
        const { data: alreadySent, error: checkError } = await supabase
          .from('gifts')
          .select('id')
          .eq('sender_id', user.id)
          .eq('receiver_id', userId)
          .eq('gift_type', gift.id)
          .gte('created_at', today)
          .maybeSingle();
        
        if (checkError) console.error('Error checking gift limit:', checkError);

        if (alreadySent) {
          Alert.alert(
            'Limit Reached',
            `Premium users can only send the same gift to the same user once per day. You've already sent a ${gift.name} to ${userName} today.`
          );
          setLoading(false);
          return;
        }
      }

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

  const filteredGifts = selectedCategory === 'all' 
    ? GIFTS 
    : GIFTS.filter(g => (g.category || (g.isPremium ? 'premium' : 'standard')) === selectedCategory);

  const renderGiftItem = ({ item, index }: { item: Gift; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 30).duration(300)}
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
          <AnimatedGiftIcon icon={item.icon} iconFamily={item.iconFamily} color={item.color} type={item.animationType} />
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}
          {item.category === 'halloween' && (
            <View style={[styles.premiumBadge, { backgroundColor: '#FF7518', borderColor: '#FFA726' }]}>
              <GiftIconDisplay icon="pumpkin" iconFamily="MaterialCommunityIcons" size={11} color="#FFF" />
            </View>
          )}
        </View>
        <ThemedText style={styles.giftName} numberOfLines={2}>{item.name}</ThemedText>
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
            data={filteredGifts}
            keyExtractor={(item) => item.id}
            renderItem={renderGiftItem}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={
              <View style={styles.headerSection}>
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

                {/* Category Filter Chips */}
                <View style={styles.categoriesContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: isActive 
                                ? (cat.id === 'halloween' ? '#FF7518' : theme.brand)
                                : theme.backgroundElement,
                              borderColor: isActive
                                ? 'transparent'
                                : (theme.border || 'rgba(128,128,128,0.2)'),
                            },
                          ]}
                          onPress={() => setSelectedCategory(cat.id)}
                        >
                          <ThemedText
                            style={[
                              styles.categoryChipText,
                              isActive && { color: '#FFFFFF', fontWeight: '700' },
                            ]}
                          >
                            {cat.label}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
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
  headerSection: {
    marginBottom: Spacing.four,
  },
  infoContainer: {
    marginBottom: Spacing.three,
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: Spacing.two,
  },
  categoriesContent: {
    gap: Spacing.two,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
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
