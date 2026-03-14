import { useState, useMemo } from 'react';
import { StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { UserAvatar } from '@/components/UserAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getMockFollowers, getMockFollowing } from '@/lib/mockData';
import { UserProfile } from '@/lib/types';

type Tab = 'followers' | 'following';

export default function FollowersScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'followers');

  const followers = useMemo(() => getMockFollowers(id ?? ''), [id]);
  const following = useMemo(() => getMockFollowing(id ?? ''), [id]);
  const users = activeTab === 'followers' ? followers : following;

  const renderUser = ({ item }: { item: UserProfile }) => (
    <Pressable
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/user/${item.id}`)}>
      <UserAvatar
        displayName={item.display_name}
        size={46}
        showDot={false} // wired up when blend notifications are built
      />
      <View style={[styles.info, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.displayName, { color: colors.text }]}>{item.display_name}</Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>@{item.username}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: 'transparent' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </Pressable>
        <View style={[styles.tabs, { backgroundColor: 'transparent' }]}>
          {(['followers', 'following'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.tab,
                activeTab === t && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(t)}>
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === t ? colors.text : colors.textSecondary },
                ]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {'  '}
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {t === 'followers' ? followers.length : following.length}
                </Text>
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>
              No {activeTab} yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingLeft: 8,
  },
  backButton: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { paddingBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  info: { flex: 1 },
  displayName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  username: { fontSize: 13 },
  empty: { paddingTop: 60, alignItems: 'center' },
});
