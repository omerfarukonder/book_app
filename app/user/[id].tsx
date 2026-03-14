import { useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { BookCard } from '@/components/BookCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getMockUserById } from '@/lib/mockData';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { useBlendStore } from '@/stores/blendStore';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const user = useMemo(() => getMockUserById(id ?? ''), [id]);
  const getUserLogs = useDataStore((s) => s.getUserLogs);
  const getUserStats = useDataStore((s) => s.getUserStats);

  const allLogs = useDataStore((s) => s.logs);
  const logs = useMemo(() => user ? getUserLogs(user.id) : [], [user, allLogs]);
  const stats = useMemo(() => user ? getUserStats(user.id) : { books: 0, followers: 0, following: 0 }, [user]);
  const [isFollowing, setIsFollowing] = useState(false);

  const createBlend = useBlendStore((s) => s.createBlend);
  const isCreating = useBlendStore((s) => s.isCreating);
  const getBlendBetween = useBlendStore((s) => s.getBlendBetween);
  const existingBlend = currentUser && user
    ? getBlendBetween(currentUser.id, user.id)
    : undefined;

  const handleBlend = async () => {
    if (!currentUser || !user) return;
    if (existingBlend) {
      router.push(`/blend/${existingBlend.id}`);
      return;
    }
    const user1Logs = allLogs.filter((l) => l.user_id === currentUser.id);
    const user2LocalLogs = allLogs.filter((l) => l.user_id === user.id);
    const blendId = await createBlend(currentUser, user, user1Logs, user2LocalLogs);
    router.push(`/blend/${blendId}`);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>User not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.accent }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={18} color={colors.text} />
      </Pressable>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
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

            {!isOwnProfile && (
              <View style={[styles.buttonRow, { backgroundColor: 'transparent' }]}>
                <Pressable
                  style={[
                    styles.followButton,
                    { backgroundColor: isFollowing ? colors.surfaceSecondary : colors.accent },
                  ]}
                  onPress={() => setIsFollowing(!isFollowing)}>
                  <Text style={{ color: isFollowing ? colors.text : '#fff', fontWeight: '600' }}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.blendButton,
                    { backgroundColor: existingBlend ? colors.surfaceSecondary : colors.surface,
                      borderColor: colors.accent, borderWidth: 1.5 },
                  ]}
                  onPress={handleBlend}
                  disabled={isCreating}>
                  {isCreating ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <FontAwesome name="heart" size={13} color={colors.accent} />
                      <Text style={{ color: colors.accent, fontWeight: '600', marginLeft: 6 }}>
                        {existingBlend ? 'View Blend' : 'Blend'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) =>
          item.book ? (
            <View style={{ paddingHorizontal: 16 }}>
              <BookCard book={item.book} rating={item.rating} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
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
  profileHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  displayName: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  username: { fontSize: 15, marginBottom: 8 },
  bio: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  blendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 44,
    justifyContent: 'center',
  },
  list: { paddingBottom: 20 },
});
