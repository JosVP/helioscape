<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Favorites
Kebab-case: `favorites`

## 1) Goal (Why)

### Problem statement
Users need a way to bookmark and curate articles they find valuable, creating a personal collection of content they want to revisit or showcase.

### Who feels it most
Active readers who want to save articles for later reference and signal appreciation to authors, plus users browsing to discover popular content.

### Desired outcome
Users can easily mark articles as favorites, view their favorited articles collection, and see which articles are popular based on favorite counts.

### Success criteria
- Users can favorite and unfavorite articles with one click
- Favorite status updates immediately in UI
- Users can view all their favorited articles on profile page
- Article favorite count displays and updates in real-time
- Articles can be filtered by who favorited them

### Non-goals / out of scope
- Favorite categories or collections
- Private vs public favorites
- Favorite notifications
- Favorite notes or annotations
- Sharing favorite lists

## 2) Users & Access (What)

### Target users/personas
- Authenticated users curating content
- Profile visitors viewing user's favorited articles
- All users viewing favorite counts on articles

### Eligibility
- **Favorite/Unfavorite**: Authenticated users only
- **View favorite counts**: All users
- **View favorited articles list**: All users (on profile pages)

### Visibility
- Favorite button visible on all articles
- Favorite count visible to all users
- User's favorited articles visible on their profile to everyone
- Favorited status relative to current user (shows if current user favorited)

### Where it lives
- Article preview cards: Favorite button with count
- Article detail page: Favorite button in article meta
- Profile page: "Favorited Articles" tab

### How to reach it
- Primary entry point: Heart/favorite button on article previews and detail pages
- Secondary entry points: Profile "Favorited Articles" tab

## 3) User Experience & Flow (What)

### Happy path
1. Authenticated user views article
2. User clicks favorite button (heart icon)
3. Button state changes to "favorited" (filled heart)
4. Favorite count increments by 1
5. Article appears in user's "Favorited Articles" on profile

### Key screens/states
- Article preview: Favorite button with count badge
- Article detail: Favorite button in article meta section
- Profile page: Favorited Articles tab with filtered article list

### Empty state
- Profile "Favorited Articles" tab with no favorites: "No articles are here... yet."

### Loading state
- Brief loading state during favorite/unfavorite action
- Optimistic update preferred (immediate UI feedback)

### Error state
- 401 error if unauthenticated user tries to favorite
- 404 error if article not found
- Network errors revert optimistic update and show error

### Cancellation/escape
- Click favorite button again to unfavorite (toggle behavior)
- No confirmation needed for either action

## 4) Functional Requirements (What)

### User actions
- Favorite an article
- Unfavorite an article
- View list of articles favorited by a user
- View favorite count on articles

### System behaviors
- Create ArticleFavorite record when user favorites article
- Delete ArticleFavorite record when user unfavorites
- Calculate and return favorite count for each article
- Include favorited status in article objects (relative to current user)
- Filter articles by users who favorited them

### Inputs
- **Slug** (required): Article slug to favorite/unfavorite
- **Favorited** (query parameter): Username to filter articles they favorited

### Outputs
- **Article object**: Includes favorited boolean and favoritesCount
- **Favorited status**: True if current user favorited, false otherwise
- **Favorites count**: Integer count of total favorites

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- User must be authenticated to favorite
- Article must exist
- User can only favorite each article once

### Business rules
- Favoriting is idempotent (favoriting again has no effect)
- Unfavoriting non-favorited article has no effect
- Favorite count is computed from ArticleFavorite records
- Favorited status is user-specific (not global)

### Permissions rules
- **Authenticated users**: Can favorite/unfavorite any article
- **Guest users**: Can view favorite counts, cannot favorite
- **All users**: Can view favorited article lists on profiles

### Edge cases
- Favoriting already-favorited article: No-op or returns existing state
- Unfavoriting non-favorited article: No-op
- Favoriting deleted article: 404 error
- Concurrent favorites from same user: Should handle gracefully (single favorite)

### Safety checks
- Toggle behavior prevents accidental multiple favorites
- No confirmation needed (easily reversible action)

## 6) Data & Lifecycle (What)

### Data created/updated
- **ArticleFavorite record**: Created on favorite, deleted on unfavorite
- **Person-Article association**: Many-to-many relationship via ArticleFavorite

### Retention
- Favorite records persist indefinitely
- Favorites removed when article is deleted (cascade)
- Favorites may be removed when user is deleted (cascade)

### Deletion behavior
- Unfavoriting deletes ArticleFavorite record (hard delete)
- Article deletion cascades to remove all its favorites
- User deletion likely cascades to remove their favorites

### History/audit expectations (if any)
- No timestamp on favorites (creation time not tracked)
- No history of favorite/unfavorite actions
- Only current state (favorited or not) is stored
