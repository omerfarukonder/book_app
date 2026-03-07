import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface StoredAccount {
  username: string;
  password: string;
  profile: UserProfile;
}

// Built-in admin account
const ADMIN_ACCOUNT: StoredAccount = {
  username: 'admin',
  password: 'admin',
  profile: {
    id: 'u1',
    username: 'admin',
    display_name: 'Admin',
    avatar_url: null,
    bio: 'Avid reader. Sci-fi nerd. Coffee addict.',
    created_at: '2025-01-01T00:00:00Z',
  },
};

const ACCOUNTS_KEY = 'bookshelf_accounts';

async function getAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  const saved: StoredAccount[] = raw ? JSON.parse(raw) : [];
  // Always include admin if not already there
  if (!saved.find((a) => a.username === 'admin')) {
    saved.unshift(ADMIN_ACCOUNT);
  }
  return saved;
}

async function saveAccount(account: StoredAccount): Promise<void> {
  const accounts = await getAccounts();
  accounts.push(account);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, displayName: string) => Promise<void>;
  signOut: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hydrated: false,

      signIn: async (username, password) => {
        // 1. Check local accounts first (admin always works offline)
        const accounts = await getAccounts();
        const localAccount = accounts.find(
          (a) => a.username === username && a.password === password
        );
        if (localAccount) {
          set({ user: localAccount.profile, isAuthenticated: true });
          // Also try Supabase sign-in in background (non-blocking)
          try {
            await supabase.auth.signInWithPassword({
              email: `${username}@bookshelf.app`,
              password,
            });
          } catch {
            // Supabase offline — fine, local auth succeeded
          }
          return;
        }

        // 2. Try Supabase auth if no local match
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: `${username}@bookshelf.app`,
            password,
          });
          if (!error && data.user) {
            // Fetch user profile from Supabase
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const profile: UserProfile = profileData
              ? {
                  id: profileData.id,
                  username: profileData.username,
                  display_name: profileData.display_name,
                  avatar_url: profileData.avatar_url,
                  bio: profileData.bio,
                  created_at: profileData.created_at,
                }
              : {
                  id: data.user.id,
                  username,
                  display_name: username,
                  avatar_url: null,
                  bio: null,
                  created_at: new Date().toISOString(),
                };

            // Cache locally for offline access
            await saveAccount({ username, password, profile });
            set({ user: profile, isAuthenticated: true });
            return;
          }
        } catch {
          // Supabase offline
        }

        throw new Error('Invalid username or password');
      },

      signUp: async (username, password, displayName) => {
        const accounts = await getAccounts();
        if (accounts.find((a) => a.username === username)) {
          throw new Error('Username already taken');
        }

        const profile: UserProfile = {
          id: `u_${Date.now()}`,
          username,
          display_name: displayName,
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
        };

        // Save locally first (always works)
        await saveAccount({ username, password, profile });
        set({ user: profile, isAuthenticated: true });

        // Try Supabase signup in background (non-blocking)
        try {
          const { data, error } = await supabase.auth.signUp({
            email: `${username}@bookshelf.app`,
            password,
          });
          if (!error && data.user) {
            // Insert user profile row
            await supabase.from('users').upsert({
              id: data.user.id,
              username,
              display_name: displayName,
              avatar_url: null,
              bio: null,
            });
          }
        } catch {
          // Supabase offline — local account still works
        }
      },

      signOut: () => {
        set({ user: null, isAuthenticated: false });
        // Sign out of Supabase too (non-blocking)
        supabase.auth.signOut().catch(() => {});
      },

      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'bookshelf-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
