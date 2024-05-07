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

3. By default `docker-compose.yaml` set `nginx` ports to `81:80`, so you can visit the service at `http://localhost:81`. Or you can change to any port you want.

