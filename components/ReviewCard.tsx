import { StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { RatingStars } from '@/components/RatingStars';
import { UserAvatar } from '@/components/UserAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Log } from '@/lib/types';

interface ReviewCardProps {
  log: Log;
  showUser?: boolean;
}

export function ReviewCard({ log, showUser = true }: ReviewCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const statusLabel = {
    want_to_read: 'wants to read',
    reading: 'is reading',
    finished: 'finished',
    abandoned: 'abandoned',
  }[log.status];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {showUser && log.user && (
        <Pressable
          style={styles.userRow}
          onPress={() => router.push(`/user/${log.user!.id}`)}>
          <View style={[styles.avatar, { backgroundColor: 'transparent' }]}>
            <UserAvatar displayName={log.user.display_name} size={28} />
          </View>
          <Text style={[styles.username, { color: colors.text }]}>
            {log.user.display_name}
          </Text>
          <Text style={[styles.action, { color: colors.textSecondary }]}>
            {' '}{statusLabel}
          </Text>
        </Pressable>
      )}

      {log.book && (
        <Pressable
          style={styles.bookRow}
          onPress={() => router.push(`/book/${log.book!.google_books_id}`)}>
          <Image
            source={
              log.book.cover_url
                ? { uri: log.book.cover_url }
                : require('@/assets/images/icon.png')
            }
            style={styles.cover}
          />
          <View style={[styles.bookInfo, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
              {log.book.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
              {log.book.authors.join(', ')}
            </Text>
            {log.rating != null && log.rating > 0 && (
              <RatingStars rating={log.rating} size={14} />
            )}
          </View>
        </Pressable>
      )}

      {log.review_text && (
        <View style={[styles.review, { backgroundColor: 'transparent' }]}>
          {log.contains_spoilers && (
            <Text style={[styles.spoilerTag, { color: colors.error }]}>
              Contains spoilers
            </Text>
          )}
          <Text style={[styles.reviewText, { color: colors.text }]} numberOfLines={4}>
            {log.review_text}
          </Text>
        </View>
      )}

      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {new Date(log.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  action: {
    fontSize: 14,
  },
  bookRow: {
    flexDirection: 'row',
  },
  cover: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 13,
    marginBottom: 4,
  },
  review: {
    marginTop: 10,
  },
  spoilerTag: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    marginTop: 10,
  },
});
