# BookShelf

BookShelf is an Expo React Native app for tracking books, logging reading activity, writing reviews, exploring new titles, and comparing reading taste with other users.

The app is built to work in two modes:

- Demo/local mode: seeded mock data plus a built-in `admin / admin` account
- Connected mode: Supabase auth + database sync for real user accounts

## What the app does

- Home feed with friend activity, popular books, and recent reviews
- Discover screen with Google Books search and genre browsing
- Reading log flow for statuses like `want_to_read`, `reading`, `finished`, and `abandoned`
- Personal stats dashboard
- Profile screen with books, reviews, and diary views
- Lists, followers/following pages, and book/user detail pages
- "Blend" feature that compares two readers and generates shared recommendations

## Tech stack

- Expo 54
- React Native 0.81
- React 19
- Expo Router for navigation
- Zustand for client state
- AsyncStorage for persistence
- Supabase for auth and backend data
- Google Books API for search and book metadata

## How data works

This app mixes local seeded data with backend syncing:

- On first launch, mock logs/lists are seeded from [`lib/mockData.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/lib/mockData.ts).
- The built-in `admin` user is local-only and does not sync to Supabase.
- Newly signed up users are stored locally and also created in Supabase when network access is available.
- For non-admin users, reading logs are synced to Supabase in the background.
- The Discover screen uses the Google Books API and falls back to local mock books if the API is unavailable.

This makes the app nice for demos because it still feels populated even before real backend data exists.

## Main app flow

1. App boots through Expo Router and loads fonts in [`app/_layout.tsx`](/Users/omerfarukonder/Desktop/Projects/book_app/app/_layout.tsx).
2. Auth state is restored from persisted Zustand storage.
3. Mock content is seeded into the local store on first launch.
4. If a non-admin user is logged in, their logs are pulled from Supabase.
5. Tabs become available for Home, Discover, Log, Stats, and Profile.

## Project structure

```text
app/                    Expo Router screens
  (auth)/               login and signup
  (tabs)/               main tab screens
  book/, user/, list/   detail screens
  blend/                blend result screens
components/             reusable UI pieces
constants/              colors and genre constants
lib/                    types, mock data, API helpers, blend logic, Supabase client
stores/                 Zustand auth/data stores
supabase/migrations/    database schema
scripts/                local utility scripts
assets/                 fonts and images
```

## Important files to know

- [`app/_layout.tsx`](/Users/omerfarukonder/Desktop/Projects/book_app/app/_layout.tsx): app bootstrap, auth guard, initial data seeding
- [`app/(tabs)/_layout.tsx`](/Users/omerfarukonder/Desktop/Projects/book_app/app/(tabs)/_layout.tsx): tab navigation
- [`stores/authStore.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/stores/authStore.ts): login/signup logic, persisted auth state
- [`stores/dataStore.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/stores/dataStore.ts): logs, lists, local seeding, Supabase sync
- [`lib/mockData.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/lib/mockData.ts): demo users, books, logs, and lists
- [`lib/googleBooks.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/lib/googleBooks.ts): Google Books search integration
- [`lib/blendEngine.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/lib/blendEngine.ts): recommendation and compatibility logic
- [`supabase/migrations/001_initial_schema.sql`](/Users/omerfarukonder/Desktop/Projects/book_app/supabase/migrations/001_initial_schema.sql): core backend schema
- [`supabase/migrations/002_blends.sql`](/Users/omerfarukonder/Desktop/Projects/book_app/supabase/migrations/002_blends.sql): blend storage schema

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

The app expects these variables:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- `EXPO_PUBLIC_*` variables are used by the mobile app at runtime.
- `SUPABASE_SERVICE_ROLE_KEY` is only needed for the admin seed script and should never be exposed publicly.

### 3. Start the app

```bash
npm start
```

Useful commands:

```bash
npm run ios
npm run android
npm run web
```

## Demo login

For quick local testing, use:

- Username: `admin`
- Password: `admin`

This account is hardcoded in [`stores/authStore.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/stores/authStore.ts) and is intended for demo/offline use.

## Supabase notes

Database tables and policies are defined in the migration files under [`supabase/migrations`](/Users/omerfarukonder/Desktop/Projects/book_app/supabase/migrations).

Core entities:

- `users`
- `books`
- `logs`
- `lists`
- `list_items`
- `follows`
- `likes`
- `comments`
- `tags`
- `user_genres`
- `blends`

If you want a fully connected environment, apply the migrations in Supabase before testing real user flows.

## Admin seed script

There is also a helper script:

```bash
npm run seed:admin
```

It uses the service role key and the file [`scripts/seed-admin.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/scripts/seed-admin.ts).

Important: the current in-app demo login is `admin / admin`, while the script creates a Supabase auth user for admin seeding. If you plan to rely on that script in a shared dev workflow, it is worth double-checking that its credential/email assumptions still match the current auth flow.

## How recommendations/blends work

The blend system lives in [`lib/blendEngine.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/lib/blendEngine.ts).

At a high level it:

- compares two users' logged books
- computes a compatibility score from shared genres, authors, and overlap
- finds a "bond book" if both users logged the same title
- generates up to five recommendations
- falls back to local mock books if the external API is unavailable

## Good places to start as a new contributor

- Start with the tab screens in [`app/(tabs)`](/Users/omerfarukonder/Desktop/Projects/book_app/app/(tabs)).
- Then read [`stores/authStore.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/stores/authStore.ts) and [`stores/dataStore.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/stores/dataStore.ts).
- Use [`lib/mockData.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/lib/mockData.ts) to understand the expected data shapes and demo content.
- Check the Supabase migrations to understand the backend model before changing sync logic.

## Current implementation notes

- Local persistence is handled with AsyncStorage via Zustand middleware.
- Mock data is versioned using `SEED_VERSION` in [`stores/dataStore.ts`](/Users/omerfarukonder/Desktop/Projects/book_app/stores/dataStore.ts).
- The app is intentionally resilient offline: several flows degrade gracefully to local-only behavior.
- Book covers prefer Open Library by ISBN and fall back to Google Books thumbnails.

## Future README improvements

If the team keeps building on this, a useful next step would be adding:

- screenshots
- a short architecture diagram
- feature status or roadmap
- testing and release instructions
