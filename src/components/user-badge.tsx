import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';
import { BADGES } from '@/app/selectbadge';

interface UserBadgeProps {
  badgeId: string | null | undefined;
  size?: number;
  style?: ViewStyle;
}

// Simple cache to avoid redundant fetches in the same session
const badgeCache: Record<string, { image_url: string; name: string }> = {};

export function UserBadge({ badgeId, size = 18, style }: UserBadgeProps) {
  const theme = useTheme();
  const [customBadge, setCustomBadge] = useState<{ image_url: string; name: string } | null>(
    badgeId && badgeCache[badgeId] ? badgeCache[badgeId] : null
  );

  useEffect(() => {
    if (!badgeId) {
      setCustomBadge(null);
      return;
    }

    // Check if it's a system badge
    const systemBadge = BADGES.find(b => b.id === badgeId);
    if (systemBadge) {
      setCustomBadge(null);
      return;
    }

    // If it's a custom badge (UUID)
    if (badgeCache[badgeId]) {
      setCustomBadge(badgeCache[badgeId]);
      return;
    }

    const fetchCustomBadge = async () => {
      try {
        const { data, error } = await supabase
          .from('badges')
          .select('image_url, name')
          .eq('id', badgeId)
          .single();

        if (data && !error) {
          badgeCache[badgeId] = data;
          setCustomBadge(data);
        }
      } catch (e) {
        console.error('Error fetching custom badge:', e);
      }
    };

    fetchCustomBadge();
  }, [badgeId]);

  if (!badgeId) return null;

  const systemBadge = BADGES.find(b => b.id === badgeId);

  if (systemBadge) {
    return (
      <Ionicons
        name={systemBadge.icon as any}
        size={size}
        color={systemBadge.color}
        style={[styles.badge, style]}
      />
    );
  }

  if (customBadge) {
    return (
      <Image
        source={{ uri: customBadge.image_url }}
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: size / 4 },
          style
        ]}
        resizeMode="contain"
      />
    );
  }

  // Fallback icon while loading or if not found
  return (
    <Ionicons
      name="star-outline"
      size={size}
      color={theme.brand}
      style={[styles.badge, style, { opacity: 0.3 }]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    marginLeft: 4,
  },
});
