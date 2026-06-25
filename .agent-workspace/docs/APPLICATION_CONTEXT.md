# Living Document: Application Functional Context

## 1. System Vision & Value Proposition
*   **Core Problem:** Home users do not have a reliable, centralized and searchable record of their physical books, reading status and personal ratings, which leads to duplicate purchases, poor tracking and fragmented data.
*   **Target Solution:** OpenShelfRating provides a shared global book catalog with personal libraries per user, reading lifecycle tracking, and post-reading ratings/opinions, with fast onboarding via local or social authentication.

## 2. System Capabilities (High Level)
*   **Capability 01: Identity and Access**
	*   *Description:* User registration/login with email-password and social providers (Google, Apple, Microsoft), profile management, and authorization by ownership/admin role.
	*   *Actors Involved:* End User, Administrator.
*   **Capability 02: Global Book Catalog**
	*   *Description:* Search and register books in a unique system-wide catalog with deduplication by canonical identity (ISBN preferred; normalized title-author fallback).
	*   *Actors Involved:* End User, Administrator.
*   **Capability 03: Personal Library Management**
	*   *Description:* Each user maintains a personal library by linking existing books or creating a new catalog entry when missing.
	*   *Actors Involved:* End User.
*   **Capability 04: Reading Lifecycle and Review**
	*   *Description:* Per user-book relation includes reading status (pending, reading, read) and enables rating/opinion only when status is read.
	*   *Actors Involved:* End User.
*   **Capability 05: Media Management**
	*   *Description:* Upload and manage user avatar and book cover images with backend validation and controlled URL serving.
	*   *Actors Involved:* End User, Administrator.

## 3. Strict Business Rules
*   **BR-01:** A book must be unique in the global catalog. Deduplication key is ISBN when available; otherwise use normalized title + primary author.
*   **BR-02:** A user cannot have duplicate entries of the same book in their personal library.
*   **BR-03:** Rating range is 1-5 and can only be created/edited when reading status is `read`.
*   **BR-04:** User accounts are unique by canonical verified email regardless of authentication provider.
*   **BR-05:** Multiple social identities (Google/Apple/Microsoft) can be linked to one user account when email matches and is verified.
*   **BR-06:** If a social provider does not return a verified email, account activation requires additional verification.
*   **BR-07:** Only resource owner or admin can mutate user profile, user-library relations, and personal review data.
*   **BR-08:** Accepted image formats are JPG/PNG/WebP and uploads must pass MIME/size validation in backend.

## 4. System Boundaries & Exclusions
*   **In-Scope:** Web/API-first MVP, Android-ready API consumption, user and admin roles, social and local authentication, unique global catalog, personal libraries, reading states, ratings/opinions, avatar and cover image uploads.
*   **Out-of-Scope:** AI-based book metadata extraction from photos in MVP, advanced recommendation engines, non-book media types, and hard coupling to any single cloud/media provider.
