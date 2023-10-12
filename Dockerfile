FROM node:16 as node
WORKDIR /app
COPY . .

# install manually all the missing libraries
RUN apt-get update
RUN apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils wget

# install chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
ENV CHROME_BIN=/usr/bin/google-chrome

RUN npm ci
RUN npm run build-prod --if-present
RUN npm run test-headless
RUN npm run sonar-scanner -Dsonar.login=${SONAR_TOKEN}

FROM nginx:alpine
COPY --from=node /app/dist/h-budget /usr/share/nginx/html