#!/bin/sh
/litestream replicate -config /pb/litestream.yml &
/pb/pocketbase superuser upsert arqonlabshq@gmail.com '#Arqon.app.001' 2>/dev/null
/pb/pocketbase serve --http=0.0.0.0:3000 &
sleep 3
/sh/seed.sh
wait
