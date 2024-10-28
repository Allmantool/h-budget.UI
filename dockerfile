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
RUN apt-get update && \
    apt-get install -y wget gnupg && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/* /google-chrome-stable_current_amd64.deb

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
