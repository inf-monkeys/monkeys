FROM node:22-alpine as builder

ARG GIT_COMMIT_HASH=dev
ARG GIT_TAG=

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

ENV NODE_OPTIONS=--max_old_space_size=8192 \
    GIT_COMMIT_HASH=${GIT_COMMIT_HASH} \
    GIT_TAG=${GIT_TAG}

RUN yarn

COPY . .

RUN yarn build

FROM node:22-alpine as runner

WORKDIR /app

RUN npm i -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ "serve", "-s", "dist", "-p", "3000" ]
