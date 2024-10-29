# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy and install only necessary dependencies first to leverage Docker caching
COPY package*.json ./

# Set environment variables and install dependencies
ENV NODE_ENV=production
RUN npm i --omit=dev --verbose

# Copy remaining application files
COPY . .

# Install Chrome dependencies and Chrome itself in one layer
RUN apk update && \
    apk add --no-cache wget gnupg && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --import - && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache chromium

# Set environment variable for Chrome
ENV CHROME_BIN=/usr/bin/google-chrome

# Run the production build
RUN npm run build-prod --if-present --verbose

# Stage 2: Publish
FROM nginx:alpine3.18 AS publish

# Copy build output to Nginx directory
COPY --from=build /app/dist/h-budget /usr/share/nginx/html

EXPOSE 80
EXPOSE 443
