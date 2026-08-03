#!/bin/sh
# Restore database from R2 backup if missing (disaster recovery / fresh deploy)
if [ ! -f /pb/pb_data/data.db ] || [ ! -s /pb/pb_data/data.db ]; then
  echo "[restore] No local DB found, attempting restore from R2..."
  /litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/data.db /pb/pb_data/data.db 2>&1 || echo "[restore] No backup available, starting fresh."
fi

# Start Litestream replication in background
/litestream replicate -config /pb/litestream.yml &

# Ensure superuser exists, then start PocketBase
/pb/pocketbase superuser upsert arqonlabshq@gmail.com '#Arqon.app.001' 2>/dev/null
/pb/pocketbase serve --http=0.0.0.0:3000 &
sleep 3

# Run seed to create any missing default data
/sh/seed.sh
echo "[entrypoint] Ready."

wait
