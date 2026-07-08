# Technical Plan: SPEC-0008 - Remove Book from Personal Library

## 1. Overview

## 1.1 Execution Status
**Spec Sync:** Implemented (Last Sync: 2026-07-08)


### 1.1 Execution Status
**Spec Sync:** Implemented (backend + frontend core delivered; tests added 2026-07-08)

This document describes the implementation strategy and current delivery state for SPEC-0008 (Remove Book from Personal Library). The feature existed partially in code before formal specification; this plan documents the authoritative technical design.

### 1.2 Delivery Snapshot (2026-07-08)
- Backend delivered:
    - `DELETE /users/{userId}/library/{bookId}` endpoint — `UserLibraryController.removeBook`.
    - Soft-delete logic in `UserLibraryService.removeBookFromLibrary`: sets `deleted_at = now()`, no row is physically deleted.
    - Authorization enforced: owner or admin only (403 otherwise), 404 when no active entry found.
    - Re-add flow (SPEC-0003 REQ-008): reactivates soft-deleted record, resets all fields.
    - `GET /books/{id}/deletion-eligibility` endpoint to evaluate creator-only system deletion eligibility.
    - `DELETE /books/{id}` endpoint to delete catalog book only if creator and zero active library links remain.
    - Unit tests: existing removal tests retained; new catalog deletion tests pending.
- Frontend delivered:
  - BookCard ⋮ menu item "Remove" → `onRemove(bookId)` in Library and Dashboard list flows.
    - `ConfirmActionModal` with book title in message (SPEC-0008 REQ-007).
    - `useRemoveBook` TanStack Query mutation with cache invalidation (books + stats).
    - Success notification (4 s auto-dismiss) and descriptive error with dismiss button (SPEC-0008 REQ-009, REQ-010).
  - Remove action exposed from `BookDetailModal` via optional `onRemove` prop in Library and Dashboard contexts (SPEC-0008 REQ-011).
  - New second confirmation modal after unlink when backend reports eligibility; optional `DELETE /books/{id}` execution on explicit confirmation.

## 2. Architecture & Pattern
*   **Pattern:** Hexagonal/Clean Architecture — consistent with SPEC-0001/0003.
*   **Layer structure:**
    - **Domain:** `UserBook.deletedAt` (soft-delete field, already present from SPEC-0003).
    - **Repository:** `UserBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull` — standard filter.
    - **Service:** `UserLibraryService.removeBookFromLibrary` — authorization + soft-delete.
    - **API:** `UserLibraryController.removeBook` — `DELETE /{userId}/library/{bookId}`, returns 204.
    - **Frontend service:** `removeBookFromLibrary` (fetch + auth header).
    - **Frontend hook:** `useRemoveBook` (TanStack mutation + cache invalidation).
    - **Frontend UX:** `BookCard` menu + `ConfirmActionModal` + `LibraryPage` orchestration + `BookDetailModal` shortcut.

## 3. Implementation Components

### 3.1 Backend

**Controller** (`UserLibraryController`):
```
DELETE /users/{userId}/library/{bookId}
  @PathVariable UUID userId
  @AuthenticationPrincipal UUID principalUserId
  @PathVariable UUID bookId
  → 204 No Content
```

**Service** (`UserLibraryService.removeBookFromLibrary`):
```
1. authorizeAccess(pathUserId, principalUserId)   // 401/403
2. findByUserIdAndBookIdAndDeletedAtIsNull         // 404 if absent
3. activeEntry.setDeletedAt(OffsetDateTime.now())
4. userBookRepository.save(activeEntry)
```

**Domain** (`UserBook`):
- Field `deletedAt: OffsetDateTime` — nullable, set on removal.
- DB column `deleted_at TIMESTAMPTZ` (migration V3).
- Partial unique index `uq_user_books_active_user_book ON user_books(user_id, book_id) WHERE deleted_at IS NULL` ensures single active entry per pair.

### 3.2 Frontend

**Service** (`libraryService.ts`):
```typescript
DELETE {API_BASE_URL}/users/{userId}/library/{bookId}
Authorization: Bearer {token}
→ void (204)
```

**Hook** (`useRemoveBook`):
```typescript
useMutation({
  mutationFn: (bookId) => removeBookFromLibrary(user.userId, bookId, token),
  onSuccess: () => {
    invalidateQueries(libraryKeys.books());
    invalidateQueries(libraryKeys.stats());
  }
})
```

