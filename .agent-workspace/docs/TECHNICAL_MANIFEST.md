# Living Document: Technical Project Manifest

## 1. System Architecture & Topology
*   **Architecture Pattern:** Hexagonal/Clean Architecture with domain-driven design; monolithic backend service (scalable vertically for MVP; horizontal sharding deferred to Phase 2).
*   **Deployment Target:** Docker containers + cloud-native (12-factor principles); K8s optional for future scale.
*   **System Components:**
	*   `backend-api`: Java 21 + Spring Boot 3.x monolith -> User, Book Catalog, Library, Review, Media management; OpenAPI REST interface.
	*   `database`: PostgreSQL 15+ -> Primary persistence, ACID compliance, full-text search; Flyway schema versioning.
	*   `media-store`: S3-compatible object storage -> Avatar images, book cover images; MinIO local dev, AWS S3 production.
	*   `web-client`: React 18 + Vite SPA -> User-facing interface, library management, reading lifecycle; OpenAPI-generated client.
	*   `mobile-client`: React Native (Expo) -> Android native app, feature parity with web, camera/device integration.

## 2. Core Technology Stack
*   **Backend Ecosystem:**
	*   *Language/Runtime:* Java 21 LTS
	*   *Framework:* Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security, Spring Cloud AWS)
	*   *Build Tool:* Maven (multi-module structure)
*   **Frontend Stack:** React 18 + Vite + TypeScript; React Router for navigation; TanStack Query for server state; Axios/openapi-generated client.
*   **Mobile Stack:** React Native (Expo) + TypeScript; same API client as web; EAS Build for automated compilation.
*   **Database & Persistence:** PostgreSQL 15+; Hibernate JPA + Spring Data repositories; Flyway migrations.
*   **Media & Storage:** Spring Cloud AWS S3 abstraction (local MinIO in dev, S3 in prod).
*   **Integration Protocols:** REST OpenAPI 3.1 (auto-generated); OAuth 2.0/OIDC (Google, Apple, Microsoft); JWT RS256 token signing.

## 3. Specialized Agent Allocation & Skills
*   **dev_agent Role:** Senior Full-Stack Java/Spring + Frontend (React + React Native); enforces code generation boundaries, OpenAPI contract-first, domain isolation.
*   **qa_agent Test Suite:** JUnit 5 + Testcontainers (backend); Vitest + React Testing Library (web); Detox (mobile); Spring Cloud Contract for API verification.
*   **External Integrations:** Google Cloud OAuth 2.0, Apple Sign-In, Microsoft Identity Platform; media storage via S3 API.
*   **Architecture Enforcement:** Hexagonal boundaries per Spring modules; domain logic isolated from Spring; repository pattern for data access.

## 4. Infrastructure & CI/CD Pipelines
*   **Local Dev Sandbox:** Docker Compose (PostgreSQL, MinIO, backend Spring Boot app); React Vite dev server; React Native Expo CLI.
*   **Test Execution:** Backend: `mvn test` (unit) + `mvn verify` (integration with Testcontainers); Web: `npm run test` (Vitest); Mobile: `npm run test:e2e` (Detox).
*   **Build & Containerization:** Multi-stage Dockerfile for Java app; slim base images; non-root user execution.
*   **Quality Gates:** Backend unit ≥80% coverage (JaCoCo), all business rules integration-tested; Frontend ≥70% component coverage; E2E critical paths automated; zero high-severity security issues; OpenAPI schema validation.
*   **CI/CD Stages:** Lint → Build → Unit Test → Integration Test → Contract Test → Build Artifact (Docker image) → Push to Registry → Deploy staging → E2E on staging → Deploy production.