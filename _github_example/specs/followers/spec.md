<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Followers
Kebab-case: `followers`

## 1) Goal (Why)

### Problem statement
Users need a way to stay updated with content from authors they're interested in, creating a personalized experience and building connections within the community.

### Who feels it most
Active readers who want to track specific authors and see their latest content, plus authors building an audience and understanding their reach.

### Desired outcome
Users can follow authors they're interested in, view a personalized feed of articles from followed authors, and see follow counts on profiles.

### Success criteria
- Users can follow and unfollow any profile with one click
- Following status updates immediately in UI
- Personalized "Your Feed" shows articles only from followed authors
- Profile displays following status to current user
- Follow action is reflected across all UI touchpoints (profile, article meta)

### Non-goals / out of scope
- Follower/following lists (who follows whom)
- Mutual following detection
- Follow notifications
- Block or mute functionality
- Follow privacy settings (public/private profiles)

## 2) Users & Access (What)

### Target users/personas
- Authenticated users following authors
- Authors being followed
- Profile visitors viewing following status

### Eligibility
- **Follow/Unfollow**: Authenticated users only
- **View following status**: All users (on profiles)
- **View personalized feed**: Authenticated users who follow others

### Visibility
- Follow button visible on all user profiles
- Following status visible on profiles and article meta
- "Your Feed" tab visible only to authenticated users
- Guest users see prompts to sign in to follow

### Where it lives
- Profile page: Follow button in user info section
- Article detail page: Follow button in article meta (for author)
- Home page: "Your Feed" tab (authenticated users)

### How to reach it
- Primary entry point: Follow button on user profile
- Secondary entry points: 
  - Follow button on article author meta
  - "Your Feed" tab on home page

## 3) User Experience & Flow (What)

### Happy path
1. User views another user's profile or article
2. User clicks "Follow" button
3. Button changes to "Unfollow"
4. Articles from followed user appear in "Your Feed"
5. Profile shows "following" status

### Key screens/states
- Profile page: Follow/Unfollow button in header
- Article meta: Follow button next to author name
- Home page: "Your Feed" tab with filtered articles

### Empty state
- "Your Feed" with no followed users: Shows message or empty state
- Profile showing no following status for guest users

### Loading state
- Brief loading during follow/unfollow action
- Optimistic update preferred (immediate UI feedback)

### Error state
- 401 error if unauthenticated user tries to follow
- 404 error if profile not found
- Network errors revert update and show message

### Cancellation/escape
- Click unfollow to reverse action (toggle behavior)
- No confirmation needed for either action

## 4) Functional Requirements (What)

### User actions
- Follow a user profile
- Unfollow a user profile
- View personalized feed from followed authors
- See following status on profiles

### System behaviors
- Create FollowedPeople record when user follows another
- Delete FollowedPeople record when user unfollows
- Filter articles to show only from followed authors in feed
- Include following status in profile objects (relative to current user)
- Return profile with updated following status

### Inputs
- **Username** (required): Profile username to follow/unfollow
- **IsFeed** (parameter): Boolean flag to request feed from followed authors

### Outputs
- **Profile object**: Username, bio, image, following status
- **Following status**: Boolean indicating if current user follows profile
- **Articles feed**: Filtered list of articles from followed authors

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- User must be authenticated to follow
- Target profile must exist
- User cannot follow themselves

### Business rules
- Following is unidirectional (not mutual)
- Following is idempotent (following again has no effect)
- "Your Feed" only shows articles from followed authors
- Profile following status is user-specific (not global)

### Permissions rules
- **Authenticated users**: Can follow/unfollow any other user
- **Guest users**: Can view profiles, cannot follow
- **All users**: Can see if a profile is followed by current user

### Edge cases
- Following already-followed user: No-op or returns existing state
- Unfollowing non-followed user: No-op
- Following deleted/non-existent profile: 404 error
- Following self: Should be prevented (validation)
- Concurrent follow from same user: Should handle gracefully

### Safety checks
- Toggle behavior prevents accidental multiple follows
- No confirmation needed (easily reversible)
- Cannot follow self (validation rule)

## 6) Data & Lifecycle (What)

### Data created/updated
- **FollowedPeople record**: Created on follow, deleted on unfollow
- **Person-Person association**: Many-to-many relationship via FollowedPeople

### Retention
- Follow relationships persist indefinitely
- Follows may be removed when either user is deleted (cascade)

### Deletion behavior
- Unfollowing deletes FollowedPeople record (hard delete)
- User deletion should cascade to remove all follow relationships (both following and followers)

### History/audit expectations (if any)
- No timestamp on follow relationships
- No history of follow/unfollow actions
- Only current state (following or not) is stored
