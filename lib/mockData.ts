import { Book, UserProfile, Log, BookList, ListItem } from './types';

// ─── Users ───────────────────────────────────────────────
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1',
    username: 'admin',
    display_name: 'Admin',
    avatar_url: null,
    bio: 'Avid reader. Sci-fi nerd. Coffee addict.',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    username: 'janeausten',
    display_name: 'Jane Austen',
    avatar_url: null,
    bio: 'It is a truth universally acknowledged...',
    created_at: '2025-02-10T00:00:00Z',
  },
  {
    id: 'u3',
    username: 'bookworm42',
    display_name: 'Elif K.',
    avatar_url: null,
    bio: 'Reading my way through the classics.',
    created_at: '2025-03-15T00:00:00Z',
  },
  {
    id: 'u4',
    username: 'scifimax',
    display_name: 'Max Chen',
    avatar_url: null,
    bio: 'If it has spaceships, I\'m in.',
    created_at: '2025-04-01T00:00:00Z',
  },
];

export const CURRENT_USER = MOCK_USERS[0];

// ─── Books ───────────────────────────────────────────────
export const MOCK_BOOKS: Book[] = [
  {
    id: 'b1',
    google_books_id: 'jAUODAAAQBAJ',
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
    page_count: 476,
    published_date: '2021-05-04',
    genres: ['Science Fiction'],
    synopsis: 'Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the Earth itself are finished.',
    isbn: '9780593135204',
  },
  {
    id: 'b2',
    google_books_id: 'aWZzLPhY4o0C',
    title: 'The Great Gatsby',
    authors: ['F. Scott Fitzgerald'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
    page_count: 180,
    published_date: '1925-04-10',
    genres: ['Literary Fiction', 'Classics'],
    synopsis: 'A portrait of the Jazz Age in all of its decadence and excess, told through the eyes of Nick Carraway.',
    isbn: '9780743273565',
  },
  {
    id: 'b3',
    google_books_id: 'k_IPM3DEZiEC',
    title: 'Dune',
    authors: ['Frank Herbert'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
    page_count: 688,
    published_date: '1965-08-01',
    genres: ['Science Fiction', 'Fantasy'],
    synopsis: 'Set on the desert planet Arrakis, the story follows young Paul Atreides as his family accepts stewardship of the planet and its valuable spice.',
    isbn: '9780441172719',
  },
  {
    id: 'b4',
    google_books_id: 'PGR2AwAAQBAJ',
    title: '1984',
    authors: ['George Orwell'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    page_count: 328,
    published_date: '1949-06-08',
    genres: ['Science Fiction', 'Classics'],
    synopsis: 'A dystopian novel set in a totalitarian society ruled by Big Brother.',
    isbn: '9780451524935',
  },
  {
    id: 'b5',
    google_books_id: 'ydQiDQAAQBAJ',
    title: 'Atomic Habits',
    authors: ['James Clear'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    page_count: 320,
    published_date: '2018-10-16',
    genres: ['Self-Help', 'Non-Fiction'],
    synopsis: 'An easy and proven way to build good habits and break bad ones.',
    isbn: '9780735211292',
  },
  {
    id: 'b6',
    google_books_id: 'sM7MTn0-7BcC',
    title: 'Norwegian Wood',
    authors: ['Haruki Murakami'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780375704024-L.jpg',
    page_count: 296,
    published_date: '1987-09-04',
    genres: ['Literary Fiction', 'Romance'],
    synopsis: 'A nostalgic story of loss and sexuality in Tokyo during the late 1960s.',
    isbn: '9780375704024',
  },
  {
    id: 'b7',
    google_books_id: 'I1a_xwm6jcMC',
    title: 'The Hitchhiker\'s Guide to the Galaxy',
    authors: ['Douglas Adams'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg',
    page_count: 224,
    published_date: '1979-10-12',
    genres: ['Science Fiction', 'Humor'],
    synopsis: 'Seconds before Earth is demolished to make way for a galactic freeway, Arthur Dent is plucked off the planet by his friend Ford Prefect.',
    isbn: '9780345391803',
  },
  {
    id: 'b8',
    google_books_id: 'xmt_tAEACAAJ',
    title: 'Sapiens',
    authors: ['Yuval Noah Harari'],
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
    page_count: 443,
    published_date: '2015-02-10',
    genres: ['Non-Fiction', 'Science'],
    synopsis: 'A brief history of humankind, from the Stone Age to the Silicon Age.',
    isbn: '9780062316097',
  },
];

// ─── Logs (reviews & activity) ───────────────────────────
export const MOCK_LOGS: Log[] = [
  {
    id: 'l1',
    user_id: 'u1',
    book_id: 'b1',
    status: 'finished',
    rating: 4.5,
    review_text: 'Absolutely loved this. The science is fascinating, the humor is perfect, and Rocky is one of the best characters ever written. Stayed up until 3am to finish it.',
    contains_spoilers: false,
    started_at: '2026-01-15T00:00:00Z',
    finished_at: '2026-01-28T00:00:00Z',
    created_at: '2026-01-28T10:00:00Z',
    book: MOCK_BOOKS[0],
    user: MOCK_USERS[0],
  },
  {
    id: 'l2',
    user_id: 'u2',
    book_id: 'b2',
    status: 'finished',
    rating: 5,
    review_text: 'A masterpiece of American literature. The prose is gorgeous and the ending is devastating. Every sentence is carefully crafted.',
    contains_spoilers: false,
    started_at: '2026-01-20T00:00:00Z',
    finished_at: '2026-02-01T00:00:00Z',
    created_at: '2026-02-01T14:30:00Z',
    book: MOCK_BOOKS[1],
    user: MOCK_USERS[1],
  },
  {
    id: 'l3',
    user_id: 'u3',
    book_id: 'b3',
    status: 'finished',
    rating: 4,
    review_text: 'Dense world-building but incredibly rewarding. The political intrigue keeps you hooked. A must-read for any sci-fi fan.',
    contains_spoilers: false,
    started_at: '2026-01-10T00:00:00Z',
    finished_at: '2026-02-02T00:00:00Z',
    created_at: '2026-02-02T09:15:00Z',
    book: MOCK_BOOKS[2],
    user: MOCK_USERS[2],
  },
  {
    id: 'l4',
    user_id: 'u4',
    book_id: 'b4',
    status: 'finished',
    rating: 4.5,
    review_text: 'Terrifyingly relevant. Orwell\'s vision of surveillance and thought control feels more prescient every year.',
    contains_spoilers: false,
    started_at: '2026-01-25T00:00:00Z',
    finished_at: '2026-02-03T00:00:00Z',
    created_at: '2026-02-03T11:00:00Z',
    book: MOCK_BOOKS[3],
    user: MOCK_USERS[3],
  },
  {
    id: 'l5',
    user_id: 'u1',
    book_id: 'b5',
    status: 'finished',
    rating: 4,
    review_text: 'Practical and actionable. Changed how I think about building routines. The "1% better every day" concept really sticks.',
    contains_spoilers: false,
    started_at: '2026-01-30T00:00:00Z',
    finished_at: '2026-02-04T00:00:00Z',
    created_at: '2026-02-04T16:00:00Z',
    book: MOCK_BOOKS[4],
    user: MOCK_USERS[0],
  },
  {
    id: 'l6',
    user_id: 'u2',
    book_id: 'b6',
    status: 'reading',
    rating: null,
    review_text: null,
    contains_spoilers: false,
    started_at: '2026-02-03T00:00:00Z',
    finished_at: null,
    created_at: '2026-02-03T20:00:00Z',
    book: MOCK_BOOKS[5],
    user: MOCK_USERS[1],
  },
  {
    id: 'l7',
    user_id: 'u3',
    book_id: 'b7',
    status: 'finished',
    rating: 5,
    review_text: 'Don\'t panic! Pure comedic genius. Douglas Adams is a treasure. Re-read for the 4th time and it only gets better.',
    contains_spoilers: false,
    started_at: '2026-02-01T00:00:00Z',
    finished_at: '2026-02-04T00:00:00Z',
    created_at: '2026-02-04T21:30:00Z',
    book: MOCK_BOOKS[6],
    user: MOCK_USERS[2],
  },
  {
    id: 'l8',
    user_id: 'u4',
    book_id: 'b8',
    status: 'want_to_read',
    rating: null,
    review_text: null,
    contains_spoilers: false,
    started_at: null,
    finished_at: null,
    created_at: '2026-02-05T08:00:00Z',
    book: MOCK_BOOKS[7],
    user: MOCK_USERS[3],
  },
  {
    id: 'l9',
    user_id: 'u1',
    book_id: 'b3',
    status: 'finished',
    rating: 4.5,
    review_text: 'The spice must flow. Herbert created an entire universe that feels alive. Paul\'s journey is epic in every sense.',
    contains_spoilers: false,
    started_at: '2025-12-20T00:00:00Z',
    finished_at: '2026-01-10T00:00:00Z',
    created_at: '2026-01-10T12:00:00Z',
    book: MOCK_BOOKS[2],
    user: MOCK_USERS[0],
  },
  {
    id: 'l10',
    user_id: 'u1',
    book_id: 'b7',
    status: 'finished',
    rating: 4,
    review_text: null,
    contains_spoilers: false,
    started_at: '2025-12-01T00:00:00Z',
    finished_at: '2025-12-15T00:00:00Z',
    created_at: '2025-12-15T18:00:00Z',
    book: MOCK_BOOKS[6],
    user: MOCK_USERS[0],
  },
];

// ─── Helper functions ────────────────────────────────────

/** Feed: recent logs from all users (simulates "following everyone") */
export function getMockFeed(): Log[] {
  return [...MOCK_LOGS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Current user's logs */
export function getMockUserLogs(userId: string = CURRENT_USER.id): Log[] {
  return MOCK_LOGS
    .filter((l) => l.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Logs with reviews (for Activity tab) */
export function getMockReviews(): Log[] {
  return MOCK_LOGS
    .filter((l) => l.review_text)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Find a book by google_books_id */
export function getMockBookByGoogleId(googleBooksId: string): Book | undefined {
  return MOCK_BOOKS.find((b) => b.google_books_id === googleBooksId);
}

/** Get reviews for a specific book */
export function getMockBookReviews(bookId: string): Log[] {
  return MOCK_LOGS
    .filter((l) => l.book_id === bookId && l.review_text)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Get average rating for a book */
export function getMockBookRating(bookId: string): { avg: number; count: number } {
  const rated = MOCK_LOGS.filter((l) => l.book_id === bookId && l.rating != null && l.rating > 0);
  if (rated.length === 0) return { avg: 0, count: 0 };
  const total = rated.reduce((sum, l) => sum + (l.rating ?? 0), 0);
  return { avg: Math.round((total / rated.length) * 10) / 10, count: rated.length };
}

/** User stats */
export function getMockUserStats(userId: string = CURRENT_USER.id) {
  const books = MOCK_LOGS.filter((l) => l.user_id === userId).length;
  return { books, followers: 89, following: 38 };
}

/** Find user by ID */
export function getMockUserById(userId: string): UserProfile | undefined {
  return MOCK_USERS.find((u) => u.id === userId);
}

// ─── Mock Lists ──────────────────────────────────────────
export const MOCK_LISTS: BookList[] = [
  {
    id: 'list1',
    user_id: 'u1',
    title: 'Best Sci-Fi Ever',
    description: 'My all-time favorite science fiction novels.',
    is_ranked: true,
    is_public: true,
    created_at: '2026-01-15T00:00:00Z',
    user: MOCK_USERS[0],
  },
  {
    id: 'list2',
    user_id: 'u2',
    title: 'Books That Changed My Life',
    description: 'These books fundamentally shifted how I see the world.',
    is_ranked: false,
    is_public: true,
    created_at: '2026-02-01T00:00:00Z',
    user: MOCK_USERS[1],
  },
];

export const MOCK_LIST_ITEMS: ListItem[] = [
  { id: 'li1', list_id: 'list1', book_id: 'b1', position: 1, notes: null, book: MOCK_BOOKS[0] },
  { id: 'li2', list_id: 'list1', book_id: 'b3', position: 2, notes: null, book: MOCK_BOOKS[2] },
  { id: 'li3', list_id: 'list1', book_id: 'b7', position: 3, notes: null, book: MOCK_BOOKS[6] },
  { id: 'li4', list_id: 'list1', book_id: 'b4', position: 4, notes: null, book: MOCK_BOOKS[3] },
  { id: 'li5', list_id: 'list2', book_id: 'b2', position: 1, notes: null, book: MOCK_BOOKS[1] },
  { id: 'li6', list_id: 'list2', book_id: 'b5', position: 2, notes: null, book: MOCK_BOOKS[4] },
  { id: 'li7', list_id: 'list2', book_id: 'b8', position: 3, notes: null, book: MOCK_BOOKS[7] },
];

/** Get a list by ID */
export function getMockListById(listId: string): BookList | undefined {
  return MOCK_LISTS.find((l) => l.id === listId);
}

/** Get items for a list */
export function getMockListItems(listId: string): ListItem[] {
  return MOCK_LIST_ITEMS
    .filter((li) => li.list_id === listId)
    .sort((a, b) => a.position - b.position);
}
