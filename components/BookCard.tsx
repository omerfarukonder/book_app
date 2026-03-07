import { StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { RatingStars } from '@/components/RatingStars';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Book } from '@/lib/types';

interface BookCardProps {
  book: Book;
  rating?: number | null;
  compact?: boolean;
}

export function BookCard({ book, rating, compact = false }: BookCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  if (compact) {
    return (
      <Pressable
        onPress={() => router.push(`/book/${book.google_books_id}`)}
        style={styles.compactContainer}>
        <Image
          source={book.cover_url ? { uri: book.cover_url } : require('@/assets/images/icon.png')}
          style={styles.compactCover}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/book/${book.google_books_id}`)}
      style={[styles.container, { backgroundColor: colors.surface }]}>
      <Image
        source={book.cover_url ? { uri: book.cover_url } : require('@/assets/images/icon.png')}
        style={styles.cover}
      />
      <View style={[styles.info, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
          {book.authors.join(', ')}
        </Text>
        {rating != null && rating > 0 && <RatingStars rating={rating} size={14} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cover: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    marginBottom: 6,
  },
  compactContainer: {
    marginRight: 12,
  },
  compactCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
});
