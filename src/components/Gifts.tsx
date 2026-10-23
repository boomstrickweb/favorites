import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';

interface GiftRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_type: string;
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
  };
}

interface GiftStats {
  gift_type: string;
  count: number;
}

interface TopGifter {
  sender_id: string;
  username: string;
  count: number;
}

interface GiftsProps {
  userId: string;
  isFullScreen?: boolean;
}

export type IconFamily = 'Ionicons' | 'MaterialCommunityIcons';

export interface Gift {
  id: string;
  name: string;
  icon: string;
  iconFamily?: IconFamily;
  category?: 'halloween' | 'standard' | 'premium';
  isPremium: boolean;
  color: string;
  animationType: 'pulse' | 'shake' | 'float';
}

export function GiftIconDisplay({
  icon,
  iconFamily = 'Ionicons',
  size = 20,
  color,
}: {
  icon: string;
  iconFamily?: IconFamily;
  size?: number;
  color: string;
}) {
  if (iconFamily === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
  }
  return <Ionicons name={icon as any} size={size} color={color} />;
}

export const GIFTS: Gift[] = [
  // Halloween Gifts
  { id: 'pumpkin', name: 'Pumpkin', icon: 'pumpkin', iconFamily: 'MaterialCommunityIcons', category: 'halloween', isPremium: false, color: '#FF7518', animationType: 'pulse' },
  { id: 'ghost', name: 'Ghost', icon: 'ghost', iconFamily: 'MaterialCommunityIcons', category: 'halloween', isPremium: false, color: '#9B51E0', animationType: 'float' },
  { id: 'trick-or-treat-candy', name: 'Trick or Treat Candy', icon: 'candy', iconFamily: 'MaterialCommunityIcons', category: 'halloween', isPremium: false, color: '#FF9500', animationType: 'shake' },

  // Standard Gifts
  { id: 'heart', name: 'Heart', icon: 'heart', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#FF2D55', animationType: 'pulse' },
  { id: 'thumbs-up', name: 'Thumbs Up', icon: 'thumbs-up', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#007AFF', animationType: 'shake' },
  { id: 'rose', name: 'Rose', icon: 'flower', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#FF3B30', animationType: 'float' },
  { id: 'coffee', name: 'Coffee', icon: 'cafe', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#A2845E', animationType: 'pulse' },
  { id: 'chocolate', name: 'Chocolate', icon: 'nutrition', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#7B3F00', animationType: 'float' },
  { id: 'candy', name: 'Candy', icon: 'ice-cream', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#FF9500', animationType: 'shake' },
  { id: 'cookie', name: 'Cookie', icon: 'disc', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#C58C5A', animationType: 'pulse' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza', iconFamily: 'Ionicons', category: 'standard', isPremium: false, color: '#FFCC00', animationType: 'float' },
  
  // Premium Gifts
  { id: 'clapperboard', name: 'Clapperboard', icon: 'videocam', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#5856D6', animationType: 'shake' },
  { id: 'golden-book', name: 'Golden Book', icon: 'book', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#FFD700', animationType: 'pulse' },
  { id: 'vinyl-record', name: 'Vinyl Record', icon: 'musical-notes', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#333333', animationType: 'float' },
  { id: 'golden-controller', name: 'Golden Controller', icon: 'game-controller', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#FFD700', animationType: 'shake' },
  { id: 'car-key', name: 'Car Key', icon: 'key', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#8E8E93', animationType: 'pulse' },
  { id: 'golden-ball', name: 'Golden Ball', icon: 'football', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#FFD700', animationType: 'float' },
  { id: 'titanium-phone', name: 'Titanium Phone', icon: 'phone-portrait', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#B4B4B4', animationType: 'pulse' },
  { id: 'compass', name: 'Compass', icon: 'compass', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#5AC8FA', animationType: 'shake' },
  { id: 'chef-hat', name: 'Chef Hat', icon: 'restaurant', iconFamily: 'Ionicons', category: 'premium', isPremium: true, color: '#FFFFFF', animationType: 'float' },
];

export function Gifts({ userId, isFullScreen }: GiftsProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [receivedGifts, setReceivedGifts] = useState<GiftRecord[]>([]);
  const [stats, setStats] = useState<GiftStats[]>([]);
  const [topGifter, setTopGifter] = useState<TopGifter | null>(null);

  useEffect(() => {
    fetchGiftsData();
  }, [userId]);

  const fetchGiftsData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch received gifts with sender info
      const { data: giftsData, error: giftsError } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:profiles!sender_id(username, full_name)
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (giftsError) throw giftsError;
      setReceivedGifts(giftsData || []);

      // 2. Calculate stats for this user
      const giftCounts: Record<string, number> = {};
      const gifterCounts: Record<string, { username: string; count: number }> = {};
      
      (giftsData || []).forEach(gift => {
        giftCounts[gift.gift_type] = (giftCounts[gift.gift_type] || 0) + 1;
        
        const senderId = gift.sender_id;
        const senderUsername = gift.sender?.username || 'Unknown';
        if (!gifterCounts[senderId]) {
          gifterCounts[senderId] = { username: senderUsername, count: 0 };
        }
        gifterCounts[senderId].count += 1;
      });

      const statsArray = Object.entries(giftCounts).map(([type, count]) => ({
        gift_type: type,
        count
      })).sort((a, b) => b.count - a.count);
      
      setStats(statsArray);

      // 3. Find top gifter for this user
      let top: TopGifter | null = null;
      Object.entries(gifterCounts).forEach(([id, data]) => {
        if (!top || data.count > top.count) {
          top = { sender_id: id, username: data.username, count: data.count };
        }
      });
      setTopGifter(top);
    } catch (error) {
      console.error('Error fetching gifts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const halloweenInventory = stats.filter(s => {
    const gift = GIFTS.find(g => g.id === s.gift_type);
    return gift?.category === 'halloween';
  });
  const standardInventory = stats.filter(s => {
    const gift = GIFTS.find(g => g.id === s.gift_type);
    return !gift?.isPremium && gift?.category !== 'halloween';
  });
  const premiumInventory = stats.filter(s => GIFTS.find(g => g.id === s.gift_type)?.isPremium);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={theme.brand} />
      </View>
    );
  }

  if (receivedGifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="gift-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
        <ThemedText style={styles.emptyText}>No gifts received yet.</ThemedText>
      </View>
    );
  }

  const renderInventoryItem = (stat: GiftStats) => {
    const meta = GIFTS.find(g => g.id === stat.gift_type) || { name: stat.gift_type, icon: 'gift', iconFamily: 'Ionicons' as IconFamily, color: theme.brand };
    return (
      <View key={stat.gift_type} style={[styles.inventoryItem, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.iconCircle, { backgroundColor: meta.color + '20' }]}>
          <GiftIconDisplay icon={meta.icon} iconFamily={meta.iconFamily} size={20} color={meta.color} />
        </View>
        <View style={styles.inventoryInfo}>
          <ThemedText style={styles.inventoryName}>{meta.name}</ThemedText>
          <ThemedText style={styles.inventoryCount}>x{stat.count}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={receivedGifts.slice(0, 10)}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.container, !isFullScreen && { paddingBottom: Spacing.four }]}
      ListHeaderComponent={
        <>
          {/* Stats Summary */}
          <View style={[styles.statsRow, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.statBox}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>{receivedGifts.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Received</ThemedText>
            </View>
            {topGifter && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <ThemedText type="defaultSemiBold" style={styles.statValue} numberOfLines={1}>
                    {topGifter.username}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Top Gifter</ThemedText>
                </View>
              </>
            )}
          </View>

          {/* Grouped Inventory */}
          {halloweenInventory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="pumpkin" size={16} color="#FF7518" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Halloween Gifts</ThemedText>
              </View>
              <View style={styles.inventoryGrid}>
                {halloweenInventory.map(renderInventoryItem)}
              </View>
            </View>
          )}

          {premiumInventory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Premium Gifts</ThemedText>
              </View>
              <View style={styles.inventoryGrid}>
                {premiumInventory.map(renderInventoryItem)}
              </View>
            </View>
          )}

          {standardInventory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="gift" size={16} color={theme.brand} />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Standard Gifts</ThemedText>
              </View>
              <View style={styles.inventoryGrid}>
                {standardInventory.map(renderInventoryItem)}
              </View>
            </View>
          )}

          <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { marginTop: Spacing.four }]}>Recent Activity</ThemedText>
        </>
      }
      renderItem={({ item }) => {
        const meta = GIFTS.find(g => g.id === item.gift_type) || { name: item.gift_type, icon: 'gift', iconFamily: 'Ionicons' as IconFamily, color: theme.brand };
        return (
          <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: meta.color + '15' }]}>
              <GiftIconDisplay icon={meta.icon} iconFamily={meta.iconFamily} size={16} color={meta.color} />
            </View>
            <View style={styles.historyText}>
              <ThemedText style={styles.historyMain}>
                <ThemedText type="defaultSemiBold">{item.sender?.username || 'Someone'}</ThemedText> sent a {meta.name}
              </ThemedText>
              <ThemedText style={styles.historyDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No recent activity.</ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  centered: {
    padding: Spacing.eight,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.eight,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 16,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 12,
    width: '48%',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  inventoryCount: {
    fontSize: 10,
    opacity: 0.6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    flex: 1,
  },
  historyMain: {
    fontSize: 14,
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.5,
  },
});
