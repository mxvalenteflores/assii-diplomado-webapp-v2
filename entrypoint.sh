#!/bin/sh
# Start Litestream in background for continuous SQLite backups to R2
/litestream replicate -config /pb/litestream.yml &
# Start PocketBase
/pb/pocketbase superuser upsert arqonlabshq@gmail.com '#Arqon.app.001' 2>/dev/null
exec /pb/pocketbase serve --http=0.0.0.0:3000
