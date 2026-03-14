import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { RatingStars } from '@/components/RatingStars';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Book, ReadingStatus } from '@/lib/types';
import { getMockBookByGoogleId, MOCK_BOOKS } from '@/lib/mockData';
import { searchBooks } from '@/lib/googleBooks';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'finished', label: 'Finished' },
  { value: 'abandoned', label: 'Abandoned' },
];

export default function LogModal() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addLog = useDataStore((s) => s.addLog);

  const [book, setBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);

  const [status, setStatus] = useState<ReadingStatus>('finished');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  useEffect(() => {
    if (bookId) {
      const found = getMockBookByGoogleId(bookId);
      if (found) setBook(found);
    }
  }, [bookId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const books = await searchBooks(searchQuery.trim());
      setSearchResults(books);
    } catch {
      // Fallback to mock books if API fails
      const q = searchQuery.toLowerCase();
      setSearchResults(
        MOCK_BOOKS.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.authors.some((a) => a.toLowerCase().includes(q))
        )
      );
    } finally {
      setSearching(false);
    }
  };

  const selectBook = (selected: Book) => {
    setBook(selected);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSave = () => {
    if (!book || !user) return;

    addLog({
      user_id: user.id,
      book_id: book.id,
      status,
      rating: rating > 0 ? rating : null,
      review_text: reviewText.trim() || null,
      contains_spoilers: containsSpoilers,
      started_at: null,
      finished_at: status === 'finished' ? new Date().toISOString() : null,
      book,
      user,
    });

    Alert.alert(
      'Logged!',
      `"${book.title}" saved as ${status.replace(/_/g, ' ')}${rating > 0 ? ` with ${rating} stars` : ''}.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: 'transparent' }]}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.cancel, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Log a Read</Text>
          <Pressable onPress={handleSave} disabled={!book}>
            <Text
              style={[styles.save, { color: book ? colors.accent : colors.textSecondary }]}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!book ? (
            <View style={{ backgroundColor: 'transparent' }}>
              <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
                <FontAwesome name="search" size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search for a book..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoFocus
                />
              </View>

              {searchResults.length === 0 && searchQuery.length === 0 && (
                <View style={{ backgroundColor: 'transparent', marginTop: 16 }}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Quick Pick</Text>
                  {MOCK_BOOKS.slice(0, 5).map((b) => (
                    <Pressable
                      key={b.id}
                      style={[styles.searchResult, { borderBottomColor: colors.border }]}
                      onPress={() => selectBook(b)}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                        {b.title}
                      </Text>
                      <Text style={[styles.resultAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                        {b.authors.join(', ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {searching && (
                <View style={[styles.loadingRow, { backgroundColor: 'transparent' }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              )}

              {searchResults.map((result) => (
                <Pressable
                  key={result.id}
                  style={[styles.searchResult, { borderBottomColor: colors.border }]}
                  onPress={() => selectBook(result)}>
                  <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                    {result.title}
                  </Text>
                  <Text style={[styles.resultAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                    {result.authors.join(', ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ backgroundColor: 'transparent' }}>
              <Pressable
                style={[styles.selectedBook, { backgroundColor: colors.surface }]}
                onPress={() => setBook(null)}>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={[styles.selectedTitle, { color: colors.text }]} numberOfLines={1}>
                    {book.title}
                  </Text>
                  <Text style={[styles.selectedAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                    {book.authors.join(', ')}
                  </Text>
                </View>
                <FontAwesome name="times" size={16} color={colors.textSecondary} />
              </Pressable>

              <View style={[styles.section, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Status</Text>
                <View style={[styles.statusGrid, { backgroundColor: 'transparent' }]}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            status === opt.value ? colors.accent : colors.surfaceSecondary,
                        },
                      ]}
                      onPress={() => setStatus(opt.value)}>
                      <Text
                        style={[
                          styles.statusText,
                          { color: status === opt.value ? '#fff' : colors.text },
                        ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Rating</Text>
                <RatingStars rating={rating} size={32} interactive onRate={setRating} />
              </View>

              <View style={[styles.section, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Review</Text>
                <TextInput
                  style={[
                    styles.reviewInput,
                    { backgroundColor: colors.surfaceSecondary, color: colors.text },
                  ]}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={colors.textSecondary}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <View style={[styles.spoilerRow, { backgroundColor: 'transparent' }]}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>Contains spoilers</Text>
                  <Switch
                    value={containsSpoilers}
                    onValueChange={setContainsSpoilers}
                    trackColor={{ true: colors.accent }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cancel: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  save: { fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, height: 44 },
  loadingRow: { paddingVertical: 20, alignItems: 'center' },
  searchResult: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  resultTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  resultAuthor: { fontSize: 13 },
  selectedBook: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  selectedAuthor: { fontSize: 13 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: '500' },
  reviewInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    lineHeight: 22,
  },
  spoilerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
