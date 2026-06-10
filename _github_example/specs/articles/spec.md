<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Articles
Kebab-case: `articles`

## 1) Goal (Why)

### Problem statement
Users need a way to create, publish, and share written content with the community to build their knowledge base and engage with other readers and writers.

### Who feels it most
Content creators, bloggers, and thought leaders who want to share their expertise, ideas, and stories with a wider audience on the Conduit platform.

### Desired outcome
Users can easily create, edit, publish, and manage articles with rich content, organize them with tags, and have them discovered by interested readers through feeds and filtering.

### Success criteria
- Users can create and publish articles with title, description, and body content
- Articles appear in global feed and author's profile
- Authors can edit and delete their own articles
- Articles can be filtered by tag, author, or favorited status
- Authenticated users can view personalized feed of articles from followed authors

### Non-goals / out of scope
- Rich text formatting editor (articles use markdown)
- Article drafts or auto-save functionality
- Article versioning or revision history
- Scheduled publishing
- Article categories beyond tags

## 2) Users & Access (What)

### Target users/personas
- Authenticated writers creating content
- All users (authenticated and guest) reading articles
- Followers viewing personalized article feeds

### Eligibility
- **Create/Edit/Delete**: Authenticated users only
- **View**: All users (no authentication required for reading)
- **Delete/Edit**: Only the article author

### Visibility
- All published articles are publicly visible
- Guest users see all articles but cannot create, edit, or delete
- Unauthenticated users see "Sign in or Sign up" prompts for author actions

### Where it lives
- Home page: Global feed and personalized feed
- Article page: Individual article view
- Editor page: Article creation and editing interface
- Profile page: User's authored articles

### How to reach it
- Primary entry point: "New Article" button in navigation (authenticated users)
- Secondary entry points: 
  - Article titles in feed lists
  - Edit button on article page (for authors)
  - Profile page article list

## 3) User Experience & Flow (What)

### Happy path
1. User clicks "New Article" in navigation
2. User enters title, description, body content, and optional tags
3. User clicks "Publish Article"
4. System creates article with unique slug from title
5. User redirected to article detail page
6. Article appears in global feed and author's profile

### Key screens/states
- Editor page: Form with title, description, body, and tag inputs
- Article detail page: Displays full article with metadata, comments section
- Home page: List of article previews with pagination
- Profile page: Author's articles and favorited articles tabs

### Empty state
- Home feed with no articles: "No articles are here... yet."
- Profile with no articles: "No articles are here... yet."
- Tag filter with no matches: Returns empty articles list

### Loading state
- Article list shows loading indicator while fetching
- Article detail page shows loading indicator
- Pagination updates show brief loading state

### Error state
- Validation errors appear above form for missing required fields (title, description, body)
- 404 error if article slug not found
- 403 error if non-author tries to edit/delete article
- Network errors show generic error message

### Cancellation/escape
- User can navigate away from editor without confirmation (no auto-save)
- In-progress article creation is lost if user navigates away
- Editing preserves original article if user cancels

## 4) Functional Requirements (What)

### User actions
- Create new article with title, description, body, and tags
- Edit existing article (author only)
- Delete article (author only)
- View article details
- List articles with filters (tag, author, favorited)
- View personalized feed (authenticated users following others)
- Navigate paginated article lists

### System behaviors
- Generate unique slug from article title
- Store creation and update timestamps
- Return articles ordered by creation date (newest first)
- Filter articles by tag, author, or favorited username
- Apply pagination with configurable limit and offset
- Include article metadata: author profile, favorite count, favorited status, tag list

### Inputs
- **Title** (required): String, used to generate slug
- **Description** (required): String, brief summary
- **Body** (required): String, article content in markdown
- **TagList** (optional): Array of strings, article tags
- **Slug** (system-generated): Derived from title on creation
- **Limit** (optional): Number of articles to return (default: 20)
- **Offset** (optional): Pagination offset (default: 0)

### Outputs
- **Article object**: slug, title, description, body, tagList, createdAt, updatedAt, favorited, favoritesCount, author
- **Articles list**: Array of articles with total count
- **Author profile**: username, bio, image, following status

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- Title must not be null or empty
- Description must not be null or empty
- Body must not be null or empty
- Tags are optional but must be strings if provided

### Business rules
- Slug is auto-generated from title on creation
- Articles ordered by createdAt timestamp descending
- Default pagination: 20 articles per page
- Tags are created if they don't exist when article is created
- UpdatedAt timestamp changes on edit

### Permissions rules
- **Authenticated users**: Can create articles, edit/delete own articles
- **Guest users**: Can view all articles, cannot create/edit/delete
- **Article authors**: Full control over their articles
- **Non-authors**: Cannot edit or delete articles they didn't create

### Edge cases
- Duplicate slugs: System should handle slug collision (current implementation may have issues)
- Empty tag list: Valid, creates article without tags
- Filtering by non-existent author/tag: Returns empty list
- Concurrent edits: Last write wins (no conflict resolution)
- Deleted article with existing favorites/comments: Cascade behavior needed

### Safety checks
- Delete action should be intentional (UI shows delete button for authors)
- No confirmation dialog for delete (immediate action)
- Edit preserves article if user doesn't save changes

## 6) Data & Lifecycle (What)

### Data created/updated
- **Article record**: Created on publish, updated on edit
- **ArticleTag records**: Created when tags are associated
- **Slug**: Generated once on creation, not updated
- **Timestamps**: CreatedAt set on creation, UpdatedAt modified on each edit

### Retention
- Articles persist indefinitely unless explicitly deleted by author
- No automatic archival or expiration

### Deletion behavior
- Hard delete: Article and associated ArticleTags removed from database
- Comments on deleted articles are also removed (cascade)
- Favorites on deleted articles are removed (cascade)

### History/audit expectations (if any)
- CreatedAt timestamp shows when article was published
- UpdatedAt timestamp shows last edit time
- No revision history or audit trail of changes
- No "modified by" tracking (only original author can modify)
