<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Comments
Kebab-case: `comments`

## 1) Goal (Why)

### Problem statement
Readers need a way to discuss articles, ask questions, and provide feedback to authors and other readers, fostering community engagement and conversation around content.

### Who feels it most
Active readers who want to engage with content and authors seeking feedback and discussion on their articles.

### Desired outcome
Users can easily add comments to articles, view all comments on an article, and delete their own comments when needed, creating threaded discussions.

### Success criteria
- Users can post comments on any article
- Comments display with author information and timestamp
- Comment authors can delete their own comments
- All users can view comments on articles
- Comments are displayed in chronological order

### Non-goals / out of scope
- Editing comments after posting
- Nested/threaded comment replies
- Comment reactions or voting
- Comment moderation or reporting
- Markdown or rich text in comments
- Comment notifications

## 2) Users & Access (What)

### Target users/personas
- Authenticated users posting comments
- All users (authenticated and guest) reading comments
- Comment authors managing their comments

### Eligibility
- **Create comment**: Authenticated users only
- **View comments**: All users (no authentication required)
- **Delete comment**: Only the comment author

### Visibility
- All comments are publicly visible on article pages
- Guest users see all comments but cannot post
- Unauthenticated users see prompts to sign in to comment

### Where it lives
- Article detail page: Comments section below article content

### How to reach it
- Primary entry point: Comment form at bottom of article page (authenticated users)
- Secondary entry points: Comments list displayed below article content

## 3) User Experience & Flow (What)

### Happy path
1. User views article and scrolls to comments section
2. Authenticated user enters comment text in form
3. User clicks "Post Comment" button
4. Comment appears immediately in comments list
5. Comment shows author profile, timestamp, and delete button (for author)

### Key screens/states
- Article page comments section: Comment form and list of comments
- Comment card: Displays author avatar, username, comment text, timestamp, and delete button

### Empty state
- Article with no comments: Empty comments list, form still available for authenticated users
- Comment form placeholder: "Write a comment..."

### Loading state
- Comments section shows loading indicator while fetching
- New comment submission shows brief loading state

### Error state
- Validation error if comment body is empty
- 404 error if article not found
- 403 error if non-author tries to delete comment
- Network errors show error message

### Cancellation/escape
- User can clear comment text before posting
- No auto-save or draft storage
- Comments cannot be edited after posting (only delete and re-post)

## 4) Functional Requirements (What)

### User actions
- Create comment on article
- View all comments for an article
- Delete own comment
- View comment author profile

### System behaviors
- Store comment with article reference and author reference
- Generate unique comment ID
- Record creation timestamp
- Display comments in chronological order (oldest first based on typical implementation)
- Include author profile information with each comment
- Return comments as list for article

### Inputs
- **Slug** (required): Article slug to comment on
- **Body** (required): Comment text content
- **Comment ID** (required for delete): Integer identifier

### Outputs
- **Comment object**: id, body, createdAt, author (username, bio, image, following status)
- **Comments list**: Array of comment objects for an article

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- Comment body must not be null or empty
- Comment must be associated with valid article
- Article slug must exist

### Business rules
- Comments are ordered by creation time
- Comment ID is auto-generated sequential integer
- No character limit specified on comment body
- Deletion is immediate and permanent

### Permissions rules
- **Authenticated users**: Can create comments on any article
- **Guest users**: Can view all comments, cannot create or delete
- **Comment authors**: Can delete their own comments only
- **Non-authors**: Cannot delete comments they didn't create

### Edge cases
- Commenting on deleted article: Should return 404
- Deleting already-deleted comment: Should return 404
- Multiple rapid comments from same user: All accepted
- Empty comment body: Validation error

### Safety checks
- Delete button only shown to comment author
- No confirmation modal for delete (immediate action)

## 6) Data & Lifecycle (What)

### Data created/updated
- **Comment record**: Created when posted
- **CreatedAt timestamp**: Set on creation
- **Article-Comment association**: Foreign key relationship

### Retention
- Comments persist indefinitely unless explicitly deleted
- Comments deleted when parent article is deleted (cascade)

### Deletion behavior
- Hard delete: Comment removed from database permanently
- No soft delete or archive
- Deletion cascades when article is deleted

### History/audit expectations (if any)
- CreatedAt timestamp shows when comment was posted
- No edit history (editing not supported)
- No "modified by" or audit trail
