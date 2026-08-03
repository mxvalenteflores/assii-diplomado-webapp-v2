#!/bin/sh
# On fresh container start, always attempt to restore from R2 backup.
# If a backup exists (from previous run), it replaces the empty seeded DB.
# If no backup exists yet, the seed script creates the initial data.

echo "[restore] Attempting restore from R2 backup..."

# Remove DB so litestream can restore into a clean state
rm -f /pb/pb_data/data.db /pb/pb_data/auxiliary.db 2>/dev/null

# Restore main DB
litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/data.db /pb/pb_data/data.db 2>&1 || echo "[restore] No backup available for data.db"

# Restore auxiliary DB
litestream restore -v -config /pb/litestream.yml -o /pb/pb_data/auxiliary.db /pb/pb_data/auxiliary.db 2>&1 || echo "[restore] No backup available for auxiliary.db"

# Start continuous replication
/litestream replicate -config /pb/litestream.yml &

# Ensure superuser, start PocketBase
/pb/pocketbase superuser upsert arqonlabshq@gmail.com '#Arqon.app.001' 2>/dev/null
/pb/pocketbase serve --http=0.0.0.0:3000 &
sleep 3

# Seed default data (skips if already exists)
/sh/seed.sh
echo "[entrypoint] Ready."

wait
