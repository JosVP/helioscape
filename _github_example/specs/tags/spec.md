<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Tags
Kebab-case: `tags`

## 1) Goal (Why)

### Problem statement
Users need a way to organize, categorize, and discover articles by topic, making it easier to find relevant content in specific areas of interest.

### Who feels it most
Readers browsing for content on specific topics and authors categorizing their articles for better discoverability.

### Desired outcome
Articles are tagged with relevant topics, and users can filter articles by tag or browse popular tags to discover content that interests them.

### Success criteria
- Authors can add multiple tags when creating/editing articles
- Tags are displayed on article previews and detail pages
- Users can click tags to filter articles by that topic
- Popular tags list shows trending/frequently used tags
- Tag filtering works on global feed and profile pages

### Non-goals / out of scope
- Tag hierarchies or categories
- Tag following or subscriptions
- Tag descriptions or metadata
- Tag moderation or approval
- Private or user-specific tags
- Tag edit suggestions or auto-complete

## 2) Users & Access (What)

### Target users/personas
- Authors tagging their articles for organization
- Readers discovering content by topic
- All users browsing popular tags

### Eligibility
- **Create tags**: Authenticated users creating/editing articles
- **View tags**: All users
- **Filter by tags**: All users

### Visibility
- Tags visible on all articles to everyone
- Popular tags sidebar visible on home page
- Tag filters work for all users (no authentication required)

### Where it lives
- Home page: Popular tags sidebar
- Article preview cards: Tag list below description
- Article detail page: Tag list
- Editor page: Tag input field

### How to reach it
- Primary entry point: Popular tags sidebar on home page
- Secondary entry points:
  - Click tag on article preview/detail
  - Tag input in article editor

## 3) User Experience & Flow (What)

### Happy path
1. User views home page with popular tags sidebar
2. User clicks a tag (e.g., "react")
3. Article feed filters to show only articles with that tag
4. Active tag shows in feed toggle navigation
5. User can click another tag or return to global feed

### Key screens/states
- Home page: Popular tags cloud/list in sidebar
- Article cards: Tag list displayed as clickable pills
- Feed navigation: Active tag shown in tab
- Editor: Tag input field for adding tags to article

### Empty state
- No popular tags: Empty sidebar (unlikely in active system)
- Tag filter with no matches: "No articles are here... yet."

### Loading state
- Tags list loads with brief loading indicator
- Tag filter applies with smooth transition

### Error state
- Network error loading tags: Fails gracefully, sidebar empty
- Invalid tag filter: Returns empty results

### Cancellation/escape
- Click "Global Feed" or another tag to change filter
- No modal or confirmation needed

## 4) Functional Requirements (What)

### User actions
- View all popular tags
- Click tag to filter articles
- Add tags when creating article
- Add/edit tags when editing article
- View tags on articles

### System behaviors
- Return list of all tags used in articles
- Create tag if it doesn't exist when article is tagged
- Associate tags with articles via ArticleTag join table
- Filter articles by tag when requested
- Display tags in order of usage/popularity (implementation-dependent)

### Inputs
- **TagList** (optional): Array of tag strings when creating/editing article
- **Tag** (query parameter): Tag string to filter articles

### Outputs
- **Tags array**: List of all tag strings
- **Article tag list**: Array of tags associated with each article

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- Tags are optional on articles
- Tag strings should not be null or empty if provided
- Tags are case-sensitive or normalized (implementation-dependent)

### Business rules
- Tags are created on-demand when first used
- Tags persist even if no articles use them (implementation-dependent)
- No limit on number of tags per article
- Tags are free-form text (no predefined list)
- Popular tags based on usage frequency

### Permissions rules
- **Authenticated users**: Can create tags via article creation/editing
- **All users**: Can view and filter by tags
- **Guest users**: Can view tags and filter articles

### Edge cases
- Tag with no articles: Should not appear or returns empty list
- Duplicate tags on same article: Should be deduplicated
- Tags with special characters: Handled as-is
- Very long tag names: No specified limit
- Whitespace in tags: Implementation-dependent handling

### Safety checks
- No destructive actions on tags
- Tag creation is implicit (via article tagging)
- No explicit tag deletion (orphaned tags may persist)

## 6) Data & Lifecycle (What)

### Data created/updated
- **Tag record**: Created when first used on article
- **ArticleTag join record**: Created when tag added to article
- **Tag associations**: Updated when article tags edited

### Retention
- Tags persist indefinitely
- Orphaned tags (no articles) may persist (no cleanup specified)

### Deletion behavior
- ArticleTag records deleted when article is deleted (cascade)
- Tags themselves may remain even if unused
- Editing article tags removes old ArticleTag records and creates new ones

### History/audit expectations (if any)
- No timestamp on Tag records
- No audit trail of tag creation or usage
- No tracking of who created tags
