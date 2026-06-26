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
