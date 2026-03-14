import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Log, BookList, ListItem, Book } from '@/lib/types';
import { MOCK_LOGS, MOCK_LISTS, MOCK_LIST_ITEMS } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

/**
 * Finds or creates a book in Supabase by google_books_id.
 * Returns the Supabase UUID for use as book_id in logs.
 */
async function resolveSupabaseBookId(book: Book): Promise<string | null> {
  try {
    // Look up by google_books_id first
    const { data: existing } = await supabase
      .from('books')
      .select('id')
      .eq('google_books_id', book.google_books_id)
      .single();

    if (existing) return existing.id;

    // Insert new book (let Supabase generate the UUID)
    const { data: inserted } = await supabase
      .from('books')
      .insert({
        google_books_id: book.google_books_id,
        title: book.title,
        authors: book.authors,
        cover_url: book.cover_url,
        page_count: book.page_count,
        published_date: book.published_date,
        genres: book.genres,
        synopsis: book.synopsis,
        isbn: book.isbn,
      })
      .select('id')
      .single();

    return inserted?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Upserts a log to Supabase using the unique(user_id, book_id) constraint.
 * Skips admin user (id: 'u1') — mock data is never synced.
 */
async function syncLogToSupabase(
  log: Log,
  supabaseBookId: string
): Promise<void> {
  try {
    await supabase.from('logs').upsert(
      {
        user_id: log.user_id,
        book_id: supabaseBookId,
        status: log.status,
        rating: log.rating,
        review_text: log.review_text,
        contains_spoilers: log.contains_spoilers,
        started_at: log.started_at,
        finished_at: log.finished_at,
      },
      { onConflict: 'user_id,book_id' }
    );
  } catch {
    // Supabase offline — silent fail
  }
}

// ─── State shape ─────────────────────────────────────────────────────────────

interface DataState {
  logs: Log[];
  lists: BookList[];
  listItems: ListItem[];
  seeded: boolean;
  isSyncing: boolean;

  // Seed
  seedIfNeeded: () => void;

  // Logs
  addLog: (log: Omit<Log, 'id' | 'created_at'>) => void;
  updateLog: (id: string, updates: Partial<Log>) => void;
  deleteLog: (id: string) => void;

  // Lists
  addList: (title: string, description: string, userId: string, isRanked?: boolean) => string;
  addListItem: (listId: string, book: Book) => void;
  removeListItem: (id: string) => void;

  // Supabase sync
  syncFromSupabase: (userId: string) => Promise<void>;

  // Queries
  getFeed: () => Log[];
  getUserLogs: (userId: string) => Log[];
  getReviews: () => Log[];
  getBookLogs: (bookId: string) => Log[];
  getBookRating: (bookId: string) => { avg: number; count: number };
  getUserStats: (userId: string) => { books: number; followers: number; following: number };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      logs: [],
      lists: [],
      listItems: [],
      seeded: false,
      isSyncing: false,

      seedIfNeeded: () => {
        if (get().seeded) return;
        set({
          logs: MOCK_LOGS,
          lists: MOCK_LISTS,
          listItems: MOCK_LIST_ITEMS,
          seeded: true,
        });
      },

      // ─── Supabase pull ─────────────────────────────────────────────────

      syncFromSupabase: async (userId: string) => {
        // Never sync admin — they use local mock data
        if (userId === 'u1') return;

        set({ isSyncing: true });

        try {
          const { data: remoteLogs, error } = await supabase
            .from('logs')
            .select(`
              *,
              book:books (
                id, google_books_id, title, authors, cover_url,
                page_count, published_date, genres, synopsis, isbn
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error || !remoteLogs || remoteLogs.length === 0) return;

          const mappedLogs: Log[] = remoteLogs.map((rl) => ({
            id: rl.id,
            user_id: rl.user_id,
            book_id: rl.book_id,
            status: rl.status,
            rating: rl.rating ?? null,
            review_text: rl.review_text ?? null,
            contains_spoilers: rl.contains_spoilers ?? false,
            started_at: rl.started_at ?? null,
            finished_at: rl.finished_at ?? null,
            created_at: rl.created_at,
            book: rl.book
              ? {
                  id: rl.book.id,
                  google_books_id: rl.book.google_books_id,
                  title: rl.book.title,
                  authors: rl.book.authors ?? [],
                  cover_url: rl.book.cover_url ?? null,
                  page_count: rl.book.page_count ?? null,
                  published_date: rl.book.published_date ?? null,
                  genres: rl.book.genres ?? [],
                  synopsis: rl.book.synopsis ?? null,
                  isbn: rl.book.isbn ?? null,
                }
              : undefined,
          }));

          // Merge strategy: Supabase is source of truth for this user.
          // Keep other users' local logs (e.g. mock feed data).
          set((state) => {
            const otherLogs = state.logs.filter((l) => l.user_id !== userId);
            return { logs: [...mappedLogs, ...otherLogs] };
          });
        } catch {
          // Supabase offline — keep local data as-is
        } finally {
          set({ isSyncing: false });
        }
      },

      // ─── Log mutations ─────────────────────────────────────────────────

      addLog: (logData) => {
        const newLog: Log = {
          ...logData,
          id: generateId(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({ logs: [newLog, ...state.logs] }));

        // Skip Supabase sync for admin (mock user)
        if (logData.user_id === 'u1') return;

        // Sync to Supabase in background:
        // 1. Find/create book → get Supabase UUID
        // 2. Upsert log with that book UUID
        if (newLog.book) {
          const book = newLog.book;
          resolveSupabaseBookId(book).then((supabaseBookId) => {
            if (supabaseBookId) {
              syncLogToSupabase(newLog, supabaseBookId);
            }
          });
        }
      },

      updateLog: (id, updates) => {
        set((state) => ({
          logs: state.logs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }));

        const updated = get().logs.find((l) => l.id === id);
        if (!updated || updated.user_id === 'u1') return;

        if (updated.book) {
          resolveSupabaseBookId(updated.book).then((supabaseBookId) => {
            if (supabaseBookId) {
              syncLogToSupabase(updated, supabaseBookId);
            }
          });
        }
      },

      deleteLog: (id) => {
        const log = get().logs.find((l) => l.id === id);
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));

        // Delete from Supabase — skip admin
        if (!log || log.user_id === 'u1') return;
        try {
          supabase.from('logs').delete().eq('id', id);
        } catch {
          // offline
        }
      },

      // ─── List mutations ────────────────────────────────────────────────

      addList: (title, description, userId, isRanked = false) => {
        const id = generateId();
        const newList: BookList = {
          id,
          user_id: userId,
          title,
          description,
          is_ranked: isRanked,
          is_public: true,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ lists: [newList, ...state.lists] }));
        return id;
      },

      addListItem: (listId, book) => {
        const current = get().listItems.filter((li) => li.list_id === listId);
        const newItem: ListItem = {
          id: generateId(),
          list_id: listId,
          book_id: book.id,
          position: current.length + 1,
          notes: null,
          book,
        };
        set((state) => ({ listItems: [...state.listItems, newItem] }));
      },

      removeListItem: (id) => {
        set((state) => ({ listItems: state.listItems.filter((li) => li.id !== id) }));
      },

      // ─── Queries ───────────────────────────────────────────────────────

      getFeed: () => {
        return [...get().logs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      },

      getUserLogs: (userId) => {
        return get()
          .logs.filter((l) => l.user_id === userId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },

      getReviews: () => {
        return get()
          .logs.filter((l) => l.review_text)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },

      getBookLogs: (bookId) => {
        return get()
          .logs.filter((l) => l.book_id === bookId && l.review_text)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },

      getBookRating: (bookId) => {
        const rated = get().logs.filter(
          (l) => l.book_id === bookId && l.rating != null && l.rating > 0
        );
        if (rated.length === 0) return { avg: 0, count: 0 };
        const total = rated.reduce((sum, l) => sum + (l.rating ?? 0), 0);
        return {
          avg: Math.round((total / rated.length) * 10) / 10,
          count: rated.length,
        };
      },

      getUserStats: (userId) => {
        const books = get().logs.filter((l) => l.user_id === userId).length;
        return { books, followers: 89, following: 38 };
      },
    }),
    {
      name: 'bookshelf-data',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        logs: state.logs,
        lists: state.lists,
        listItems: state.listItems,
        seeded: state.seeded,
      }),
    }
  )
);
