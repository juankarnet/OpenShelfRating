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
