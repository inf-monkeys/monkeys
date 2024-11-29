# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY ["package.json", "yarn.lock", "./"]

# Install app dependencies
RUN yarn

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN yarn build

# Expose server port
EXPOSE 3000

ENV NODE_OPTIONS=--max_old_space_size=4096
# 设置时区和字符集
ENV TZ Asia/Shanghai
ENV LC_ALL=en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# Start the server using the production build
CMD yarn migration:run; yarn start:prod
