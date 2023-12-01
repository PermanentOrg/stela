FROM node:18-alpine
WORKDIR /usr/local/apps/stela

RUN apk add curl

COPY package.json ./
RUN npm install -g npm@8.19.3
RUN npm cache clean --force
RUN npm install
ENV PATH=/usr/local/apps/stela/node_modules/.bin:$PATH

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

ENV PORT=80
EXPOSE 80

CMD npm run start
