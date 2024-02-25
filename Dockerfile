FROM node:18-alpine as builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm i

COPY . .

RUN npm run build

FROM node:18-alpine as runner

WORKDIR /app

RUN npm i -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ "serve", "-s", "dist", "-p", "3000" ]
