# UI Admin Docker Build

This directory contains the Docker configuration for the Monkeys Admin UI.

## Build and Run

### Build the Docker image

```bash
# From the project root
docker build -f docker/ui-admin/Dockerfile -t monkeys-ui-admin .
```

### Run with Docker

```bash
docker run -p 3001:3001 monkeys-ui-admin
```

### Run with Docker Compose

```bash
# From docker/ui-admin directory
docker-compose up -d
```

## Configuration

The admin UI connects to the API server through the `/api` proxy path. In production, you should configure nginx or another reverse proxy to handle:

- `/admin/*` → ui-admin static files
- `/api/*` → backend server

## Environment Variables

The build accepts the following build arguments:

- `GIT_COMMIT_HASH`: Git commit hash (default: dev)
- `GIT_TAG`: Git tag version (optional)

Example:

```bash
docker build \
  --build-arg GIT_COMMIT_HASH=$(git rev-parse HEAD) \
  --build-arg GIT_TAG=$(git describe --tags) \
  -f docker/ui-admin/Dockerfile \
  -t monkeys-ui-admin .
```

## Ports

- `3001`: Admin UI server port

## Technology Stack

- Node.js 22 Alpine
- Vite (build tool)
- React + TypeScript
- TanStack Router
- Tailwind CSS
- Radix UI components
