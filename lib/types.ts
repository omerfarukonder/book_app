export type ReadingStatus = 'want_to_read' | 'reading' | 'finished' | 'abandoned';

export interface Book {
  id: string;
  google_books_id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  page_count: number | null;
  published_date: string | null;
  genres: string[];
  synopsis: string | null;
  isbn: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  books_count?: number;
  followers_count?: number;
  following_count?: number;
}

export interface Log {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  rating: number | null;
  review_text: string | null;
  contains_spoilers: boolean;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  // Joined fields
  book?: Book;
  user?: UserProfile;
}

export interface BookList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_ranked: boolean;
  is_public: boolean;
  created_at: string;
  // Joined
  user?: UserProfile;
  items?: ListItem[];
  item_count?: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  book_id: string;
  position: number;
  notes: string | null;
  book?: Book;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  log_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  log_id: string;
  text: string;
  created_at: string;
  user?: UserProfile;
}

export interface Tag {
  id: string;
  user_id: string;
  log_id: string;
  name: string;
}

// Google Books API response types
export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    publishedDate?: string;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

export interface GoogleBooksSearchResult {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

// Activity feed item
export interface ActivityItem {
  type: 'log' | 'like' | 'list' | 'follow';
  created_at: string;
  user: UserProfile;
  log?: Log;
  book?: Book;
  list?: BookList;
  target_user?: UserProfile;
}
