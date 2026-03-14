import { useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { BookCard } from '@/components/BookCard';
import { ReviewCard } from '@/components/ReviewCard';
import { RatingStars } from '@/components/RatingStars';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { Log } from '@/lib/types';

type ProfileTab = 'books' | 'reviews' | 'diary';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const getUserLogs = useDataStore((s) => s.getUserLogs);
  const getUserStats = useDataStore((s) => s.getUserStats);
  const [activeTab, setActiveTab] = useState<ProfileTab>('books');

  if (!user) return null;

  const logs = getUserLogs(user.id);
  const stats = getUserStats(user.id);

  const filteredLogs = logs.filter((log) => {
    if (activeTab === 'reviews') return log.review_text;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ backgroundColor: 'transparent' }}>
            <View style={[styles.profileHeader, { backgroundColor: 'transparent' }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>
                  {user.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {user.display_name}
              </Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{user.username}
              </Text>
              {user.bio && (
                <Text style={[styles.bio, { color: colors.textSecondary }]}>
                  {user.bio}
                </Text>
              )}

              <View style={[styles.statsRow, { backgroundColor: 'transparent' }]}>
                <View style={[styles.statItem, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{stats.books}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Books</Text>
                </View>
                <Pressable
                  style={[styles.statItem, { backgroundColor: 'transparent' }]}
                  onPress={() => router.push(`/followers/${user.id}?tab=followers`)}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{stats.followers}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
                </Pressable>
                <Pressable
                  style={[styles.statItem, { backgroundColor: 'transparent' }]}
                  onPress={() => router.push(`/followers/${user.id}?tab=following`)}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{stats.following}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.signOutButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => {
                  signOut();
                  router.replace('/(auth)/login');
                }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Sign Out</Text>
              </Pressable>
            </View>

            <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: 'transparent' }]}>
              {(['books', 'reviews', 'diary'] as ProfileTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                  ]}
                  onPress={() => setActiveTab(tab)}>
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === tab ? colors.text : colors.textSecondary },
                    ]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'reviews') {
            return <ReviewCard log={item} showUser={false} />;
          }
          if (activeTab === 'diary') {
            return (
              <View style={[styles.diaryRow, { borderBottomColor: colors.border, backgroundColor: 'transparent' }]}>
                <Text style={[styles.diaryDate, { color: colors.textSecondary }]}>
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={[styles.diaryTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.book?.title ?? 'Unknown'}
                  </Text>
                  {item.rating != null && item.rating > 0 && (
                    <RatingStars rating={item.rating} size={12} />
                  )}
                </View>
              </View>
            );
          }
          return item.book ? (
            <View style={{ paddingHorizontal: 16 }}>
              <BookCard book={item.book} rating={item.rating} />
            </View>
          ) : null;
        }}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  signOutButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 20 },
  diaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 16,
  },
  diaryDate: { fontSize: 13, width: 50 },
  diaryTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
});
