# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS deps
WORKDIR /app
COPY ui-admin/package.json ui-admin/yarn.lock ./
RUN --mount=type=cache,target=/root/.cache/yarn \
    yarn install --frozen-lockfile

FROM node:22-alpine AS build
ARG GIT_COMMIT_HASH=dev
ARG GIT_TAG=
WORKDIR /app
ENV NODE_OPTIONS=--max_old_space_size=8192 \
    GIT_COMMIT_HASH=${GIT_COMMIT_HASH} \
    GIT_TAG=${GIT_TAG}
COPY --from=deps /app/node_modules ./node_modules
COPY ui-admin/ .
RUN --mount=type=cache,target=/root/.cache/yarn \
    --mount=type=cache,target=/app/node_modules/.cache \
    --mount=type=cache,target=/app/.tsbuildcache \
    yarn build

FROM node:22-alpine AS runner
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm i -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["serve", "-s", "dist", "-p", "3001"]
