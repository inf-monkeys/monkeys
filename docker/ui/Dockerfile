FROM node:18-alpine as builder

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

ENV NODE_OPTIONS=--max_old_space_size=4096

RUN yarn

COPY . .

RUN yarn build

FROM node:18-alpine as runner

WORKDIR /app

RUN npm i -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ "serve", "-s", "dist", "-p", "3000" ]
