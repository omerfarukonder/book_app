import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Log, BookList, ListItem, Book } from '@/lib/types';
import { MOCK_LOGS, MOCK_LISTS, MOCK_LIST_ITEMS, MOCK_BOOKS, MOCK_USERS } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Sync a book to Supabase (upsert by google_books_id)
async function syncBookToSupabase(book: Book): Promise<void> {
  try {
    await supabase.from('books').upsert(
      {
        id: book.id,
        google_books_id: book.google_books_id,
        title: book.title,
        authors: book.authors,
        cover_url: book.cover_url,
        page_count: book.page_count,
        published_date: book.published_date,
        genres: book.genres,
        synopsis: book.synopsis,
        isbn: book.isbn,
      },
      { onConflict: 'google_books_id' }
    );
  } catch {
    // Supabase offline — silent fail
  }
}

// Sync a log to Supabase
async function syncLogToSupabase(log: Log): Promise<void> {
  try {
    await supabase.from('logs').upsert({
      id: log.id,
      user_id: log.user_id,
      book_id: log.book_id,
      status: log.status,
      rating: log.rating,
      review_text: log.review_text,
      contains_spoilers: log.contains_spoilers,
      started_at: log.started_at,
      finished_at: log.finished_at,
      created_at: log.created_at,
    });
  } catch {
    // Supabase offline — silent fail
  }
}

interface DataState {
  logs: Log[];
  lists: BookList[];
  listItems: ListItem[];
  seeded: boolean;

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

  // Queries
  getFeed: () => Log[];
  getUserLogs: (userId: string) => Log[];
  getReviews: () => Log[];
  getBookLogs: (bookId: string) => Log[];
  getBookRating: (bookId: string) => { avg: number; count: number };
  getUserStats: (userId: string) => { books: number; followers: number; following: number };
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      logs: [],
      lists: [],
      listItems: [],
      seeded: false,

      seedIfNeeded: () => {
        if (get().seeded) return;
        set({
          logs: MOCK_LOGS,
          lists: MOCK_LISTS,
          listItems: MOCK_LIST_ITEMS,
          seeded: true,
        });
      },

      // ─── Log mutations ──────────────────────────────────

      addLog: (logData) => {
        const newLog: Log = {
          ...logData,
          id: generateId(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({ logs: [newLog, ...state.logs] }));

        // Sync to Supabase in background
        if (newLog.book) {
          syncBookToSupabase(newLog.book);
        }
        syncLogToSupabase(newLog);
      },

      updateLog: (id, updates) => {
        set((state) => ({
          logs: state.logs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }));

        // Sync updated log to Supabase
        const updated = get().logs.find((l) => l.id === id);
        if (updated) {
          syncLogToSupabase(updated);
        }
      },

      deleteLog: (id) => {
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));

        // Delete from Supabase in background
        try { supabase.from('logs').delete().eq('id', id); } catch { /* offline */ }
      },

      // ─── List mutations ─────────────────────────────────

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

      // ─── Queries ─────────────────────────────────────────

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
