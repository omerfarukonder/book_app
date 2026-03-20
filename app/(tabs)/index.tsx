import { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { UserAvatar } from '@/components/UserAvatar';
import { RatingStars } from '@/components/RatingStars';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDataStore } from '@/stores/dataStore';
import { Log, Book } from '@/lib/types';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );
}

/** Compact horizontal activity card */
function ActivityCard({ log }: { log: Log }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const actionLabel: Record<string, string> = {
    want_to_read: 'wants to read',
    reading: 'reading',
    finished: 'finished',
    abandoned: 'abandoned',
  };

  return (
    <Pressable
      style={[styles.activityCard, { backgroundColor: colors.surface }]}
      onPress={() => log.book && router.push(`/book/${log.book.google_books_id}`)}>
      {/* Cover */}
      <Image
        source={
          log.book?.cover_url
            ? { uri: log.book.cover_url }
            : require('@/assets/images/icon.png')
        }
        style={styles.activityCover}
      />
      {/* Info */}
      <View style={[styles.activityInfo, { backgroundColor: 'transparent' }]}>
        {/* User row */}
        <Pressable
          style={styles.activityUserRow}
          onPress={() => log.user && router.push(`/user/${log.user.id}`)}>
          <UserAvatar
            displayName={log.user?.display_name ?? '?'}
            size={20}
          />
          <Text style={[styles.activityUsername, { color: colors.accent }]} numberOfLines={1}>
            {' @'}{log.user?.username ?? ''}
          </Text>
        </Pressable>
        {/* Action */}
        <Text style={[styles.activityAction, { color: colors.textSecondary }]} numberOfLines={1}>
          {actionLabel[log.status] ?? log.status}
        </Text>
        {/* Book title */}
        <Text style={[styles.activityBookTitle, { color: colors.text }]} numberOfLines={2}>
          {log.book?.title ?? ''}
        </Text>
        {/* Stars */}
        {log.rating != null && log.rating > 0 && (
          <RatingStars rating={log.rating} size={11} />
        )}
      </View>
    </Pressable>
  );
}

/** Vertical poster card for Popular section */
function PosterCard({ book, count }: { book: Book; count: number }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <Pressable
      style={styles.posterCard}
      onPress={() => router.push(`/book/${book.google_books_id}`)}>
      <Image
        source={
          book.cover_url
            ? { uri: book.cover_url }
            : require('@/assets/images/icon.png')
        }
        style={[styles.posterCover, { backgroundColor: colors.surfaceSecondary }]}
      />
      {count > 1 && (
        <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
      <Text style={[styles.posterTitle, { color: colors.text }]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={[styles.posterAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
        {book.authors?.[0] ?? ''}
      </Text>
    </Pressable>
  );
}

/** Horizontal review card */
function ReviewSlide({ log }: { log: Log }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <Pressable
      style={[styles.reviewSlide, { backgroundColor: colors.surface }]}
      onPress={() => log.book && router.push(`/book/${log.book.google_books_id}`)}>
      <View style={[styles.reviewSlideTop, { backgroundColor: 'transparent' }]}>
        <Image
          source={
            log.book?.cover_url
              ? { uri: log.book.cover_url }
              : require('@/assets/images/icon.png')
          }
          style={styles.reviewSlideCover}
        />
        <View style={[styles.reviewSlideMeta, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.reviewSlideTitle, { color: colors.text }]} numberOfLines={2}>
            {log.book?.title ?? ''}
          </Text>
          <Text style={[styles.reviewSlideAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {log.book?.authors?.[0] ?? ''}
          </Text>
          {log.rating != null && log.rating > 0 && (
            <RatingStars rating={log.rating} size={12} />
          )}
        </View>
      </View>
      <Text style={[styles.reviewSlideText, { color: colors.text }]} numberOfLines={3}>
        {log.review_text}
      </Text>
      <Pressable
        style={styles.reviewSlideUser}
        onPress={() => log.user && router.push(`/user/${log.user.id}`)}>
        <FontAwesome name="user-circle" size={13} color={colors.textSecondary} />
        <Text style={[styles.reviewSlideUsername, { color: colors.textSecondary }]}>
          {' @'}{log.user?.username ?? ''}
        </Text>
      </Pressable>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const logs = useDataStore((s) => s.logs);

  // All activity, newest first
  const activityFeed = useMemo(
    () =>
      [...logs]
        .filter((l) => l.book)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20),
    [logs]
  );

  // Popular: group by google_books_id, sort by count
  const popularBooks = useMemo(() => {
    const countMap = new Map<string, { book: Book; count: number }>();
    for (const log of logs) {
      if (!log.book) continue;
      const key = log.book.google_books_id;
      const existing = countMap.get(key);
      if (existing) existing.count++;
      else countMap.set(key, { book: log.book, count: 1 });
    }
    return [...countMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [logs]);

  // Reviews with text
  const reviews = useMemo(
    () =>
      [...logs]
        .filter((l) => l.review_text && l.book)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15),
    [logs]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>BookShelf</Text>

        {/* ── Section 1: Friends Activity ── */}
        {activityFeed.length > 0 && (
          <>
            <SectionHeader title="Friends Activity" />
            <FlatList
              data={activityFeed}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ActivityCard log={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            />
          </>
        )}

        {/* ── Section 2: Popular This Week ── */}
        {popularBooks.length > 0 && (
          <>
            <SectionHeader title="Popular This Week" />
            <FlatList
              data={popularBooks}
              keyExtractor={(item) => item.book.google_books_id}
              renderItem={({ item }) => <PosterCard book={item.book} count={item.count} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            />
          </>
        )}

        {/* ── Section 3: Recent Reviews ── */}
        {reviews.length > 0 && (
          <>
            <SectionHeader title="Recent Reviews" />
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ReviewSlide log={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            />
          </>
        )}

        <View style={{ height: 32, backgroundColor: 'transparent' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 26,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  hList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // Activity card
  activityCard: {
    width: 150,
    borderRadius: 10,
    marginRight: 10,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
  },
  activityCover: {
    width: 44,
    height: 66,
    borderRadius: 4,
    backgroundColor: '#ddd',
    flexShrink: 0,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 2,
  },
  activityUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityUsername: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  activityAction: {
    fontSize: 10,
  },
  activityBookTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },

  // Poster card
  posterCard: {
    width: 100,
    marginRight: 12,
  },
  posterCover: {
    width: 100,
    height: 150,
    borderRadius: 6,
    marginBottom: 6,
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  posterTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  posterAuthor: {
    fontSize: 11,
    marginTop: 2,
  },

  // Review slide
  reviewSlide: {
    width: 200,
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
  },
  reviewSlideTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  reviewSlideCover: {
    width: 44,
    height: 66,
    borderRadius: 4,
    backgroundColor: '#ddd',
    flexShrink: 0,
  },
  reviewSlideMeta: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 3,
  },
  reviewSlideTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  reviewSlideAuthor: {
    fontSize: 11,
  },
  reviewSlideText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  reviewSlideUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewSlideUsername: {
    fontSize: 11,
  },
});
