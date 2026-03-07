import { GoogleBooksVolume, GoogleBooksSearchResult, Book } from './types';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '';

function buildCoverUrl(volume: GoogleBooksVolume): string | null {
  // Prefer Open Library covers (reliable, high-res) if we have an ISBN
  const isbn = extractIsbn(volume);
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  // Fallback to Google Books thumbnail with higher zoom
  const imageLinks = volume.volumeInfo.imageLinks;
  if (!imageLinks) return null;
  const url = imageLinks.thumbnail ?? imageLinks.smallThumbnail ?? null;
  if (!url) return null;
  return url
    .replace('http://', 'https://')
    .replace('&edge=curl', '')
    .replace('zoom=1', 'zoom=2');
}

function extractIsbn(volume: GoogleBooksVolume): string | null {
  const identifiers = volume.volumeInfo.industryIdentifiers;
  if (!identifiers) return null;
  const isbn13 = identifiers.find((id) => id.type === 'ISBN_13');
  const isbn10 = identifiers.find((id) => id.type === 'ISBN_10');
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

export function volumeToBook(volume: GoogleBooksVolume): Book {
  const info = volume.volumeInfo;
  return {
    id: '', // assigned by DB
    google_books_id: volume.id,
    title: info.title,
    authors: info.authors ?? [],
    cover_url: buildCoverUrl(volume),
    page_count: info.pageCount ?? null,
    published_date: info.publishedDate ?? null,
    genres: info.categories ?? [],
    synopsis: info.description ?? null,
    isbn: extractIsbn(volume),
  };
}

export async function searchBooks(query: string, maxResults = 20): Promise<Book[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    printType: 'books',
    ...(API_KEY ? { key: API_KEY } : {}),
  });

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) throw new Error(`Google Books API error: ${response.status}`);

  const data: GoogleBooksSearchResult = await response.json();
  if (!data.items) return [];

  return data.items.map(volumeToBook);
}

export async function getBookById(googleBooksId: string): Promise<Book | null> {
  const params = API_KEY ? `?key=${API_KEY}` : '';
  const response = await fetch(`${BASE_URL}/${googleBooksId}${params}`);
  if (!response.ok) return null;

  const volume: GoogleBooksVolume = await response.json();
  return volumeToBook(volume);
}
