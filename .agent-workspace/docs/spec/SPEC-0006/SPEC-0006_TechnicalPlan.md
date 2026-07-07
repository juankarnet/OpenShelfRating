# Technical Plan: SPEC-0006 - Frontend Navigation & Dashboard Implementation

## 1. Technical Overview
This plan translates SPEC-0006 functional requirements into implementation tasks across frontend (React/Vite) and backend (Spring Boot API extensions). The core work involves:
- Refactoring web/App.tsx into a multi-page SPA with React Router v6
- Installing TanStack Query v5 for server state management
- Creating page components (Login, Dashboard, Library, Profile, Settings, Help, AddBook)
- Implementing reusable UI components (Navigation, BookCard, Pagination, StatsCards)
- Backend extensions: pagination/search endpoints, library statistics aggregation
- Frontend session persistence logic (30-day localStorage tokens, rate-limiting)

## 1.1 Execution Status (2026-07-07)
**Spec Sync:** In Progress (code implementation completed; runtime/integration validation pending) (Last Sync: 2026-07-07)
**Completed:**
- Frontend phases 1-9 implemented (routing, dashboard/library, profile, add-book, settings/help).
- Post-phase frontend hardening delivered (book card interactivity + base modal component).
- Profile/media integration completed in frontend and aligned with SPEC-0006 profile workflows.
- Backend API extension work for SPEC-0006 started and partially delivered (DTO alignment + state/review endpoints).

**Pending:**
- Backend runtime stabilization and compile/test verification in Java 21 environment.
- Frontend dev runtime stabilization for local validation environment.
- Integration and E2E validation evidence for acceptance closure.

**Current Plan State:**
- Implementation is in progress.
- This technical plan remains active until validation evidence is recorded and SPEC-0006 is formally closed.

## 2. Architecture Changes

### 2.1 Frontend Structure (web/)
**Current State:**
- Router-based SPA architecture is implemented and active.
- Page/component modularization is in place (dashboard, library, profile, add-book, settings, help).
- Auth/session persistence, query hooks, and modal workflows are implemented at code level.

**Target State:**
```
web/src/
  ├── App.tsx                    (Router setup, layout wrapper)
  ├── main.tsx                   (Entry point, React 18 strict mode)
  ├── pages/
  │   ├── LoginPage.tsx
  │   ├── DashboardPage.tsx
  │   ├── LibraryPage.tsx
  │   ├── ProfilePage.tsx
  │   ├── AddBookPage.tsx
  │   ├── SettingsPage.tsx
  │   └── HelpPage.tsx
  ├── components/
  │   ├── Layout/
  │   │   ├── Header.tsx
  │   │   ├── UserMenu.tsx
  │   │   └── MainLayout.tsx
  │   ├── Library/
  │   │   ├── BookCard.tsx
  │   │   ├── BookList.tsx
  │   │   ├── PaginationControls.tsx
  │   │   ├── SearchFilter.tsx
  │   │   └── StatsSection.tsx
  │   ├── Forms/
  │   │   ├── LoginForm.tsx
  │   │   ├── AddBookForm.tsx
  │   │   └── ProfileEditForm.tsx
  │   ├── Modals/
  │   │   ├── ChangeStateModal.tsx
  │   │   ├── RateBookModal.tsx
  │   │   └── ConfirmDialog.tsx
  │   └── Common/
  │       ├── ErrorBoundary.tsx
  │       └── LoadingSpinner.tsx
  ├── hooks/
  │   ├── useAuth.ts             (Auth context + hooks)
  │   ├── useLibrary.ts          (TanStack Query hooks for library)
  │   ├── usePagination.ts       (Pagination state management)
  │   └── useSessionPersistence.ts (localStorage token management)
  ├── services/
  │   ├── authService.ts         (Login, logout, token refresh)
  │   ├── libraryService.ts      (API calls via generated client)
  │   └── catalogService.ts      (Book catalog API)
  ├── context/
  │   ├── AuthContext.tsx        (JWT, user info, session)
  │   └── SessionPersistenceContext.tsx
  ├── types/
  │   ├── auth.ts
  │   ├── library.ts
  │   ├── pagination.ts
  │   └── shared.ts
  ├── utils/
  │   ├── sessionStorage.ts      (localStorage helpers, expiry logic)
  │   ├── rateLimit.ts           (Failed login attempt tracking)
  │   └── formatters.ts          (Date, rating display helpers)
  ├── App.css
  └── index.css
```

