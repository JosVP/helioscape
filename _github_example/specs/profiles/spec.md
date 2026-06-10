<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Profiles
Kebab-case: `profiles`

## 1) Goal (Why)

### Problem statement
Users need a public identity page to showcase their content, build their personal brand, and connect with readers and other authors in the community.

### Who feels it most
Content creators wanting to establish credibility and build an audience, plus readers discovering authors and exploring their content history.

### Desired outcome
Every user has a public profile page displaying their information, authored articles, and favorited articles, making it easy for others to learn about them and explore their contributions.

### Success criteria
- All users have a public profile accessible via username URL
- Profile displays user information: username, bio, profile image
- Profile shows authored articles and favorited articles in separate tabs
- Profile displays follow status for current user
- Profile is viewable by all users (authenticated and guest)

### Non-goals / out of scope
- Private profiles or privacy settings
- Profile statistics (total articles, followers count, etc.)
- Profile customization or themes
- Social links or external profiles
- Activity feed or timeline

## 2) Users & Access (What)

### Target users/personas
- All users (profile owners, visitors, authenticated, guests)
- Authors showcasing their work
- Readers discovering content and authors

### Eligibility
- **View profile**: All users (no authentication required)
- **Edit profile**: Profile owner only (via Settings page)
- **Follow profile**: Authenticated users only

### Visibility
- All profiles are publicly visible
- Profile information visible to everyone
- Following status shown to authenticated users
- Guest users see all profile content without auth-specific features

### Where it lives
- Profile page: /#/@username or /#/@username/favorites
- Accessible from article bylines, comment authors, anywhere username appears

### How to reach it
- Primary entry point: Click username link anywhere in app
- Secondary entry points:
  - Direct URL navigation
  - Author byline on articles
  - Comment author names
  - Navigation to own profile

## 3) User Experience & Flow (What)

### Happy path
1. User clicks username link (on article, comment, etc.)
2. System loads profile page for that username
3. Page displays user info: avatar, username, bio
4. "My Articles" tab shows user's authored articles by default
5. User can switch to "Favorited Articles" tab
6. Follow button available if viewing another user's profile (authenticated)

### Key screens/states
- Profile header: User avatar, username, bio, follow/edit button
- My Articles tab: List of articles authored by user
- Favorited Articles tab: List of articles favorited by user
- Edit Profile button (only for own profile, links to Settings)

### Empty state
- Profile with no articles: "No articles are here... yet."
- Profile with no favorites: "No articles are here... yet."

### Loading state
- Profile page shows loading indicator while fetching data
- Article lists show loading state

### Error state
- 404 error if username not found
- Network errors show error message
- Empty profile data handled gracefully

### Cancellation/escape
- User can navigate away freely
- No forms or actions to cancel on profile view itself

## 4) Functional Requirements (What)

### User actions
- View any user's profile by username
- View user's authored articles
- View user's favorited articles
- Follow/unfollow user (authenticated users)
- Navigate to edit profile settings (own profile only)

### System behaviors
- Fetch and display user profile by username
- Filter articles by author for "My Articles" tab
- Filter articles by favorited user for "Favorited Articles" tab
- Include following status in profile (relative to current user)
- Return profile with user information and following status

### Inputs
- **Username** (required): Profile username to display
- **Tab filter**: "author" or "favorited" to filter article list

### Outputs
- **Profile object**: username, bio, image, following status
- **Article lists**: Separate lists for authored and favorited articles
- **Following status**: Boolean indicating if current user follows this profile

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- Username must exist in system
- Profile route format: /@username

### Business rules
- All profiles are public (no privacy controls)
- Default tab is "My Articles" (authored)
- Articles ordered by creation date descending
- Following status is user-specific (not global)
- Profile owner sees "Edit Profile Settings" button instead of follow

### Permissions rules
- **All users**: Can view any profile and article lists
- **Authenticated users**: Can follow/unfollow profiles
- **Profile owner**: Sees edit button, not follow button on own profile
- **Guest users**: Can view but not follow

### Edge cases
- Non-existent username: 404 error
- Empty authored articles: Shows empty state message
- Empty favorited articles: Shows empty state message
- Viewing own profile: Shows edit button instead of follow
- Profile for deleted user: 404 error

### Safety checks
- Cannot follow own profile (edit button shown instead)
- Profile viewing is read-only (no destructive actions)

## 6) Data & Lifecycle (What)

### Data created/updated
- **Profile view**: Read-only display of Person record
- **No data created**: Profile page only reads existing data
- **Profile updates**: Happen via Settings page, not profile page

### Retention
- Profiles persist as long as user account exists
- No separate lifecycle from user account

### Deletion behavior
- Profile is deleted when user account is deleted
- Profile page returns 404 for deleted users

### History/audit expectations (if any)
- No audit trail on profile views
- No tracking of who viewed profile
- Profile changes tracked via user account updates
