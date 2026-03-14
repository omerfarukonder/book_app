import { useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { UserAvatar } from '@/components/UserAvatar';
import { BookCard } from '@/components/BookCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useBlendStore } from '@/stores/blendStore';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import type { BlendBook, Book } from '@/lib/types';

/** Handles both old (Book[]) and new (BlendBook[]) persisted format */
function normalizeBooks(raw: (BlendBook | Book)[]): BlendBook[] {
  return raw.map((item) => {
    if ('book' in item && item.book) return item as BlendBook;
    return { book: item as Book, source: 'shared' as const };
  });
}

// ─── Animated intro ──────────────────────────────────────────────────────────

function useIntroAnimation() {
  const avatar1X   = useRef(new Animated.Value(-120)).current;
  const avatar2X   = useRef(new Animated.Value(120)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Avatars slide in from sides
      Animated.parallel([
        Animated.spring(avatar1X, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(avatar2X, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      ]),
      // 2. Heart pops in
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
        Animated.timing(heartOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      // 3. Heart pulse
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, tension: 200, friction: 5 }),
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
      ]),
      // 4. Score & content fade in
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }),
      ]),
    ]).start();
  }, []);

  return { avatar1X, avatar2X, heartScale, heartOpacity, contentOpacity, scoreScale };
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({
  source,
  user1Username,
  user2Username,
  colors,
}: {
  source: BlendBook['source'];
  user1Username?: string;
  user2Username?: string;
  colors: (typeof Colors)['light'];
}) {
  const isShared = source === 'shared';
  const label = isShared
    ? '✦ New for both of you'
    : source === 'user1'
    ? `↑ For @${user1Username ?? 'user1'}`
    : `↑ For @${user2Username ?? 'user2'}`;

  const bg = isShared ? colors.accent + '22' : colors.surfaceSecondary;
  const textColor = isShared ? colors.accent : colors.textSecondary;

  return (
    <View style={[styles.sourceBadge, { backgroundColor: bg }]}>
      <Text style={[styles.sourceBadgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BlendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const blend = useBlendStore((s) => s.blends.find((b) => b.id === id));
  const isCreating = useBlendStore((s) => s.isCreating);
  const refreshBlend = useBlendStore((s) => s.refreshBlend);
  const dismissNotification = useBlendStore((s) => s.dismissNotification);
  const currentUser = useAuthStore((s) => s.user);
  const allLogs = useDataStore((s) => s.logs);
  const getUserLogs = useDataStore((s) => s.getUserLogs);

  const anim = useIntroAnimation();

  // Dismiss red dot when viewing blend
  useEffect(() => {
    if (blend && currentUser) {
      const otherId =
        blend.user1_id === currentUser.id ? blend.user2_id : blend.user1_id;
      dismissNotification(otherId);
    }
  }, [blend?.id]);

  if (!blend) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={{ color: colors.text, padding: 24 }}>Blend not found.</Text>
      </SafeAreaView>
    );
  }

  const user1 = blend.user1;
  const user2 = blend.user2;
  const score = blend.compatibility_score;
  const books = normalizeBooks(blend.books as (BlendBook | Book)[]);

  const scoreColor =
    score >= 70 ? '#22c55e' : score >= 40 ? colors.accent : colors.textSecondary;

  const handleRefresh = async () => {
    if (!currentUser) return;
    const user1Logs = getUserLogs(blend.user1_id);
    const user2LocalLogs = allLogs.filter((l) => l.user_id === blend.user2_id);
    const otherUser = blend.user1_id === currentUser.id ? blend.user2 : blend.user1;
    if (!otherUser) return;
    await refreshBlend(
      blend.id,
      blend.user1_id === currentUser.id ? currentUser : otherUser,
      blend.user1_id === currentUser.id ? otherUser : currentUser,
      user1Logs,
      user2LocalLogs
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: 'transparent' }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blend</Text>
        <Pressable onPress={handleRefresh} style={styles.refreshBtn} disabled={isCreating}>
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <FontAwesome name="refresh" size={16} color={colors.accent} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Animated hero ── */}
        <View style={[styles.heroSection, { backgroundColor: 'transparent' }]}>
          {/* Avatars slide in */}
          <View style={[styles.avatarsRow, { backgroundColor: 'transparent' }]}>
            <Animated.View style={{ transform: [{ translateX: anim.avatar1X }] }}>
              {user1 && <UserAvatar displayName={user1.display_name} size={64} />}
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: anim.heartScale }],
                opacity: anim.heartOpacity,
              }}
            >
              <FontAwesome name="heart" size={28} color={colors.accent} style={styles.heartIcon} />
            </Animated.View>

            <Animated.View style={{ transform: [{ translateX: anim.avatar2X }] }}>
              {user2 && <UserAvatar displayName={user2.display_name} size={64} />}
            </Animated.View>
          </View>

          {/* Usernames + score fade in after animation */}
          <Animated.View style={[styles.animatedContent, { opacity: anim.contentOpacity }]}>
            <View style={[styles.usernamesRow, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{user1?.username}
              </Text>
              <Text style={[styles.ampersand, { color: colors.textSecondary }]}>&</Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{user2?.username}
              </Text>
            </View>

            {/* Score pops in */}
            <Animated.Text
              style={[
                styles.scoreNumber,
                { color: scoreColor, transform: [{ scale: anim.scoreScale }] },
              ]}
            >
              {score}%
            </Animated.Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Compatibility</Text>

            <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[styles.barFill, { backgroundColor: scoreColor, width: `${score}%` }]}
              />
            </View>
          </Animated.View>
        </View>

        {/* ── Bond Book ── */}
        <Animated.View style={{ opacity: anim.contentOpacity }}>
          {blend.bond_book && (
            <View style={[styles.section, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bond Book</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                The book that brought you together
              </Text>
              <View style={[styles.bondCard, { backgroundColor: colors.surface }]}>
                {blend.bond_book.cover_url ? (
                  <Image
                    source={{ uri: blend.bond_book.cover_url }}
                    style={styles.bondCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.bondCoverPlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
                    <FontAwesome name="book" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={[styles.bondInfo, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.bondTitle, { color: colors.text }]} numberOfLines={2}>
                    {blend.bond_book.title}
                  </Text>
                  <Text style={[styles.bondAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                    {blend.bond_book.authors.join(', ')}
                  </Text>
                  <View style={[styles.bondHeartRow, { backgroundColor: 'transparent' }]}>
                    <FontAwesome name="heart" size={12} color={colors.accent} />
                    <Text style={[styles.bondHeartText, { color: colors.accent }]}>
                      Both loved it
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Recommendations ── */}
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Picks for You Two
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              {books.length} books you haven't read yet
            </Text>
            {books.map(({ book, source }, index) => (
              <View key={book.google_books_id} style={{ marginBottom: 4 }}>
                <SourceBadge
                  source={source}
                  user1Username={user1?.username}
                  user2Username={user2?.username}
                  colors={colors}
                />
                <BookCard book={book} />
                {index < books.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>

          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            Generated{' '}
            {new Date(blend.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  backBtn:    { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 17, fontWeight: '600' },
  refreshBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  heartIcon: { marginHorizontal: 4 },
  animatedContent: { alignItems: 'center', width: '100%' },
  usernamesRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  username:  { fontSize: 14 },
  ampersand: { fontSize: 14 },
  scoreNumber: { fontSize: 52, fontWeight: '800', lineHeight: 56 },
  scoreLabel:  { fontSize: 14, marginBottom: 12 },
  barTrack: {
    width: '70%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionSub:   { fontSize: 13, marginBottom: 14 },
  bondCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
  bondCover: { width: 64, height: 96, borderRadius: 6 },
  bondCoverPlaceholder: {
    width: 64,
    height: 96,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bondInfo:      { flex: 1 },
  bondTitle:     { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bondAuthor:    { fontSize: 13, marginBottom: 8 },
  bondHeartRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bondHeartText: { fontSize: 13, fontWeight: '600' },
  sourceBadge: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sourceBadgeText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginHorizontal: 16, marginTop: 8 },
  timestamp: { fontSize: 12, textAlign: 'center', marginTop: 24 },
});
