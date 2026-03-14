import { Log, Book, BlendBook } from './types';
import { searchBooks } from './googleBooks';
import { supabase } from './supabase';

export interface BlendResult {
  books: BlendBook[];
  bond_book: Book | null;
  compatibility_score: number;
}

// ─── Fetch User B's logs from Supabase ───────────────────────────────────────

export async function fetchUserLogsFromSupabase(userId: string): Promise<Log[]> {
  try {
    const { data } = await supabase
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

    if (!data) return [];

    return data.map((rl) => ({
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
  } catch {
    return [];
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns items sorted by frequency (most common first). */
function topItems(logs: Log[], getter: (l: Log) => string[]): string[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    for (const item of getter(log)) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
}

// ─── Compatibility score ─────────────────────────────────────────────────────

function calcCompatibility(
  user1Logs: Log[],
  user2Logs: Log[],
  sharedCount: number
): number {
  const allIds = new Set([
    ...user1Logs.map((l) => l.book?.google_books_id).filter(Boolean),
    ...user2Logs.map((l) => l.book?.google_books_id).filter(Boolean),
  ]);
  const sharedBooksPct = allIds.size > 0 ? sharedCount / allIds.size : 0;

  const u1Genres = new Set(user1Logs.flatMap((l) => l.book?.genres ?? []));
  const u2Genres = new Set(user2Logs.flatMap((l) => l.book?.genres ?? []));
  const allGenres = new Set([...u1Genres, ...u2Genres]);
  const sharedGenres = [...u1Genres].filter((g) => u2Genres.has(g));
  const sharedGenresPct = allGenres.size > 0 ? sharedGenres.length / allGenres.size : 0;

  const u1Authors = new Set(user1Logs.flatMap((l) => l.book?.authors ?? []));
  const u2Authors = new Set(user2Logs.flatMap((l) => l.book?.authors ?? []));
  const allAuthors = new Set([...u1Authors, ...u2Authors]);
  const sharedAuthors = [...u1Authors].filter((a) => u2Authors.has(a));
  const sharedAuthorsPct = allAuthors.size > 0 ? sharedAuthors.length / allAuthors.size : 0;

  const score =
    sharedGenresPct * 0.5 + sharedAuthorsPct * 0.3 + sharedBooksPct * 0.2;

  return Math.min(100, Math.round(score * 100));
}

// ─── Main blend algorithm ────────────────────────────────────────────────────

export async function runBlend(
  user1Logs: Log[],
  user2Logs: Log[]
): Promise<BlendResult> {
  // ── Bond book: highest avg-rated book BOTH users have logged ──────────────
  const u2GoogleIds = new Set(
    user2Logs.map((l) => l.book?.google_books_id).filter((id): id is string => !!id)
  );
  const seenShared = new Set<string>();
  const sharedBooks: Book[] = [];
  for (const log of user1Logs) {
    const gid = log.book?.google_books_id;
    if (gid && u2GoogleIds.has(gid) && !seenShared.has(gid) && log.book) {
      sharedBooks.push(log.book);
      seenShared.add(gid);
    }
  }

  let bondBook: Book | null = null;
  if (sharedBooks.length > 0) {
    let bestAvg = -1;
    for (const book of sharedBooks) {
      const r1 =
        user1Logs.find((l) => l.book?.google_books_id === book.google_books_id)?.rating ?? 0;
      const r2 =
        user2Logs.find((l) => l.book?.google_books_id === book.google_books_id)?.rating ?? 0;
      const avg = (r1 + r2) / 2;
      if (avg > bestAvg) { bestAvg = avg; bondBook = book; }
    }
    if (bestAvg === 0) bondBook = null;
  }

  const score = calcCompatibility(user1Logs, user2Logs, sharedBooks.length);

  // ── Recommendation list: 5 books neither user has read ───────────────────
  const allReadIds = new Set([
    ...user1Logs.map((l) => l.book?.google_books_id).filter((id): id is string => !!id),
    ...user2Logs.map((l) => l.book?.google_books_id).filter((id): id is string => !!id),
  ]);

  // Taste profiles
  const u1TopGenres   = topItems(user1Logs, (l) => l.book?.genres ?? []);
  const u2TopGenres   = topItems(user2Logs, (l) => l.book?.genres ?? []);
  const u1TopAuthors  = topItems(user1Logs, (l) => l.book?.authors ?? []);
  const u2TopAuthors  = topItems(user2Logs, (l) => l.book?.authors ?? []);

  const u2GenreSet  = new Set(u2TopGenres);
  const u1GenreSet  = new Set(u1TopGenres);
  const u2AuthorSet = new Set(u2TopAuthors);
  const u1AuthorSet = new Set(u1TopAuthors);

  const sharedGenresArr  = u1TopGenres.filter((g) => u2GenreSet.has(g));
  const u1OnlyGenres     = u1TopGenres.filter((g) => !u2GenreSet.has(g));
  const u2OnlyGenres     = u2TopGenres.filter((g) => !u1GenreSet.has(g));
  const u1OnlyAuthors    = u1TopAuthors.filter((a) => !u2AuthorSet.has(a));
  const u2OnlyAuthors    = u2TopAuthors.filter((a) => !u1AuthorSet.has(a));

  type Source = 'user1' | 'user2' | 'shared';
  type QuerySpec = { query: string; source: Source };

  // Build query list: try 1 shared, 2 user1, 2 user2
  const querySpecs: QuerySpec[] = [
    ...sharedGenresArr.slice(0, 2).map((g) => ({ query: `subject:${g}`, source: 'shared' as Source })),
    ...u1OnlyGenres.slice(0, 2).map((g) => ({ query: `subject:${g}`, source: 'user1' as Source })),
    ...u1OnlyAuthors.slice(0, 1).map((a) => ({ query: `inauthor:${a}`, source: 'user1' as Source })),
    ...u2OnlyGenres.slice(0, 2).map((g) => ({ query: `subject:${g}`, source: 'user2' as Source })),
    ...u2OnlyAuthors.slice(0, 1).map((a) => ({ query: `inauthor:${a}`, source: 'user2' as Source })),
  ];

  // Ensure every source has at least one query
  if (!querySpecs.some((q) => q.source === 'shared')) {
    const fallback = sharedGenresArr[0] ?? u1TopGenres[0] ?? u2TopGenres[0];
    if (fallback) querySpecs.unshift({ query: `subject:${fallback}`, source: 'shared' });
    else querySpecs.unshift({ query: 'popular fiction', source: 'shared' });
  }
  if (!querySpecs.some((q) => q.source === 'user1') && u1TopGenres.length > 0) {
    querySpecs.push({ query: `subject:${u1TopGenres[0]}`, source: 'user1' });
  }
  if (!querySpecs.some((q) => q.source === 'user2') && u2TopGenres.length > 0) {
    querySpecs.push({ query: `subject:${u2TopGenres[0]}`, source: 'user2' });
  }

  // Target counts per source: 1 shared + 2 user1 + 2 user2
  const targets: Record<Source, number> = { shared: 1, user1: 2, user2: 2 };
  const counts:  Record<Source, number> = { shared: 0, user1: 0, user2: 0 };
  const blendBooks: BlendBook[] = [];
  const seenIds = new Set<string>();

  for (const spec of querySpecs) {
    if (blendBooks.length >= 5) break;
    if (counts[spec.source] >= targets[spec.source]) continue;
    try {
      const results = await searchBooks(spec.query, 15);
      for (const book of results) {
        if (blendBooks.length >= 5) break;
        if (counts[spec.source] >= targets[spec.source]) break;
        if (!allReadIds.has(book.google_books_id) && !seenIds.has(book.google_books_id)) {
          blendBooks.push({ book, source: spec.source });
          seenIds.add(book.google_books_id);
          counts[spec.source]++;
        }
      }
    } catch {
      // API unavailable — continue
    }
  }

  // Backfill remaining slots from any genre if API had gaps
  if (blendBooks.length < 5) {
    const backfillSpecs: QuerySpec[] = [
      ...u1TopGenres.slice(0, 3).map((g) => ({ query: `subject:${g}`, source: 'user1' as Source })),
      ...u2TopGenres.slice(0, 3).map((g) => ({ query: `subject:${g}`, source: 'user2' as Source })),
    ];
    for (const spec of backfillSpecs) {
      if (blendBooks.length >= 5) break;
      try {
        const results = await searchBooks(spec.query, 10);
        for (const book of results) {
          if (blendBooks.length >= 5) break;
          if (!allReadIds.has(book.google_books_id) && !seenIds.has(book.google_books_id)) {
            blendBooks.push({ book, source: spec.source });
            seenIds.add(book.google_books_id);
          }
        }
      } catch { /* continue */ }
    }
  }

  return {
    books: blendBooks.slice(0, 5),
    bond_book: bondBook,
    compatibility_score: score,
  };
}
