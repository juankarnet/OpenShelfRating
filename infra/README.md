# Infra

Local stack services:
- PostgreSQL: localhost:5432
- MinIO API: localhost:9000
- MinIO Console: localhost:9001

## Start
```powershell
podman compose -f infra/docker-compose.yml up -d
```

## Stop
```powershell
podman compose -f infra/docker-compose.yml down
```

## Notes
- MinIO bucket `openshelfrating-media` is auto-created.
- Default local credentials are only for development.