**UX flow:**
```
BookCard ⋮ menu "Remove"  or  BookDetailModal delete button
  → setSelectedBookId + setShowRemoveModal(true)
  → ConfirmActionModal (title / message with book title / isDangerous)
  → confirm → removeMutation.mutateAsync(selectedBookId)
  → success: setRemoveSuccess("…removed…") auto-dismiss 4s
  → failure: setRemoveError(err.message) + dismiss button
  → cache invalidated → list + stats refresh
```

## 4. Implementation Sequence

| Phase | Component | Status |
|-------|-----------|--------|
| 1. Domain | `UserBook.deletedAt` field + DB column (V3 migration) | ✅ Delivered (SPEC-0003) |
| 2. Repository | `findByUserIdAndBookIdAndDeletedAtIsNull` | ✅ Delivered (SPEC-0003) |
| 3. Service | `removeBookFromLibrary` soft-delete + authorization | ✅ Delivered |
| 4. API | `DELETE /users/{id}/library/{bookId}` → 204 | ✅ Delivered |
| 5. Frontend service | `removeBookFromLibrary` fetch | ✅ Delivered |
| 6. Frontend hook | `useRemoveBook` mutation + cache invalidation | ✅ Delivered |
| 7. Frontend UX — BookCard | ⋮ menu "Remove" item | ✅ Delivered |
| 8. Frontend UX — ConfirmModal | Confirmation before delete | ✅ Delivered |
| 9. Frontend UX — Notifications | Success toast + error display (GAP-001, GAP-002) | ✅ Delivered (2026-07-08) |
| 10. Frontend UX — DetailModal | Remove shortcut from book detail in Dashboard/Library | ✅ Delivered (2026-07-08) |
| 11. Unit tests backend | `UserLibraryServiceRemoveTest` (7 tests) | ✅ Delivered (2026-07-08) |
| 12. Integration/E2E tests | Full flow incl. re-add dedup | ⏳ Pending |

## 5. Success Criteria
- ✅ `DELETE /users/{id}/library/{bookId}` returns 204; record soft-deleted.
- ✅ Subsequent `GET /users/{id}/library` excludes deleted record by default.
- ✅ 403 returned for non-owner/non-admin principal.
- ✅ 404 returned when book not in active library.
- ✅ Frontend confirmation modal mandatory before request.
- ✅ Cache invalidated on success; list and stats refresh without reload.
- ✅ Success notification visible; error message descriptive.
- ✅ Remove accessible from both BookCard menu and BookDetailModal in Dashboard and Library pages.
- ✅ 7 unit tests green (`UserLibraryServiceRemoveTest`).
- ⏳ Integration/E2E evidence pending.

## 6. Risks & Open Items

| Item | Type | Status |
|------|------|--------|
| Re-add resets reading history without warning | Risk (UX) | Known gap — warning text in ConfirmModal deferred |
| Generic error message in `removeBookFromLibrary` service | Gap (REQ-010 partial) | Service throws generic message; propagation to UI now done but server message not parsed |
| No integration tests for full delete→re-add flow (Dashboard + Library paths) | Coverage gap | Deferred to E2E sprint |

## 7. Testing Evidence
- `./gradlew.bat test --tests com.openshelfrating.backend.library.service.UserLibraryServiceRemoveTest --rerun-tasks` ✅
- `npx tsc -b --noEmit` ✅

### Test Coverage Summary
| Test | AC | Result |
|------|----|--------|
| `shouldSoftDeleteActiveUserBook_whenOwnerRemoves` | AC-001 | ✅ |
| `softDeleteTimestamp_shouldBeRecentlyNow` | AC-001 | ✅ |
| `shouldThrow403_whenNonOwnerNonAdminAttempsRemoval` | AC-003 | ✅ |
| `shouldAllowRemoval_whenAdminRemovesOwnerBook` | AC-003 | ✅ |
| `shouldThrow404_whenBookNotFoundInActiveLibrary` | AC-004 | ✅ |
| `shouldThrow401_whenPrincipalUserNotFoundInSystem` | AC-004 | ✅ |
| `shouldNeverCallDelete_onlySetDeletedAt` | RULE-001 | ✅ |
