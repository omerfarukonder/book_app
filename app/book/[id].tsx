import { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { RatingStars } from '@/components/RatingStars';
import { ReviewCard } from '@/components/ReviewCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Book } from '@/lib/types';
import { getMockBookByGoogleId, MOCK_BOOKS } from '@/lib/mockData';
import { getBookById } from '@/lib/googleBooks';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);

  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const getBookLogs = useDataStore((s) => s.getBookLogs);
  const getBookRating = useDataStore((s) => s.getBookRating);
  const addLog = useDataStore((s) => s.addLog);
  const logs = useDataStore((s) => s.logs);

  // Load book: try mock data first, then Google Books API
  useEffect(() => {
    if (!id) {
      setBook(null);
      setLoading(false);
      return;
    }

    const mockBook = getMockBookByGoogleId(id);
    if (mockBook) {
      setBook(mockBook);
      setLoading(false);
      return;
    }

    // Fetch from Google Books API
    let cancelled = false;
    (async () => {
      try {
        const apiBook = await getBookById(id);
        if (!cancelled) {
          setBook(apiBook);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setBook(null);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const reviews = useMemo(() => book ? getBookLogs(book.id) : [], [book, logs]);
  const rating = useMemo(() => book ? getBookRating(book.id) : { avg: 0, count: 0 }, [book, logs]);

  const wantToReadLog = useMemo(() => {
    if (!book || !user) return null;
    return logs.find((l) => l.book_id === book.id && l.user_id === user.id && l.status === 'want_to_read') ?? null;
  }, [book, user, logs]);

  const [wantToRead, setWantToRead] = useState(false);
  useEffect(() => { setWantToRead(!!wantToReadLog); }, [wantToReadLog]);

  const similarBooks = useMemo(() => {
    if (!book) return [];
    return MOCK_BOOKS.filter(
      (b) => b.id !== book.id && b.genres.some((g) => book.genres.includes(g))
    ).slice(0, 4);
  }, [book]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Book not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.accent }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const coverWidth = width * 0.4;
  const coverHeight = coverWidth * 1.5;

  const toggleWantToRead = () => {
    if (!wantToRead && user) {
      addLog({
        user_id: user.id,
        book_id: book.id,
        status: 'want_to_read',
        rating: null,
        review_text: null,
        contains_spoilers: false,
        started_at: null,
        finished_at: null,
        book,
        user,
      });
    }
    setWantToRead(!wantToRead);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={18} color={colors.text} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroSection, { backgroundColor: 'transparent' }]}>
          <Image
            source={book.cover_url ? { uri: book.cover_url } : require('@/assets/images/icon.png')}
            style={[styles.cover, { width: coverWidth, height: coverHeight }]}
          />
          <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
          <Text style={[styles.authors, { color: colors.textSecondary }]}>
            {book.authors.join(', ')}
          </Text>

          {rating.count > 0 && (
            <View style={[styles.ratingRow, { backgroundColor: 'transparent' }]}>
              <RatingStars rating={rating.avg} size={20} />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {' '}{rating.avg.toFixed(1)}  ({rating.count} rating{rating.count !== 1 ? 's' : ''})
              </Text>
            </View>
          )}

          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {[
              book.published_date?.slice(0, 4),
              book.genres?.[0],
              book.page_count ? `${book.page_count} pages` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <View style={[styles.actions, { backgroundColor: 'transparent' }]}>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: wantToRead ? colors.accent : colors.surfaceSecondary },
            ]}
            onPress={toggleWantToRead}>
            <FontAwesome
              name={wantToRead ? 'bookmark' : 'bookmark-o'}
              size={16}
              color={wantToRead ? '#fff' : colors.text}
            />
            <Text style={[styles.actionText, { color: wantToRead ? '#fff' : colors.text }]}>
              {wantToRead ? 'Saved' : 'Want to Read'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() =>
              router.push({
                pathname: '/log-modal',
                params: { bookId: book.google_books_id },
              })
            }>
            <FontAwesome name="pencil" size={16} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Log</Text>
          </Pressable>
        </View>

        {book.synopsis && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Synopsis</Text>
            <Text style={[styles.synopsis, { color: colors.textSecondary }]}>
              {book.synopsis.replace(/<[^>]*>/g, '')}
            </Text>
          </View>
        )}

        {reviews.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
            {reviews.map((review) => (
              <ReviewCard key={review.id} log={{ ...review, book }} showUser />
            ))}
          </View>
        )}

        {similarBooks.length > 0 && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Similar Books</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similarBooks.map((b) => (
                <Pressable
                  key={b.id}
                  style={{ marginRight: 12 }}
                  onPress={() => router.push(`/book/${b.google_books_id}`)}>
                  <Image
                    source={b.cover_url ? { uri: b.cover_url } : require('@/assets/images/icon.png')}
                    style={{ width: 80, height: 120, borderRadius: 6, backgroundColor: '#ddd' }}
                  />
                  <Text
                    style={{ color: colors.text, fontSize: 12, width: 80, marginTop: 4 }}
                    numberOfLines={2}>
                    {b.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 40 },
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  cover: { borderRadius: 8, backgroundColor: '#ddd', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  authors: { fontSize: 16, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingText: { fontSize: 14 },
  meta: { fontSize: 14, marginBottom: 16 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: { fontSize: 15, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  synopsis: { fontSize: 15, lineHeight: 22 },
});
