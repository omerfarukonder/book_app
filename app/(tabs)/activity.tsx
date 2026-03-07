import { useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { RatingStars } from '@/components/RatingStars';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';

export default function StatsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((s) => s.user);
  const logs = useDataStore((s) => s.logs);
  const getUserLogs = useDataStore((s) => s.getUserLogs);

  const userLogs = useMemo(() => (user ? getUserLogs(user.id) : []), [user, logs]);

  const stats = useMemo(() => {
    const finished = userLogs.filter((l) => l.status === 'finished');
    const rated = userLogs.filter((l) => l.rating != null && l.rating > 0);
    const totalPages = finished.reduce((sum, l) => sum + (l.book?.page_count ?? 0), 0);
    const avgRating =
      rated.length > 0
        ? Math.round((rated.reduce((sum, l) => sum + (l.rating ?? 0), 0) / rated.length) * 10) / 10
        : 0;

    // Rating distribution (1-5)
    const ratingDist = [0, 0, 0, 0, 0];
    rated.forEach((l) => {
      const r = l.rating ?? 0;
      if (r >= 1 && r <= 5) ratingDist[r - 1]++;
    });
    const maxDist = Math.max(...ratingDist, 1);

    // Top genres
    const genreMap: Record<string, number> = {};
    userLogs.forEach((l) => {
      l.book?.genres?.forEach((g) => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Favorites (5-star)
    const favorites = rated.filter((l) => l.rating === 5);

    // Recent diary (last 5)
    const diary = userLogs.slice(0, 5);

    return {
      booksFinished: finished.length,
      totalPages,
      avgRating,
      booksLogged: userLogs.length,
      ratingDist,
      maxDist,
      topGenres,
      favorites,
      diary,
    };
  }, [userLogs]);

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Text style={[styles.header, { color: colors.text }]}>Reading Stats</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={[styles.summaryRow, { backgroundColor: 'transparent' }]}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryNumber, { color: colors.accent }]}>
              {stats.booksFinished}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Finished</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryNumber, { color: colors.accent }]}>
              {stats.totalPages.toLocaleString()}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pages</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryNumber, { color: colors.accent }]}>
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
          </View>
        </View>

        {/* Rating Distribution */}
        {stats.ratingDist.some((v) => v > 0) && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rating Distribution</Text>
            <View style={[styles.ratingChart, { backgroundColor: 'transparent' }]}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDist[star - 1];
                const width = (count / stats.maxDist) * 100;
                return (
                  <View
                    key={star}
                    style={[styles.ratingBarRow, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                      {star}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: colors.accent,
                            width: `${Math.max(width, count > 0 ? 4 : 0)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barCount, { color: colors.textSecondary }]}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Top Genres */}
        {stats.topGenres.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Genres</Text>
            {stats.topGenres.map(([genre, count]) => (
              <View
                key={genre}
                style={[styles.genreRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.genreName, { color: colors.text }]}>{genre}</Text>
                <Text style={[styles.genreCount, { color: colors.textSecondary }]}>
                  {count} book{count !== 1 ? 's' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Diary */}
        {stats.diary.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            {stats.diary.map((log) => (
              <View
                key={log.id}
                style={[styles.diaryRow, { borderBottomColor: colors.border, backgroundColor: 'transparent' }]}>
                <Text style={[styles.diaryDate, { color: colors.textSecondary }]}>
                  {new Date(log.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={[styles.diaryTitle, { color: colors.text }]} numberOfLines={1}>
                    {log.book?.title ?? 'Unknown'}
                  </Text>
                  <Text style={[styles.diaryStatus, { color: colors.textSecondary }]}>
                    {log.status.replace(/_/g, ' ')}
                  </Text>
                </View>
                {log.rating != null && log.rating > 0 && (
                  <RatingStars rating={log.rating} size={12} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Favorites (5-star books) */}
        {stats.favorites.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorites</Text>
            {stats.favorites.map((log) => (
              <View
                key={log.id}
                style={[styles.favoriteRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.favoriteStar, { color: colors.accent }]}>★</Text>
                <Text style={[styles.favoriteTitle, { color: colors.text }]} numberOfLines={1}>
                  {log.book?.title ?? 'Unknown'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {userLogs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>
              No reading data yet. Start logging books to see your stats!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  summaryNumber: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  summaryLabel: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  ratingChart: { gap: 6 },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: { fontSize: 13, width: 14, textAlign: 'center' },
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barCount: { fontSize: 13, width: 24, textAlign: 'right' },
  genreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  genreName: { fontSize: 15, fontWeight: '500' },
  genreCount: { fontSize: 13 },
  diaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  diaryDate: { fontSize: 13, width: 50 },
  diaryTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  diaryStatus: { fontSize: 12 },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  favoriteStar: { fontSize: 16 },
  favoriteTitle: { fontSize: 15, fontWeight: '500', flex: 1 },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});
