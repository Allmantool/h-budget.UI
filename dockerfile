FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG SONAR_TOKEN

ENV SONAR_TOKEN=${SONAR_TOKEN}

# install chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
ENV CHROME_BIN=/usr/bin/google-chrome

RUN npm run build-prod --if-present --verbose

FROM nginx:alpine3.18 as publish
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/h-budget /usr/share/nginx/html

EXPOSE 80
