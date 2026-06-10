<!--
Feature specs live at: .github/specs/<kebab-case-name>/spec.md
Write in brief sentences. Prefer specific, testable wording.
-->

# Feature: Users
Kebab-case: `users`

## 1) Goal (Why)

### Problem statement
Users need secure account creation and authentication to participate in the platform, personalize their experience, and establish their identity for creating and interacting with content.

### Who feels it most
New users wanting to join the platform and existing users managing their account credentials and profile information.

### Desired outcome
Users can easily register new accounts, securely log in and out, maintain persistent sessions via JWT tokens, and update their profile settings.

### Success criteria
- Users can register with email, username, and password
- Users can log in with email and password
- Users receive JWT token for authenticated requests
- Users can update their profile information (username, email, bio, image, password)
- Users can log out and revoke their session
- Authentication persists across page refreshes via localStorage

### Non-goals / out of scope
- Social login (OAuth, SSO)
- Two-factor authentication
- Password reset/recovery flow
- Email verification
- Account deletion
- Password strength requirements
- Rate limiting on login attempts

## 2) Users & Access (What)

### Target users/personas
- New users creating accounts
- Existing users logging in
- Authenticated users managing settings
- All users accessing public content without authentication

### Eligibility
- **Register**: Anyone (no existing account required)
- **Login**: Users with account credentials
- **Update settings**: Authenticated users (own account only)
- **View content**: All users (authentication optional)

### Visibility
- Registration and login pages publicly accessible
- Settings page visible only to authenticated users
- Logout button visible in navigation when authenticated
- "Sign in/Sign up" links visible to guest users

### Where it lives
- Authentication pages: /#/login and /#/register
- Settings page: /#/settings
- Navigation bar: User menu and logout button

### How to reach it
- Primary entry points:
  - "Sign in" and "Sign up" links in navigation
  - Settings link in user menu
  - Logout button in navigation
- Secondary entry points:
  - Redirects to login when attempting authenticated actions
  - Links between login and register pages

## 3) User Experience & Flow (What)

### Happy path - Registration
1. User navigates to register page
2. User enters username, email, and password
3. User clicks "Sign up" button
4. System creates account and returns JWT token
5. User automatically logged in and redirected to home page
6. Token stored in localStorage for persistence

### Happy path - Login
1. User navigates to login page
2. User enters email and password
3. User clicks "Sign in" button
4. System validates credentials and returns JWT token
5. User logged in and redirected to home page
6. Token stored in localStorage

### Happy path - Settings Update
1. Authenticated user navigates to settings page
2. User updates username, email, bio, image URL, or password
3. User clicks "Update Settings" button
4. System updates user record and returns updated user data
5. User logged out and must re-login with new credentials if changed
6. User redirected to profile page

### Key screens/states
- Login page: Email and password input fields
- Register page: Username, email, and password input fields
- Settings page: Form with username, email, bio, image, password fields
- Navigation: Shows user menu when authenticated

### Empty state
- Settings form pre-populated with current user data

### Loading state
- Form submit buttons show loading state
- "Signing in..." or "Updating..." button text

### Error state
- Validation errors displayed above form
- 422 errors for validation failures (duplicate username/email, invalid credentials)
- Network errors show error message
- Invalid credentials: "Email or password is invalid"

### Cancellation/escape
- User can navigate away from auth forms without submitting
- Settings changes not saved unless "Update Settings" clicked
- No auto-save or draft storage

## 4) Functional Requirements (What)

### User actions
- Register new account
- Log in to existing account
- Log out and clear session
- View current user information
- Update user settings (username, email, bio, image, password)

### System behaviors
- Create user record on registration
- Hash and store passwords securely
- Generate and return JWT token on successful auth
- Validate credentials on login
- Update user record on settings change
- Store JWT in localStorage on client
- Include JWT in Authorization header for authenticated requests
- Return user object with token

### Inputs
- **Registration**: username (required), email (required), password (required)
- **Login**: email (required), password (required)
- **Update Settings**: username (optional), email (optional), bio (optional), image (optional), password (optional)

### Outputs
- **User object**: email, username, bio, image, token (JWT)
- **JWT token**: Encoded authentication token with user information
- **Error messages**: Validation errors or authentication failures

## 5) Rules, Constraints, and Edge Cases (What)

### Validation rules
- Email must be valid email format
- Username must be unique
- Email must be unique
- Password must not be empty (no strength requirements specified)
- All fields required for registration
- Email and password required for login

### Business rules
- JWT token includes user information and expiration
- Token stored in localStorage persists across sessions
- Logout clears token from localStorage
- Settings update logs user out if credentials changed
- Username changes reflected across all user content (articles, comments)
- Bio and image are optional fields

### Permissions rules
- **Unauthenticated users**: Can register and login
- **Authenticated users**: Can update own settings, logout
- **All users**: Cannot access other users' settings

### Edge cases
- Duplicate username on registration: 422 validation error
- Duplicate email on registration: 422 validation error
- Invalid email format: 422 validation error
- Wrong password on login: 422 authentication error
- Non-existent email on login: 422 authentication error
- Expired JWT token: 401 unauthorized error
- Token in localStorage but expired: Automatic logout
- Concurrent updates from same user: Last write wins

### Safety checks
- Password hashing prevents plaintext storage
- JWT expiration prevents indefinite sessions
- Settings update requires re-authentication after credential change
- Logout button easily accessible
- No confirmation on logout (immediate action)

## 6) Data & Lifecycle (What)

### Data created/updated
- **Person/User record**: Created on registration
- **Username, Email, Bio, Image**: Updated via settings
- **Password hash**: Created on registration, updated on password change
- **JWT token**: Generated on login/registration (not stored server-side in stateless JWT)

### Retention
- User accounts persist indefinitely
- JWT tokens expire based on configured expiration time
- No automatic account cleanup or archival

### Deletion behavior
- No explicit account deletion feature specified
- User data persists unless manually deleted via database
- Logout only clears client-side token, not account

### History/audit expectations (if any)
- No audit trail of login/logout events
- No password change history
- No tracking of settings updates
- No "last login" timestamp stored
