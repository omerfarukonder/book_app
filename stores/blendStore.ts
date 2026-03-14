import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Blend, Log, UserProfile } from '@/lib/types';
import { runBlend, fetchUserLogsFromSupabase } from '@/lib/blendEngine';
import { supabase } from '@/lib/supabase';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface BlendState {
  blends: Blend[];
  isCreating: boolean;
  // IDs of users who have blended with the current user (drives red dot)
  pendingFromUserIds: string[];

  createBlend: (
    user1: UserProfile,
    user2: UserProfile,
    user1Logs: Log[],
    user2LocalLogs: Log[]
  ) => Promise<string>;

  refreshBlend: (
    blendId: string,
    user1: UserProfile,
    user2: UserProfile,
    user1Logs: Log[],
    user2LocalLogs: Log[]
  ) => Promise<void>;

  getBlendBetween: (userId1: string, userId2: string) => Blend | undefined;
  dismissNotification: (fromUserId: string) => void;
}

export const useBlendStore = create<BlendState>()(
  persist(
    (set, get) => ({
      blends: [],
      isCreating: false,
      pendingFromUserIds: [],

      createBlend: async (user1, user2, user1Logs, user2LocalLogs) => {
        set({ isCreating: true });
        try {
          // Use local logs for user2 first; fall back to Supabase fetch
          let user2Logs = user2LocalLogs;
          if (user2Logs.length === 0) {
            user2Logs = await fetchUserLogsFromSupabase(user2.id);
          }

          const result = await runBlend(user1Logs, user2Logs);

          const blend: Blend = {
            id: generateId(),
            user1_id: user1.id,
            user2_id: user2.id,
            user1,
            user2,
            books: result.books,
            bond_book: result.bond_book,
            compatibility_score: result.compatibility_score,
            created_at: new Date().toISOString(),
          };

          set((state) => ({ blends: [blend, ...state.blends] }));

          // Persist to Supabase (non-blocking)
          try {
            supabase.from('blends').upsert({
              id: blend.id,
              user1_id: blend.user1_id,
              user2_id: blend.user2_id,
              books: JSON.stringify(blend.books),
              bond_book: blend.bond_book ? JSON.stringify(blend.bond_book) : null,
              compatibility_score: blend.compatibility_score,
            });
          } catch { /* offline */ }

          return blend.id;
        } finally {
          set({ isCreating: false });
        }
      },

      refreshBlend: async (blendId, user1, user2, user1Logs, user2LocalLogs) => {
        set({ isCreating: true });
        try {
          let user2Logs = user2LocalLogs;
          if (user2Logs.length === 0) {
            user2Logs = await fetchUserLogsFromSupabase(user2.id);
          }

          const result = await runBlend(user1Logs, user2Logs);

          set((state) => ({
            blends: state.blends.map((b) =>
              b.id === blendId
                ? {
                    ...b,
                    books: result.books,
                    bond_book: result.bond_book,
                    compatibility_score: result.compatibility_score,
                    created_at: new Date().toISOString(),
                  }
                : b
            ),
          }));
        } finally {
          set({ isCreating: false });
        }
      },

      getBlendBetween: (userId1, userId2) => {
        return get().blends.find(
          (b) =>
            (b.user1_id === userId1 && b.user2_id === userId2) ||
            (b.user1_id === userId2 && b.user2_id === userId1)
        );
      },

      dismissNotification: (fromUserId) => {
        set((state) => ({
          pendingFromUserIds: state.pendingFromUserIds.filter((id) => id !== fromUserId),
        }));
      },
    }),
    {
      name: 'bookshelf-blends',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        blends: state.blends,
        pendingFromUserIds: state.pendingFromUserIds,
      }),
    }
  )
);