### 2.2 Backend API Extensions (SPEC-0006 support)
**Current Gaps (Remaining for closure):**
- Runtime validation evidence for backend endpoints is not yet captured in the current local environment.
- End-to-end verification evidence for dashboard/library flows against backend is pending.
- Any residual API contract mismatches must be verified during closure testing.

**Required Backend Changes:**
1. **Pagination in Library Listing:**
   - Endpoint: `GET /api/library?page=0&size=10&state=READING&search=title`
   - Response: `{ totalPages, totalElements, content: [UserBook], currentPage }`
   - Query params: `page` (0-indexed), `size` (default 10), `state` (optional), `search` (optional text search on title/author).

2. **Library Statistics Endpoint:**
   - Endpoint: `GET /api/library/stats`
   - Response: `{ totalBooks, stateDistribution: { PENDING, READING, READ }, averageRating }`
   - Cached per user; invalidated on library mutations (add/remove/state-change/review).

3. **Book Metadata Enrichment:**
   - `UserBookResponse` DTO should include: `book: { id, title, author, isbn13, cover: { url: presignedUrl } }`, `state`, `rating`, `opinion`, `reviewUpdatedAt`.

**Tasks:**
- [ ] Extend `UserLibraryController.listLibrary()` to accept pagination + search params; delegate to service.
- [ ] Add `UserLibraryController.getLibraryStats()` endpoint.
- [ ] Extend `UserLibraryService` to support paginated query with filters/search; implement `SearchLibraryRequest` DTO.
- [ ] Cache stats (e.g., Redis or Spring Cache); invalidate on library mutations.
- [ ] Write integration tests for pagination, search, stats aggregation.

## 3. Frontend Dependencies & Setup

### 3.1 Packages to Install
```bash
# Navigation & state management
npm install react-router-dom@^6
npm install @tanstack/react-query@^5

# Optional UI/styling enhancements (if not already present)
npm install clsx classnames  # CSS class merging utilities
npm install date-fns         # Date formatting (if needed for session expiry display)

# Already present (verify in package.json):
# - axios (for HTTP client)
# - React 18+, Vite, TypeScript
```

**Status:** Installed and already present in `web/package.json` (React 19 + React Router + TanStack Query + axios + clsx + date-fns).

**Update web/package.json:**
```json
{
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^6",
    "@tanstack/react-query": "^5",
    "axios": "^1.x"
  }
}
```

### 3.2 Vite Configuration Update
No changes required; React Router works with Vite out-of-the-box. History mode SPA routing handled via `react-router-dom`.

## 4. Implementation Plan (Sequenced Tasks)

### Phase 1: Foundation Setup
**Tasks:**
1. Install dependencies (react-router-dom, @tanstack/react-query).
2. Create folder structure (pages/, components/, hooks/, services/, context/, types/, utils/).
3. Create AuthContext.tsx with user state + token management.
4. Create useAuth() custom hook for convenient context access.
5. Create useSessionPersistence() hook for localStorage token persistence (30-day expiry logic).
6. Create sessionStorage.ts utilities (save/load/clear token with expiry).
7. Create rateLimit.ts utilities (track failed login attempts in localStorage).

### Phase 2: Layout & Navigation
**Tasks:**
1. Create MainLayout.tsx wrapper component (Header + Outlet for page routing).
2. Create Header.tsx with logo/branding + UserMenu dropdown placeholder.
3. Create UserMenu.tsx component (menu options: Home, Profile, Add Book, Settings, Help, Logout).
4. Create App.tsx with React Router setup:
   - Route definitions: `/`, `/login`, `/dashboard`, `/library`, `/profile`, `/add-book`, `/settings`, `/help`.
   - Route guards: ProtectedRoute HOC redirects unauthenticated users to `/login`.
   - Unauthenticated users see Login & Help; authenticated users see Dashboard and others.
5. Update App.css with Flexbox layout for header, sidebar (if used), main content area.

### Phase 3: Authentication Pages
**Tasks:**
1. Create LoginPage.tsx component (form: email + password).
2. Create LoginForm.tsx (form handling, error display, submit).
3. Integrate login API call + token persistence (AuthContext + useSessionPersistence).
4. Implement rate-limiting logic: track failed attempts in localStorage; show 2-min cooldown after 10 failures.
5. Create 404 page or redirect logic for unknown routes.

