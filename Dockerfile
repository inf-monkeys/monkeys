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
RUN yarn

# Expose server port
EXPOSE 3000

# Start the server using the production build
CMD node dist/main.js
