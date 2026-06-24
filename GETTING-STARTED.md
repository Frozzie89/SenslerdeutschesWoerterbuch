# Getting Started

The application consists of multiple more or less independent parts. For each part you can find more detailed information in the Markdown files inside the directories.

## Architecture Overview

### Frontend

Angular with Angular Material is used for the Frontend. See `./frontend/`.

### Reverse Proxy & Routing

Traefik is used as a reverse proxy to:

- Serve the frontend application
- Route API requests to the backend
- Handle domain-based routing (backend.localhost, frontend.localhost)
- Manage SSL/TLS certificates in production

### Backend

Django is used for the admin interface and API. See `./admin-app/`.

### Search & Data Storage

OpenSearch is used for full-text search and document storage. PostgreSQL is used for relational data. Both are automatically initialized when services start.

### Parsing

The data for the dictionary is only available as semi-structured CSV or PDFs used for printing. Python scripts are used to parse those files to make them compatible and searchable with OpenSearch. [Read more](./parsing/README.md)

## Testing

Angular unit tests can be run normally. Just make sure you have Chrome available.

```
cd frontend
ng test
```

E2e tests are using Playwright.

```
cd e2e
npm install
npx playwright install --with-deps
npx playwright test
```

If running the local docker setup, use the following command.

```
docker compose --profile test run --rm e2e
```

GitHub Actions are used to run the tests automatically. To test and debug them locally we suggest using https://github.com/nektos/act. After downloading the binary you can use it with a simple command.

```
bin/act --secret-file .env
```

## Deploying

### Automated deployment (recommended)

Deployment is handled by the [`Build, push & deploy`](.github/workflows/build-and-deploy.yml)
GitHub Action:

- **On a pull request to `main`** : a dry-run builds all images to verify the
  Dockerfiles compile. Nothing is pushed or deployed.
- **When a PR is merged to `main`** : the action builds the `opensearch`,
  `django` and `frontend` images, pushes them to ACR as `:latest` and
  `:<commit-sha>`, then instructs the `qa` VM to `docker compose pull` and
  recreate the stack.

No manual steps are required for a normal release, just merge to `main`.

### Manual deployment (fallback)

If you need to deploy by hand (e.g. the action is unavailable), build and push
the images, then have the VM pull them.

Authenticate and build/push:

```
az acr login --name seislerduetscheswoerterbuech

docker build -t seislerduetscheswoerterbuech.azurecr.io/opensearch:latest -f docker/opensearch/Dockerfile . --no-cache
docker build -t seislerduetscheswoerterbuech.azurecr.io/django:latest -f docker/admin-app/Dockerfile . --no-cache
docker build -t seislerduetscheswoerterbuech.azurecr.io/frontend:latest -f docker/public-app/Dockerfile . --no-cache

docker push seislerduetscheswoerterbuech.azurecr.io/opensearch:latest
docker push seislerduetscheswoerterbuech.azurecr.io/django:latest
docker push seislerduetscheswoerterbuech.azurecr.io/frontend:latest
```

Recreate the stack on the VM — either via the Azure CLI (no SSH key needed):

```
az vm run-command invoke \
  --resource-group rg-SeislerdeutschesWoerterbuech-prod \
  --name qa \
  --command-id RunShellScript \
  --scripts "cd /home/azureuser/woerterbuech && docker compose pull && docker compose up -d --remove-orphans"
```

... or over SSH:

```
ssh azureuser@<qa-vm-ip>
cd /home/azureuser/woerterbuech
docker compose pull && docker compose up -d --remove-orphans
```
