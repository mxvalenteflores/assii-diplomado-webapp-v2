FROM node:22-alpine AS spa-builder
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

FROM alpine:3.20 AS pb-base
RUN apk add --no-cache ca-certificates curl unzip
ENV PB_VERSION=0.39.10
RUN curl -L -o /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
  && unzip /tmp/pb.zip -d /pb \
  && chmod +x /pb/pocketbase

FROM alpine:3.20
RUN apk add --no-cache ca-certificates curl

# Install Litestream for SQLite backups
ENV LITESTREAM_VERSION=0.3.13
RUN curl -L -o /litestream.tar.gz "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz" \
  && tar -xzf /litestream.tar.gz -C / \
  && chmod +x /litestream \
  && rm /litestream.tar.gz

COPY --from=pb-base /pb/pocketbase /pb/pocketbase
COPY --from=spa-builder /app/dist /pb/pb_public/
COPY pb_hooks/ /pb/pb_hooks/
COPY pb_migrations/ /pb/pb_migrations/
COPY litestream.yml /pb/litestream.yml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV AGENTMAIL_API_KEY=am_us_1a96c3614432092d8f4569675a8fa30d6ad80eaef38843433a3f06426bbb51f2

EXPOSE 3000
CMD ["/entrypoint.sh"]
