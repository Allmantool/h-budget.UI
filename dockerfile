# Stage 1: Build
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy only package files to leverage Docker cache
COPY package*.json ./

RUN npm install -g nx@20.0.8 \
    && npm install -g @nx/workspace@20.0.8 \
    && npm install -g @nx/angular@20.0.8 \
    && npm install -g @nrwl/angular@19.8.4 \
    && npm install --omit=dev --verbose

# Copy the rest of the application files
COPY . .

# Install Chrome and dependencies
RUN apk update && \
    apk add --no-cache chromium wget gnupg && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --import - && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache chromium

# Set Chrome binary path
ENV CHROME_BIN=/usr/bin/chromium-browser

# Run the production build
RUN npm run build-prod --if-present --verbose

# Stage 2: Publish
FROM nginx:alpine3.18 AS publish

# Copy build output from the build stage to Nginx's HTML directory
COPY --from=build /app/dist/h-budget /usr/share/nginx/html

# Expose HTTP and HTTPS ports
EXPOSE 80
EXPOSE 443

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
