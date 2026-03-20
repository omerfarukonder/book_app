import { useState, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { BookCard } from '@/components/BookCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { searchBooks } from '@/lib/googleBooks';
import { Book } from '@/lib/types';
import { GENRES } from '@/constants/genres';
import { MOCK_BOOKS } from '@/lib/mockData';

export default function DiscoverScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const books = await searchBooks(query.trim());
      setResults(books);
    } catch (err) {
      console.error('[Discover] searchBooks failed, falling back to local:', err);
      const q = query.toLowerCase();
      setResults(
        MOCK_BOOKS.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.authors.some((a) => a.toLowerCase().includes(q))
        )
      );
    }
    setSearching(false);
  }, [query]);

  const handleGenreSearch = useCallback(async (genre: string) => {
    setQuery(genre);
    setSearching(true);
    setHasSearched(true);
    try {
      const books = await searchBooks(`subject:${genre}`);
      setResults(books);
    } catch {
      setResults(MOCK_BOOKS.filter((b) => b.genres.some((g) => g.toLowerCase().includes(genre.toLowerCase()))));
    }
    setSearching(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Text style={[styles.header, { color: colors.text }]}>Discover</Text>

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
        <Pressable onPress={handleSearch} style={styles.searchIconBtn}>
          <FontAwesome name="search" size={16} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search books, authors, ISBN..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
            <FontAwesome name="times-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {!hasSearched ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Books</Text>
          {MOCK_BOOKS.slice(0, 4).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Browse by Genre</Text>
          <View style={styles.genreGrid}>
            {GENRES.map((genre) => (
              <Pressable
                key={genre}
                style={[styles.genreChip, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => handleGenreSearch(genre)}>
                <Text style={[styles.genreText, { color: colors.text }]}>{genre}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : searching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => item.google_books_id || String(index)}
          renderItem={({ item }) => <BookCard book={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No books found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIconBtn: { marginRight: 10, padding: 4 },
  searchInput: { flex: 1, fontSize: 16, height: 44 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  genreText: { fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