### Phase 4: Dashboard & Library Views
**Tasks:**
1. Create DashboardPage.tsx (layout: stats section + book list with pagination).
2. Create StatsSection.tsx component (displays: total books, state distribution, avg rating).
3. Create BookCard.tsx component (layout: cover thumbnail + title + author + state badge + rating + action buttons).
4. Create BookList.tsx component (renders BookCard array).
5. Create PaginationControls.tsx (prev/next buttons, page display, page number selector).
6. Create SearchFilter.tsx (search input + state filter dropdown).
7. Create LibraryPage.tsx (full library view; reuse BookList + Pagination + SearchFilter from Dashboard).
8. Set up TanStack Query hooks:
   - `useLibraryBooks(page, size, state, search)`: fetches paginated library list.
   - `useLibraryStats()`: fetches statistics.
   - Implement mutations: `useMutateBookState()`, `useMutateReview()`, `useRemoveBook()`.

### Phase 5: User Profile & Settings
**Tasks:**
1. Create ProfilePage.tsx (display: avatar, name, email; edit button).
2. Create ProfileEditForm.tsx (edit: name, avatar upload, save/cancel).
3. Create SettingsPage.tsx (placeholder sections: Account Settings, Notifications, Display Preferences).
4. Implement profile API calls + mutation hooks.

### Phase 6: Add Book & Modals
**Tasks:**
1. Create AddBookPage.tsx or AddBookModal.tsx.
2. Create AddBookForm.tsx (fields: ISBN, title, author, publisher, language; search existing catalog first).
3. Create ChangeStateModal.tsx (modal to select reading state transition; confirm/cancel).
4. Create RateBookModal.tsx (modal to rate + write opinion; save/cancel).
5. Create ConfirmDialog.tsx reusable modal (logout confirmation, delete confirmation, etc.).

### Phase 7: Help & Documentation
**Tasks:**
1. Create HelpPage.tsx (static/hardcoded content or fetched from CMS).
2. Sections: Overview, Library Management, Reading Lifecycle, Ratings, Profile/Media, Account Security.
3. Responsive layout for text + placeholder areas for future screenshots/videos.

### Phase 8: Error Handling & Polish
**Tasks:**
1. Create ErrorBoundary.tsx (catch React errors, display fallback UI).
2. Create LoadingSpinner.tsx (reusable loading indicator).
3. Implement error states for API failures (network errors, auth failures, 404, 500).
4. Add toast notifications or snackbar for user feedback (success, error, info).
5. Responsive design pass: test on mobile (480px), tablet (768px), desktop (1024px+).
6. Accessibility review: keyboard navigation, ARIA labels, screen reader compat.

### Phase 8.1: Visual Asset & Iconography Consistency (Front)
**Tasks:**
1. Use representative action icons on existing buttons and actionable texts whenever possible (edit, save, delete, search, add, cancel, upload, logout, navigation).
2. Keep text labels visible together with icons for accessibility and clarity.
3. Centralize icon rendering in a reusable frontend component to avoid duplicated ad-hoc symbols.
4. Use project image `images/icon.jpg` as application icon source (header brand icon + favicon via `web/public/app-icon.jpg`).
5. Use project image `images/background.png` as a very light global background layer (`web/public/app-background.png`) with high-opacity overlay to preserve readability.
6. Maintain an image inventory in `images/INVENTORY.md` with asset name, role, and usage path.

#### Visual UX TODO (Delta 2026-07-07)
**Scope:** Frontend visual polish and icon/readability consistency for Add Book + Book Detail flows.

- [x] Replace ad-hoc/emoticon actions with reusable SVG icon set and stronger stroke visibility in shared icon component.
- [x] Apply icon-only action pattern with custom hover tooltip behavior in main actionable controls.
- [x] Fix detail modal reading-state/review action wiring via stable service layer contract to avoid state transition failures.
- [x] Extend search-result selected-card flow to include initial reading state and optional review (stars + short comment when `READ`).
- [x] Compact selected-card visual layout (content + reading panel + action controls) and move inline styles into dedicated Add Book CSS.
- [ ] Improve reading-panel contrast and typographic hierarchy for faster scan on low-contrast displays.
- [ ] Add lightweight visual feedback on successful state/review save (inline success hint/toast) without blocking flow.

