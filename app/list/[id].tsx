import { useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { BookCard } from '@/components/BookCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getMockListById, getMockListItems } from '@/lib/mockData';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const list = useMemo(() => getMockListById(id ?? ''), [id]);
  const items = useMemo(() => list ? getMockListItems(list.id) : [], [list]);

  if (!list) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>List not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.accent }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={18} color={colors.text} />
      </Pressable>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={[styles.header, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.title, { color: colors.text }]}>{list.title}</Text>
            {list.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {list.description}
              </Text>
            )}
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {items.length} book{items.length !== 1 ? 's' : ''}
              {list.user ? ` · by ${list.user.display_name}` : ''}
            </Text>
          </View>
        }
        renderItem={({ item, index }) =>
          item.book ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: 'transparent' }}>
              {list.is_ranked && (
                <Text style={[styles.rank, { color: colors.textSecondary }]}>
                  {index + 1}
                </Text>
              )}
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <BookCard book={item.book} />
              </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  meta: { fontSize: 13 },
  rank: { fontSize: 18, fontWeight: '700', width: 32, textAlign: 'center' },
  list: { paddingBottom: 20 },
});
