# OpenShelfRating

Monorepo base for the MVP defined in the SDD specifications.

## Structure
- `backend/`: Java 21 + Spring Boot API
- `web/`: React + Vite + TypeScript frontend
- `mobile/`: Android app with React Native (Expo)
- `contracts/openapi/`: OpenAPI 3.1 contracts
- `infra/`: docker-compose and local configuration
- `.agent-workspace/`: SDD governance, context and specs

## Quick Start
1. Start local infrastructure:
```powershell
podman compose -f infra/docker-compose.yml up -d
```
Running services:
| Service | URL / Connection | Username | Password | Notes |
|---|---|---|---|---|
| PostgreSQL | `localhost:5432` | `osr_user` | `osr_password` | DB: `openshelfrating` |
| MinIO API (S3) | http://localhost:9000 | `minioadmin` | `minioadmin` | Bucket: `openshelfrating-media` |
| MinIO Console | http://localhost:9001 | `minioadmin` | `minioadmin` | Web administration UI |

## Environment Variables (Backend)
| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/openshelfrating` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `osr_user` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | `osr_password` | PostgreSQL password |
| `APP_AUTH_JWT_EXPIRATION_HOURS` | `24` | JWT RS256 expiration in hours |
| `APP_AUTH_VERIFICATION_EXPIRATION_HOURS` | `24` | Email verification token expiration in hours |
| `APP_AUTH_BASE_URL` | `http://localhost:8080` | Base URL used in verification links |
| `APP_AUTH_JWT_PRIVATE_KEY_PEM` | *(empty)* | RSA private key PEM for JWT signing (optional in local) |
| `APP_AUTH_JWT_PUBLIC_KEY_PEM` | *(empty)* | RSA public key PEM for JWT verification (optional in local) |
| `SPRING_MAIL_HOST` | `localhost` | SMTP host for verification emails |
| `SPRING_MAIL_PORT` | `1025` | SMTP port for local MailHog/MailDev |
| `SPRING_MAIL_USERNAME` | *(empty)* | SMTP username |
| `SPRING_MAIL_PASSWORD` | *(empty)* | SMTP password |
| `SPRING_MAIL_SMTP_AUTH` | `false` | Enables SMTP authentication |
| `SPRING_MAIL_SMTP_STARTTLS_ENABLE` | `false` | Enables STARTTLS |
| `APP_MAIL_FROM` | `no-reply@openshelfrating.local` | Sender email used for auth notifications |
| `APP_CATALOG_SEARCH_MAX_PAGE_SIZE` | `100` | Maximum allowed page size for catalog search endpoint |
| `APP_CATALOG_ISBN_VALIDATION_STRICT` | `true` | Enables strict ISBN-10/13 checksum validation during book creation |
| `APP_MEDIA_ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | Allowed MIME types for avatar and cover uploads |
| `APP_MEDIA_MAX_AVATAR_SIZE` | `5242880` | Max avatar upload size in bytes (5MB) |
| `APP_MEDIA_MAX_COVER_SIZE` | `10485760` | Max cover upload size in bytes (10MB) |
| `APP_MEDIA_PRESIGNED_URL_EXPIRY_HOURS` | `24` | Presigned URL validity in hours |
| `APP_MEDIA_CACHE_MAX_AGE_SECONDS` | `86400` | Cache-Control max-age for media retrieval responses |
| `APP_MEDIA_AVATAR_PLACEHOLDER_URL` | `https://placehold.co/256x256?text=avatar` | Placeholder URL returned when user avatar is missing/deleted |
| `APP_MEDIA_COVER_PLACEHOLDER_URL` | `https://placehold.co/512x768?text=cover` | Placeholder URL returned when book cover is missing/deleted |
| `APP_MEDIA_S3_BUCKET_NAME` | `openshelfrating-media` | S3/MinIO bucket used for media objects |
| `APP_MEDIA_S3_REGION` | `us-east-1` | AWS region used by S3 client and presigner |
| `APP_MEDIA_S3_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint (MinIO in local development) |
| `APP_MEDIA_S3_ACCESS_KEY` | `minioadmin` | S3 access key |
| `APP_MEDIA_S3_SECRET_KEY` | `minioadmin` | S3 secret key |

2. Start backend (requires JDK 21):
```powershell
cd backend
.\gradlew.bat bootRun
```
Available endpoints:
| Endpoint | URL | Username | Password | Notes |
|---|---|---|---|---|
| REST API | http://localhost:8080 | — | — | API root (JWT required on protected endpoints) |
| Health / metrics | http://localhost:8080/actuator | — | — | Spring Boot Actuator |
| Health check | http://localhost:8080/actuator/health | — | — | Application status |

3. Start web frontend:
```powershell
cd web
npm run dev
```
Access:
| Service | URL | Username | Password | Notes |
|---|---|---|---|---|
| Web app | http://localhost:5173 | — | — | Vite default port; authentication via OAuth2/API |

4. Start mobile (Android):
```powershell
cd mobile
npm run android
```
Access: launches directly on the connected Android emulator or device. Expo Metro bundler available at http://localhost:8081.

## Scaffolding status
- Backend Spring Boot 4.1: created with **Gradle 8.14.3 + Wrapper**
- Initial OpenAPI contract: created (`contracts/openapi/openshelfrating.v1.yaml`)
- Web React + Vite: created
- Mobile Expo: created
- Infra PostgreSQL + MinIO: created
