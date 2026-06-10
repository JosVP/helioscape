# Frontend Implementation Checklist

## Component Layer
- [ ] Create new standalone components in `frontend/src/app/shared/components/` or `frontend/src/app/features/<feature>/components/`
- [ ] Implement component with `@Component` decorator and explicit imports
- [ ] Modify existing components as needed

## Pages & Routing
- [ ] Create new page components in `frontend/src/app/features/<feature>/pages/`
- [ ] Add routes to `frontend/src/app/app.routes.ts`
- [ ] Apply route guards if needed (`authGuard`, `guestGuard`)
- [ ] Update navigation components if adding menu items

## State Management
- [ ] Create services for data fetching and state management in `frontend/src/app/core/services/` or feature-specific services
- [ ] Use Angular signals for reactive state
- [ ] Use RxJS observables for async operations
- [ ] Provide services at appropriate level (root or component)
- [ ] Update authentication service if auth state changes needed

## Data Models
- [ ] Create or modify TypeScript interfaces in `frontend/src/app/core/models/` or feature-specific models
- [ ] Define request and response types

## API Integration
- [ ] Create or update API services using Angular `HttpClient`
- [ ] Define typed interfaces for API requests/responses
- [ ] Use HTTP interceptors for authentication headers if needed
- [ ] Return observables for async operations

## Forms & Validation
- [ ] Implement forms with Angular Reactive Forms
- [ ] Add client-side validators
- [ ] Handle server validation errors (422 responses)

## UI/UX
- [ ] Add styles to `frontend/src/styles.css` or component-specific style files
- [ ] Implement loading, empty, and error states using signals
- [ ] Add accessibility attributes (aria-labels, keyboard navigation)
- [ ] Use `@rx-angular/template` directives for optimized rendering if needed

## Configuration
- [ ] Update `package.json` and run `npm install` if adding dependencies

---

# Backend Implementation Checklist

## Domain Layer
- [ ] Create or modify entities in `backend/src/Conduit/Domain/`
- [ ] Update `ConduitContext.cs` with new `DbSet`s and entity configuration
- [ ] Define relationships and cascade delete behaviors in `OnModelCreating`

## Feature Implementation
- [ ] Create a feature folder and implement handlers in `backend/src/Conduit/Features/<FeatureName>/`
- [ ] Implement FluentValidation validators for all request models
- [ ] Create DTOs and response models
- [ ] Create controller endpoints and apply `[Authorize]` to protected routes

## Infrastructure
- [ ] Create new services in `backend/src/Conduit/Infrastructure/` if needed
- [ ] Register services in `ServicesExtensions.cs`
- [ ] Update `Program.cs` if middleware or auth changes are required

## Configuration
- [ ] Update `Conduit.csproj` and `Directory.Packages.props` if adding NuGet packages

## Validation
- [ ] Build solution: `dotnet build backend/Conduit.sln`
- [ ] Run all tests: `dotnet test backend/Conduit.sln`