**Traceability:** REQ-017, REQ-018, AC-016, AC-017; integration dependency with SPEC-0004 reading lifecycle endpoints.

### Phase 9: Integration Testing & Validation
**Tasks:**
1. Write Vitest unit tests for components (BookCard, PaginationControls, etc.).
2. Write integration tests: login flow → dashboard → library navigation → logout.
3. Test session persistence: save token, reload page, verify session restored.
4. Test rate-limiting: 10 failed logins, verify 2-min block.
5. Test pagination: navigate pages, verify data loads.
6. Test search/filter: verify results update and pagination resets.
7. E2E test critical user paths (Detox for mobile, Playwright/Cypress for web if available).

## 5. Backend Implementation Tasks (Java/Spring Boot)

### 5.1 API Endpoint Extensions
**File: `backend/src/main/java/com/openshelfrating/backend/api/UserLibraryController.java`**
- [ ] Modify `listLibrary()` to accept: `page`, `size`, `state` (PENDING/READING/READ/null), `search` (text filter).
- [ ] Return paginated response with: `totalPages`, `totalElements`, `currentPage`, `content: [UserBook]`.
- [ ] Add `getLibraryStats()` endpoint returning stats DTO.

**File: `backend/src/main/java/com/openshelfrating/backend/service/UserLibraryService.java`**
- [ ] Implement `findUserLibraryPaginated(userId, page, size, state, search)` method.
- [ ] Implement `getUserLibraryStats(userId)` method.
- [ ] Use Spring Data repository with custom `@Query` or Specification for dynamic filtering.

**File: `backend/src/main/java/com/openshelfrating/backend/domain/UserBookResponse.java`** (DTO)
- [ ] Ensure response includes: book metadata (id, title, author, ISBN, cover presigned URL), reading state, rating, opinion, timestamps.

**File: `backend/src/main/java/com/openshelfrating/backend/repository/UserBookRepository.java`**
- [ ] Add custom query methods for paginated search/filter (Spring Data `Page<T>` support).
- [ ] Example: `Page<UserBook> findByUserIdAndStateContaining(Long userId, String state, Pageable pageable)`.

### 5.2 Caching & Performance (Optional but Recommended)
- [ ] Add Spring Cache abstraction for stats; invalidate on library mutations.
- [ ] Use `@Cacheable` on `getUserLibraryStats()` and `@CacheEvict` on add/remove/state-change endpoints.

### 5.3 Integration Tests
- [ ] Testcontainers test for pagination with mock data.
- [ ] Test search/filter with various inputs (empty results, partial matches, case-insensitive).
- [ ] Test stats aggregation (total, state counts, average rating).
- [ ] Verify API responses match OpenAPI schema (SPEC-0006 contract).

### 5.4 Validation & Constraints
- [ ] Validate `page` ≥ 0, `size` > 0 and ≤ 100 (prevent abuse).
- [ ] Validate `state` is valid enum value or null (wildcard).
- [ ] Validate `search` length ≤ 256 chars.

## 6. Integration Points with Backend APIs

### 6.1 API Endpoints Used by Frontend
| Endpoint | Method | Purpose | SPEC |
|----------|--------|---------|------|
| `/auth/login` | POST | Authenticate user | SPEC-0001 |
| `/auth/register` | POST | Register new user | SPEC-0001 |
| `/users/{id}/profile` | GET/PUT | View/edit profile | SPEC-0001 |
| `/library` | GET | List user library (paginated) | SPEC-0006 (new) |
| `/library/stats` | GET | Get library statistics | SPEC-0006 (new) |
| `/library/{bookId}/state` | PUT | Transition reading state | SPEC-0004 |
| `/library/{bookId}/review` | POST/PUT | Create/update review | SPEC-0004 |
| `/library/{bookId}` | DELETE | Remove book from library | SPEC-0003 |
| `/catalog/search` | GET | Search global catalog | SPEC-0002 |
| `/catalog` | POST | Create new catalog entry | SPEC-0002 |
| `/media/avatar/upload` | POST | Upload user avatar | SPEC-0005 |
| `/media/avatar/{userId}/access` | GET | Get avatar presigned URL | SPEC-0005 |
| `/media/cover/upload` | POST | Upload book cover | SPEC-0005 |
| `/media/cover/{bookId}/access` | GET | Get cover presigned URL | SPEC-0005 |

