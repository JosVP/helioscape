# Commands 
- Building the backend: `cd backend; dotnet build Conduit.sln`
- Running the backend unit tests: `cd backend; dotnet test tests/Conduit.UnitTests/`
- Building the frontend: `cd frontend; ng build`
- Running the frontend unit tests: `cd frontend; npm test`

# Guardrails
1. Never run the frontend and backend. Instead, run the unit tests to validate the working of the application.
2. Always make sure the backend builds after you have finished building a feature
3. Always make sure the frontend builds after you have finished building a feature
4. Do not run the frontend E2E tests as they will never pass. When you want to run E2E tests, instead run only the unit tests.

# Conduit System Overview

## Purpose

Conduit is a social blogging platform (similar to Medium) that enables users to create, discover, and engage with written content. The platform facilitates community building through user-generated articles, social interactions (following authors, favoriting content), and threaded discussions.

## System Architecture

Conduit is a full-stack web application with:
- **Backend**: .NET/C# API server with relational database
- **Frontend**: Angular SPA with standalone components and client-side routing
- **Authentication**: JWT-based stateless authentication
- **Data Storage**: Relational database with Entity Framework

## Core Capabilities

Conduit is a social blogging platform where authenticated users create markdown articles (title, description, body, tags) identified by auto-generated slugs. Articles are discovered via a global feed (all articles, newest first) or personalized feed (followed authors only), with filtering by tags, authors, or favorites using pagination (default 20 per page). Users have public profiles showing authored and favorited articles, and can follow other users unidirectionally to build their personalized feed. Social engagement includes favoriting articles (toggle bookmarking with count tracking) and posting flat chronological comments. All content is publicly viewable by guests, but creation, modification, and social actions require JWT authentication (tokens in localStorage). Users own their content—only article authors can edit/delete articles, only comment authors can delete comments. The system uses hard deletes with cascading relationships (deleting articles removes favorites, tags, comments), many-to-many joins for favorites/follows/tags, and idempotent operations. Tags are free-form text created on-demand and displayed by popularity. The architecture is .NET/Entity Framework backend with auto-applying migrations, Angular SPA frontend with client-side routing, stateless JWT auth, and no soft deletes, versioning, or audit trails.

## Database Migrations
- **When to add**: Add a migration whenever you change the Entity Framework model, alter DB schema (tables, columns, indexes, constraints), or introduce seed data that the app depends on.
- **How they're applied**: Migrations are applied automatically on application startup (the backend runs pending EF migrations at boot). Developers should still create and commit migrations so environments start with a consistent schema.

## Non-Functional Characteristics

### State Management
- Client-side: JWT token in localStorage
- Server-side: Stateless (no session storage)
- No draft saving or auto-save
- No optimistic offline support

### User Experience
- No confirmation dialogs for easily reversible actions
- Immediate feedback for interactive elements (buttons, toggles)
- Loading indicators for async operations
- Clear empty states guide users
- Validation errors shown inline above forms

### Content Handling
- Article body supports markdown (no rich text editor)
- No content moderation or reporting
- No spam prevention or rate limiting
- Tags are free-form text (no validation or normalization)
- No character limits specified for content fields

## Development Guidelines

### When Adding Features
1. **Authentication**: Check if feature requires authenticated user vs public access
2. **Permissions**: Determine if user can only modify own content or has broader access
3. **Cascade Behavior**: Define what happens when related entities are deleted
4. **Validation**: Specify required fields and validation rules
5. **Empty States**: Define behavior when lists or collections are empty
6. **Error Handling**: Specify error states and user-facing messages

### When Modifying Existing Features
1. **Check Specifications**: Reference feature spec in `.github/specs/<feature>/spec.md`
2. **Maintain Contracts**: Preserve API contracts and data structures
3. **Cascade Impact**: Consider effects on related features (e.g., articles → comments, favorites, tags)
4. **User Experience**: Maintain consistency with existing UX patterns
5. **Data Integrity**: Ensure referential integrity and cascade behaviors remain intact

### Testing Considerations
1. **Guest vs Authenticated**: Test all features for both user types
2. **Permissions**: Verify users can only modify their own content
3. **Empty States**: Test behavior with no data
4. **Edge Cases**: Test boundary conditions (e.g., favoriting already-favorited article)
5. **Cascade Deletes**: Verify related records clean up properly

### Backend Unit Testing

1. **Mandatory**: All backend validators and handlers must have unit tests in `backend/tests/Conduit.UnitTests/`
2. **Framework**: Use xUnit, FluentAssertions, Moq, and Entity Framework InMemory database
3. **Organization**: Mirror feature structure from `backend/src/Conduit/Features/` (e.g., `Features/Articles/CreateHandlerTests.cs`)
4. **Naming**: `<Command/Query>ValidatorTests.cs` for validators, `<Command/Query>HandlerTests.cs` for handlers, test methods use `Should_ExpectedBehavior_When_Condition`
5. **Validators**: Test all validation rules with valid/invalid inputs using `FluentValidation.TestHelper` and `TestValidate()` method
6. **Handlers**: Test happy paths, error conditions, business logic, database interactions, and cascade behavior
7. **Test Structure**: Use Arrange-Act-Assert pattern, one test class per validator/handler, create base classes for shared setup
8. **Mocking**: Mock external dependencies like `ICurrentUserAccessor` using Moq, use InMemory database for data access
9. **Coverage**: Aim for 80%+ coverage on business logic, skip only trivial code (DTOs, getters/setters)
10. **Run**: Execute with `dotnet test backend/tests/Conduit.UnitTests/` or through IDE test explorers

### Backend Integration Testing

1. **Location**: Place integration tests in `backend/tests/Conduit.IntegrationTests/`.
2. **Purpose**: Verify end-to-end feature behavior using the application's startup pipeline and data access layers.
3. **Framework**: Prefer xUnit with `FluentAssertions`; use `Microsoft.AspNetCore.TestHost`/`WebApplicationFactory` or a test database to exercise the real pipeline. Mock external dependencies as needed.
4. **Run**: Execute integration tests with:

   `dotnet test backend/tests/Conduit.IntegrationTests/ --verbosity minimal`

5. **Notes**: Run integration tests separately from unit tests. Ensure test data isolation and cleanup between runs to keep results deterministic.

### Frontend Unit Testing
1. Frontend unit test must be written for services
2. **Co-location**: All frontend unit tests must be co-located with the source files they test
   - Place test files in the same directory as the source file
   - Example: `components/button.component.ts` → `components/button.component.spec.ts`
3. **Naming Convention**: Use `*.spec.ts` naming format for all test files
4. **Test Runner**: Frontend tests use Vitest (run with `npm run test`)

## Relevant Locations

- Feature specifications: `.github/specs/<feature>/spec.md`
- Backend source: `backend/src/Conduit/`
- Frontend source: `frontend/src/`
- Unit tests: `backend/tests/Conduit.UnitTests/`
- Integration tests: `backend/tests/Conduit.IntegrationTests/`
