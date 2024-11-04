FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --verbose

COPY . .

RUN apk update && \
    apk add --no-cache chromium wget gnupg && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --import - && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache chromium

ENV CHROME_BIN=/usr/bin/chromium-browser

RUN npm run build-prod --if-present --verbose

FROM nginx:alpine3.18 AS publish

COPY --from=build /app/dist/h-budget /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
