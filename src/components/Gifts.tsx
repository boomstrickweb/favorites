import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export interface Gift {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPremium: boolean;
  color: string;
  animationType: 'pulse' | 'shake' | 'float';
}

export const GIFTS: Gift[] = [
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

export function Gifts({ userId, isFullScreen }: GiftsProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [receivedGifts, setReceivedGifts] = useState<GiftRecord[]>([]);
  const [stats, setStats] = useState<GiftStats[]>([]);
  const [topGifter, setTopGifter] = useState<TopGifter | null>(null);
  const [globalTopGifters, setGlobalTopGifters] = useState<TopGifter[]>([]);
  const [totalGiftsSentGlobally, setTotalGiftsSentGlobally] = useState(0);

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

      // 4. Global Stats: Total gifts sent
      const { count: globalCount, error: globalError } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true });
      
      if (!globalError) {
        setTotalGiftsSentGlobally(globalCount || 0);
      }

      // 5. Global Top Gifters
      const { data: globalGifts, error: globalGiftsError } = await supabase
        .from('gifts')
        .select(`
          sender_id,
          sender:profiles!sender_id(username)
        `);
      
      if (!globalGiftsError && globalGifts) {
        const globalGifterCounts: Record<string, { username: string; count: number }> = {};
        globalGifts.forEach(g => {
          const sid = g.sender_id;
          const suname = (g.sender as any)?.username || 'Unknown';
          if (!globalGifterCounts[sid]) {
            globalGifterCounts[sid] = { username: suname, count: 0 };
          }
          globalGifterCounts[sid].count += 1;
        });
        
        const topGlobal = Object.entries(globalGifterCounts)
          .map(([id, data]) => ({ sender_id: id, username: data.username, count: data.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        
        setGlobalTopGifters(topGlobal);
      }

    } catch (error) {
      console.error('Error fetching gifts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const standardInventory = stats.filter(s => !GIFTS.find(g => g.id === s.gift_type)?.isPremium);
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
    const meta = GIFTS.find(g => g.id === stat.gift_type) || { name: stat.gift_type, icon: 'gift', color: theme.brand };
    return (
      <View key={stat.gift_type} style={[styles.inventoryItem, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.iconCircle, { backgroundColor: meta.color + '20' }]}>
          <Ionicons name={meta.icon as any} size={20} color={meta.color} />
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
            <View style={styles.statDivider} />
            {topGifter && (
              <View style={styles.statBox}>
                <ThemedText type="defaultSemiBold" style={styles.statValue} numberOfLines={1}>
                  {topGifter.username}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Top Gifter</ThemedText>
              </View>
            )}
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>{totalGiftsSentGlobally}</ThemedText>
              <ThemedText style={styles.statLabel}>Global</ThemedText>
            </View>
          </View>

          {/* Grouped Inventory */}
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

          {/* Global Leaderboard - Grouped horizontally to save space */}
          {globalTopGifters.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Community Leaderboard</ThemedText>
              <View style={[styles.leaderboardRow, { backgroundColor: theme.backgroundElement }]}>
                {globalTopGifters.map((gifter, index) => (
                  <View key={gifter.sender_id} style={styles.leaderboardCard}>
                    <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                      <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
                    </View>
                    <ThemedText style={styles.leaderboardName} numberOfLines={1}>{gifter.username}</ThemedText>
                    <ThemedText style={styles.leaderboardCount}>{gifter.count}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { marginTop: Spacing.four }]}>Recent Activity</ThemedText>
        </>
      }
      renderItem={({ item }) => {
        const meta = GIFTS.find(g => g.id === item.gift_type) || { name: item.gift_type, icon: 'gift', color: theme.brand };
        return (
          <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: meta.color + '15' }]}>
              <Ionicons name={meta.icon as any} size={16} color={meta.color} />
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
  leaderboardRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.three,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  leaderboardCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  leaderboardName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  leaderboardCount: {
    fontSize: 10,
    opacity: 0.6,
  },
});
