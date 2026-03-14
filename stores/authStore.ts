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

// Built-in admin account (hardcoded, never synced to Supabase)
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

// Simple UUID v4 fallback for offline signup
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  const saved: StoredAccount[] = raw ? JSON.parse(raw) : [];
  if (!saved.find((a) => a.username === 'admin')) {
    saved.unshift(ADMIN_ACCOUNT);
  }
  return saved;
}

async function saveAccount(account: StoredAccount): Promise<void> {
  const accounts = await getAccounts();
  // Remove existing entry for this username before saving
  const filtered = accounts.filter((a) => a.username !== account.username);
  filtered.push(account);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
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
        // Admin always works locally
        if (username === 'admin' && password === 'admin') {
          set({ user: ADMIN_ACCOUNT.profile, isAuthenticated: true });
          return;
        }

        // Check local cache first (fast, works offline)
        const accounts = await getAccounts();
        const localAccount = accounts.find(
          (a) => a.username === username && a.password === password
        );

        if (localAccount) {
          set({ user: localAccount.profile, isAuthenticated: true });

          // In background: sync Supabase session and reconcile UUID
          try {
            const { data } = await supabase.auth.signInWithPassword({
              email: `${username}@bookshelf.app`,
              password,
            });
            if (data.user && data.user.id !== localAccount.profile.id) {
              // Supabase UUID differs from local — update local to match
              const updatedProfile = { ...localAccount.profile, id: data.user.id };
              await saveAccount({ username, password, profile: updatedProfile });
              set({ user: updatedProfile, isAuthenticated: true });
            }
          } catch {
            // Supabase offline — local session is fine
          }
          return;
        }

        // No local account — try Supabase directly
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: `${username}@bookshelf.app`,
            password,
          });
          if (!error && data.user) {
            // Fetch profile from public.users
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
        // Check username availability locally
        const accounts = await getAccounts();
        if (accounts.find((a) => a.username === username)) {
          throw new Error('Username already taken');
        }

        let userId: string;

        // Try Supabase FIRST so we get the real UUID from auth
        try {
          const { data, error } = await supabase.auth.signUp({
            email: `${username}@bookshelf.app`,
            password,
            options: { data: { username, display_name: displayName } },
          });

          if (!error && data.user) {
            userId = data.user.id; // Real Supabase UUID

            // Insert into public.users table
            await supabase.from('users').upsert({
              id: userId,
              username,
              display_name: displayName,
              avatar_url: null,
              bio: null,
            });
          } else {
            // Supabase returned an error (e.g. email already exists)
            const msg = error?.message ?? 'Sign up failed';
            if (msg.toLowerCase().includes('already')) {
              throw new Error('Username already taken');
            }
            userId = generateUUID(); // offline fallback
          }
        } catch (err: any) {
          if (err.message && !err.message.includes('fetch')) throw err;
          userId = generateUUID(); // network error fallback
        }

        const profile: UserProfile = {
          id: userId,
          username,
          display_name: displayName,
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
        };

        await saveAccount({ username, password, profile });
        set({ user: profile, isAuthenticated: true });
      },

      signOut: () => {
        set({ user: null, isAuthenticated: false });
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
