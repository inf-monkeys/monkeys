# Docker Compose

## Components

| Component          | Description                                                                                    | Image                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `server`           | Monkeys Server redis                                                                           | `monkeys`                                               |
| `ui`               | Monkeys UI                                                                                     | `monkeys-ui`                                            |
| `conductor-server` | [Conductor Server](https://github.com/inf-monkeys/conductor), A workflow orchestration engine. | `nfmonkeys/conductor`                                   |
| `redis`            | Redis Cache                                                                                    | `redis:6.2.3-alpine`                                    |
| `elasticsearch`    | Elasticsearch, to store conductor workflow executions.                                         | `docker.elastic.co/elasticsearch/elasticsearch:7.17.11` |
| `postgres`         | Postgres Database                                                                              | `postgres`                                              |
| `nginx`            | Nginx reverse proxy                                                                            | `nginx`                                                 |

## 🚀 Quick Start

1. Go to `docker` folder

    ```sh
    cd docker
    ```

2. Start docker-compose

    ```sh
    docker-compose up -d --build
    ```

3. By default `docker-compose.yaml` set `nginx` ports to `80:80`, so you can visit the service at `http://localhost`. Or you can change to any port you want.

4. Stop

    ```sh
    docker-compose down
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