### 6.2 OpenAPI Client Generation
- Regenerate OpenAPI client stubs for TypeScript after backend API changes.
- Update `web/src/api.ts` to reflect new endpoints (pagination, stats, media URLs).

## 7. Session Persistence & Rate Limiting Logic

### 7.1 Token Persistence (sessionStorage.ts)
```typescript
// Save token with 30-day expiry
saveToken(token: string): void {
  const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  localStorage.setItem('osr_token', token);
  localStorage.setItem('osr_token_expiry', expiryTime.toString());
}

// Load token if not expired
loadToken(): string | null {
  const token = localStorage.getItem('osr_token');
  const expiry = localStorage.getItem('osr_token_expiry');
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry)) {
    localStorage.removeItem('osr_token');
    localStorage.removeItem('osr_token_expiry');
    return null;
  }
  return token;
}

// Clear token
clearToken(): void {
  localStorage.removeItem('osr_token');
  localStorage.removeItem('osr_token_expiry');
}
```

### 7.2 Failed Login Attempt Tracking (rateLimit.ts)
```typescript
// Track failed attempts
recordFailedLogin(): number {
  const key = 'osr_failed_logins';
  const attempts = JSON.parse(localStorage.getItem(key) || '[]');
  const now = Date.now();
  const thirtyMinutesAgo = now - 30 * 60 * 1000;
  
  // Filter attempts older than 30 mins
  const recentAttempts = attempts.filter((t: number) => t > thirtyMinutesAgo);
  recentAttempts.push(now);
  localStorage.setItem(key, JSON.stringify(recentAttempts));
  
  return recentAttempts.length;
}

// Check if account locked
isAccountLocked(): boolean {
  const key = 'osr_login_locked_until';
  const lockedUntil = localStorage.getItem(key);
  if (!lockedUntil) return false;
  
  const now = Date.now();
  if (now > parseInt(lockedUntil)) {
    localStorage.removeItem(key);
    localStorage.removeItem('osr_failed_logins');
    return false;
  }
  return true;
}

// Lock account for 2 mins after 10 failed attempts
lockAccount(): void {
  const lockDuration = 2 * 60 * 1000; // 2 minutes
  const lockedUntil = Date.now() + lockDuration;
  localStorage.setItem('osr_login_locked_until', lockedUntil.toString());
}

// Get remaining lock time in seconds
getRemainingLockTime(): number {
  const key = 'osr_login_locked_until';
  const lockedUntil = localStorage.getItem(key);
  if (!lockedUntil) return 0;
  
  const remaining = Math.max(0, (parseInt(lockedUntil) - Date.now()) / 1000);
  return Math.ceil(remaining);
}
```

## 8. File Checklist & Dependencies

### 8.1 Files to Create (Frontend)
```
web/src/
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    LibraryPage.tsx
    ProfilePage.tsx
    AddBookPage.tsx
    SettingsPage.tsx
    HelpPage.tsx
  components/
    Layout/Header.tsx
    Layout/UserMenu.tsx
    Layout/MainLayout.tsx
    Library/BookCard.tsx
    Library/BookList.tsx
    Library/PaginationControls.tsx
    Library/SearchFilter.tsx
    Library/StatsSection.tsx
    Forms/LoginForm.tsx
    Forms/AddBookForm.tsx
    Forms/ProfileEditForm.tsx
    Modals/ChangeStateModal.tsx
    Modals/RateBookModal.tsx
    Modals/ConfirmDialog.tsx
    Common/ErrorBoundary.tsx
    Common/LoadingSpinner.tsx
  hooks/
    useAuth.ts
    useLibrary.ts
    usePagination.ts
    useSessionPersistence.ts
  services/
    authService.ts
    libraryService.ts
    catalogService.ts
  context/
    AuthContext.tsx
  types/
    auth.ts
    library.ts
    pagination.ts
    shared.ts
  utils/
    sessionStorage.ts
    rateLimit.ts
    formatters.ts
```

