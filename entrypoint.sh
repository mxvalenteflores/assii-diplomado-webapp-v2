#!/bin/sh
# Database persistence via Litestream R2 backups
#
# Strategy:
# 1. If DB exists and is non-empty → keep it (survived a volume-persisting container restart)
# 2. If DB is missing/empty → attempt restore from R2
# 3. If restore fails → fresh DB (seed creates initial data)
# 4. Litestream continuously backs up every 5 minutes

if [ -f /pb/pb_data/data.db ] && [ -s /pb/pb_data/data.db ]; then
  DB_SIZE=$(stat -c%s /pb/pb_data/data.db 2>/dev/null || echo 0)
  if [ "$DB_SIZE" -gt 5000 ]; then
    echo "[restore] DB exists and has data (${DB_SIZE} bytes), skipping restore."
  else
    echo "[restore] DB exists but appears empty (${DB_SIZE} bytes), restoring from R2..."
    rm -f /pb/pb_data/data.db /pb/pb_data/auxiliary.db
    litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/data.db /pb/pb_data/data.db 2>&1 || echo "[restore] No backup available for data.db"
    litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/auxiliary.db /pb/pb_data/auxiliary.db 2>&1 || echo "[restore] No backup available for auxiliary.db"
  fi
else
  echo "[restore] DB missing, restoring from R2..."
  litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/data.db /pb/pb_data/data.db 2>&1 || echo "[restore] No backup available for data.db"
  litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/auxiliary.db /pb/pb_data/auxiliary.db 2>&1 || echo "[restore] No backup available for auxiliary.db"
fi

# Start continuous replication to R2 (syncs every 5 min)
/litestream replicate -config /pb/litestream.yml &

# Ensure superuser, start PocketBase
/pb/pocketbase superuser upsert arqonlabshq@gmail.com '#Arqon.app.001' 2>/dev/null
/pb/pocketbase serve --http=0.0.0.0:3000 &
sleep 3

# Seed default data (skips if already exists)
/sh/seed.sh
echo "[entrypoint] Ready."

wait
