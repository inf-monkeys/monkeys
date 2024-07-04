# 🐳 Docker Compose

This folder contains 3 `docker-compose` file:

- `docker-compose.yaml`: Include `server`, `ui` and `nginx`,
- `docker-compose-middleware.yaml`: All required middlewares, like `postgres`, `redis` and `conductor`.
- `docker-compose-tenancy-config.yaml`: Multi tenancy version of `docker-compose.yaml`.

> If you are using Docker Desktop for Mac or Windows, Change the Memory limit to at least 12 GB, or conductor may failed to start.

## 🚀 Quick Start

1. Go to `docker` folder

    ```sh
    cd docker
    ```

2. Modify `config.yaml` if you want at `docker/server/config/server-config.yaml`

3. Start docker-compose

    ```sh
    docker-compose -f docker-compose.yaml -f docker-compose-middleware.yaml up -d
    ```

4. By default `docker-compose.yaml` set `nginx` ports to `80:80`, so you can visit the service at `http://localhost`. Or you can change to any port you want.

5. Stop

    ```sh
    docker-compose -f docker-compose.yaml -f docker-compose-middleware.yaml down
    ```

## 🚀 Only Middleware

1. Go to `docker` folder

    ```sh
    cd docker
    ```

2. Start docker-compose

    ```sh
    docker-compose -f docker-compose-middleware.yaml up -d
    ```

3. Stop

    ```sh
    docker-compose down
    ```

## 🚀 Multi tenancy Version

### Confuguration

Modify config values at [server-multi-tenancy-config.yaml](./server/config/server-multi-tenancy-config.yaml):

- Add tenant servers here: 

```yaml
servers:
  - appId: monkeys
    host: infmonkeys.local.com
    customization:
      title: Monkeys
      logo: https://static.aside.fun/static/vines.svg
      favicon: https://static.infmonkeys.com/upload/favicon.svg

  - appId: some-awesome-service
    host: some-awesome-service.local.com
    customization:
      title: My Awesome App
      logo: http://example.com/logo.png
      favicon: http://example.com/favicon.ico
```

- Other configurations is the same.

### Start Docker Compose

1. Go to `docker` folder

    ```sh
    cd docker
    ```

2. Start multi-tenancy version docker-compose by

    ```sh
    docker-compose -f docker-compose.yaml -f docker-compose-multi-tenancy.yaml up -d --build
    ```

3. By default `docker-compose.yaml` set `nginx` ports to `80:80`, so you can visit the service at `http://localhost`. Or you can change to any port you want.

4. Stop

    ```sh
    docker-compose -f docker-compose.yaml -f docker-compose-multi-tenancy.yaml down
    ```