### 8.2 Files to Modify (Frontend)
```
web/src/
  App.tsx                    → Router setup, MainLayout wrapper
  main.tsx                   → Ensure React 18 strict mode
  App.css                    → Global layout + responsive styles
  package.json               → Add react-router-dom, @tanstack/react-query
```

### 8.3 Files to Create/Modify (Backend)
```
backend/src/main/java/com/openshelfrating/backend/
  api/
    UserLibraryController.java    → Add pagination + stats endpoints
  service/
    UserLibraryService.java       → Implement paginated search + stats logic
  domain/
    UserBookResponse.java         → Ensure complete DTO with media URLs
  repository/
    UserBookRepository.java       → Add custom query methods for filtering
```

## 9. Configuration & Environment Variables

### 9.1 Frontend .env (if needed)
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SESSION_EXPIRY_DAYS=30
VITE_LOGIN_MAX_ATTEMPTS=10
VITE_LOGIN_LOCKOUT_MINUTES=2
```

### 9.2 Backend application.properties
No new environment variables required for SPEC-0006. Existing backend config sufficient.

## 10. Testing & QA Checklist

### 10.1 Unit Tests (Vitest)
- [ ] BookCard component renders with correct data.
- [ ] PaginationControls buttons disabled/enabled correctly.
- [ ] SearchFilter input onChange updates parent state.
- [ ] StatsSection computes averages correctly.
- [ ] LoginForm validates password strength.
- [ ] sessionStorage.ts save/load/clear logic.
- [ ] rateLimit.ts tracks attempts, lockout, unlock correctly.

### 10.2 Integration Tests
- [ ] Login flow: enter credentials → API call → token saved → redirect to dashboard.
- [ ] Session restore: close app → reload → dashboard displays without re-login (within 30 days).
- [ ] Rate limiting: 10 failed logins → 2-min lockout → countdown displayed → lockout expires → can retry.
- [ ] Dashboard: fetch stats + paginated library → render components → verify data matches API response.
- [ ] Pagination: page 1 → next → page 2 → verify book data updated.
- [ ] Search: enter text → API filtered results → pagination resets to page 1.
- [ ] State transition: click "Change State" → modal → select state → confirm → state updated in list + stats refreshed.
- [ ] Profile: view/edit name → save → changes reflected on reload.

### 10.3 E2E Tests (Detox/Playwright)
- [ ] Full user journey: login → dashboard → add book → view library → logout.
- [ ] Navigation: access all pages from user menu.
- [ ] Mobile responsiveness: test on 480px, 768px, 1024px viewports.

### 10.4 Acceptance Criteria Sign-Off
- [ ] AC-001..AC-015 from SPEC-0006.md verified by QA.

## 11. Deployment & Rollout

### 11.1 Build & Bundle
```bash
npm run build   # Vite build: TypeScript compile + bundle
npm run preview # Local preview of production build
```

### 11.2 Backend Deployment
- Deploy updated Spring Boot JAR with pagination/stats endpoints.
- Ensure database migration scripts (Flyway) already applied (SPEC-0001..0005).
- Verify API health check: `GET /health` returns 200 OK.

### 11.3 Frontend Deployment
- Build React SPA via `npm run build`.
- Deploy to CDN or static hosting (Vercel, Netlify, S3 + CloudFront, etc.).
- Ensure SPA routing fallback (index.html served for all routes except API).
- Configure CORS if API on different domain.

### 11.4 Post-Deployment Validation
- [ ] Login flow works end-to-end.
- [ ] Session persistence verified.
- [ ] Dashboard loads and displays stats.
- [ ] Pagination, search, filtering functional.
- [ ] Media (avatars, book covers) display correctly.
- [ ] Monitoring: check client-side error logs (Sentry, Datadog, etc.).

## 12. Success Metrics & KPIs

- **Time to Dashboard:** <2s from login (measured from browser dev tools).
- **Pagination Latency:** <500ms for page transitions.
- **Search Response:** <300ms for filter/search updates.
- **Session Restore:** <1s to reload dashboard on app reopen (within 30 days).
- **Error Rate:** <0.5% for 404, API failures, client-side errors (tracked via monitoring).
- **Feature Adoption:** >80% users use search/filter within first week.

---

**Status:** Ready for review and approval before implementation begins.
**Owner:** Frontend Architect, Dev Agent.
**Timeline:** Phases 1-9 estimated 3-4 weeks (full-time 1-2 developers).
