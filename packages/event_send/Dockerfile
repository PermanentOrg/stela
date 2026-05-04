# Monorepo Dockerfile - must be built from repository root:
#   docker build -f packages/event_send/Dockerfile .
FROM node:24-alpine AS builder
WORKDIR /usr/local/apps/stela/

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./
COPY jest.config.js ./
COPY packages ./packages

RUN npm install
RUN npm install -ws
RUN npm run build -ws

FROM node:24-alpine AS final

ARG AWS_RDS_CERT_BUNDLE

WORKDIR /usr/local/apps/stela/

RUN mkdir /etc/ca-certificates
RUN echo -e $AWS_RDS_CERT_BUNDLE > /etc/ca-certificates/rds-us-west-2-ca-bundle.pem

COPY --from=builder /usr/local/apps/stela/packages/event_send/dist ./packages/event_send/dist
COPY --from=builder /usr/local/apps/stela/packages/event_send/package.json ./packages/event_send/package.json
COPY --from=builder /usr/local/apps/stela/packages/logger/dist ./packages/logger/dist
COPY --from=builder /usr/local/apps/stela/packages/logger/package.json ./packages/logger/package.json
COPY --from=builder /usr/local/apps/stela/packages/publisher-utils/dist ./packages/publisher-utils/dist
COPY --from=builder /usr/local/apps/stela/packages/publisher-utils/package.json ./packages/publisher-utils/package.json
COPY --from=builder /usr/local/apps/stela/package.json ./package.json
COPY --from=builder /usr/local/apps/stela/package-lock.json ./package-lock.json

RUN npm install --workspace @stela/event_send

CMD node packages/event_send/dist/index.js
