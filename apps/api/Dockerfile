FROM node:18-alpine
WORKDIR /usr/local/apps/stela/

RUN apk add curl

COPY ../../package.json .
COPY package.json ./apps/api/
RUN npm install -g npm@8.19.3
RUN npm cache clean --force
RUN npm install --omit dev
ENV PATH=/usr/local/apps/stela/node_modules/.bin:$PATH

COPY ../../tsconfig.json ./
COPY tsconfig.json ./apps/api/
COPY src ./apps/api/src

ENV PORT=80
EXPOSE 80

CMD npm run start
