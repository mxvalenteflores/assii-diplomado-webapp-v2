#!/bin/sh
# Seed script - creates default data on fresh deployments
# Schema is handled by migrations. This only creates records.

echo "Waiting for PocketBase to start..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "PocketBase is ready!"
    break
  fi
  sleep 1
done

PB="http://localhost:3000"
ADMIN_EMAIL="arqonlabshq@gmail.com"
ADMIN_PASS="#Arqon.app.001"

# --- 1. Authenticate as superuser ---
echo "Authenticating..."
TOKEN=$(curl -s -X POST "$PB/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not authenticate"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# --- 2. Create inbox collection if not exists ---
INBOX_EXISTS=$(curl -s "$PB/api/collections" -H "$AUTH" | python3 -c "import sys,json; items=[c for c in json.load(sys.stdin).get('items',[]) if c['name']=='inbox']; print('yes' if items else '')" 2>/dev/null)
if [ -z "$INBOX_EXISTS" ]; then
  echo "Creating inbox collection..."
  curl -s -X POST "$PB/api/collections" -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"name":"inbox","type":"base","createRule":"","listRule":"@request.auth.id != \"\"","viewRule":"@request.auth.id != \"\"","updateRule":"@request.auth.id != \"\"","deleteRule":"@request.auth.id != \"\"","fields":[{"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text_ib_id","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},{"name":"studentId","type":"text"},{"name":"formId","type":"text"},{"name":"data","type":"text"}]}' > /dev/null 2>&1
  echo "Inbox collection created."
else
  echo "Inbox collection already exists."
fi

# --- 3. Create admin user ---
echo "Creating admin user..."
EXISTING=$(curl -s "$PB/api/collections/admins/records?filter=email='$ADMIN_EMAIL'" -H "$AUTH" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))" 2>/dev/null)
if [ "$EXISTING" = "0" ]; then
  curl -s -X POST "$PB/api/collections/admins/records" -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\",\"passwordConfirm\":\"$ADMIN_PASS\",\"verified\":true}" > /dev/null 2>&1
  echo "Admin created."
else
  echo "Admin already exists."
fi

# --- 3. Create diplomado if not exists ---
EXISTING_DIP=$(curl -s "$PB/api/collections/diplomados/records?filter=slug='competencias-gerenciales-sst'" -H "$AUTH" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))" 2>/dev/null)
if [ "$EXISTING_DIP" = "0" ]; then
  echo "Creating diplomado..."
  DIP_ID=$(curl -s -X POST "$PB/api/collections/diplomados/records" -H "$AUTH" -H "Content-Type: application/json" \
    -d '{
      "name":"Competencias Gerenciales para la Gestion de la SST",
      "slug":"competencias-gerenciales-sst",
      "modality":"Online en vivo",
      "duration":"120 horas",
      "dates":"Septiembre - Diciembre 2026",
      "investment":5000
    }' | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
  echo "Diplomado: $DIP_ID"
else
  DIP_ID=$(curl -s "$PB/api/collections/diplomados/records?filter=slug='competencias-gerenciales-sst'" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['items'][0]['id'])" 2>/dev/null)
  echo "Diplomado already exists: $DIP_ID"
fi

# --- 4. Create form if not exists ---
EXISTING_FORM=$(curl -s "$PB/api/collections/forms/records?filter=diplomadoId='$DIP_ID'" -H "$AUTH" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))" 2>/dev/null)
if [ "$EXISTING_FORM" = "0" ]; then
  echo "Creating form..."
  curl -s -X POST "$PB/api/collections/forms/records" -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"title\":\"Formulario de Inscripcion\",
      \"diplomadoId\":\"$DIP_ID\",
      \"isActive\":true,
      \"fields\":[
        {\"name\":\"nombre_completo\",\"label\":\"Nombre completo\",\"type\":\"text\",\"required\":true},
        {\"name\":\"correo_electronico\",\"label\":\"Correo electronico\",\"type\":\"email\",\"required\":true},
        {\"name\":\"telefono\",\"label\":\"Telefono\",\"type\":\"tel\",\"required\":true},
        {\"name\":\"empresa\",\"label\":\"Empresa / Organizacion\",\"type\":\"text\",\"required\":false},
        {\"name\":\"puesto\",\"label\":\"Puesto / Cargo\",\"type\":\"text\",\"required\":false},
        {\"name\":\"nivel_estudios\",\"label\":\"Nivel maximo de estudios\",\"type\":\"select\",\"required\":true,\"options\":[\"Bachillerato\",\"Licenciatura\",\"Maestria\",\"Doctorado\"]},
        {\"name\":\"experiencia_sst\",\"label\":\"Anios de experiencia en SST\",\"type\":\"select\",\"required\":true,\"options\":[\"Menos de 1\",\"1-3\",\"4-6\",\"7-10\",\"Mas de 10\"]},
        {\"name\":\"conocimientos_previos\",\"label\":\"Conocimientos previos en gestion de SST\",\"type\":\"scale\",\"required\":true},
        {\"name\":\"motivacion\",\"label\":\"Por que te interesa este diplomado?\",\"type\":\"textarea\",\"required\":true},
        {\"name\":\"expectativas\",\"label\":\"Que esperas aprender?\",\"type\":\"textarea\",\"required\":false},
        {\"name\":\"tipo_participante\",\"label\":\"Tipo de participante\",\"type\":\"radio\",\"required\":true,\"options\":[\"Empresa\",\"Independiente\",\"Estudiante\"]},
        {\"name\":\"areas_interes\",\"label\":\"Areas de interes\",\"type\":\"checkbox\",\"required\":false,\"options\":[\"Legislacion SST\",\"Auditorias\",\"Cultura organizacional\",\"Indicadores\",\"Gestion de riesgos\"]},
        {\"name\":\"como_se_entero\",\"label\":\"Como se entero del diplomado?\",\"type\":\"select\",\"required\":true,\"options\":[\"LinkedIn\",\"Facebook\",\"Recomendacion\",\"Google\",\"Correo electronico\",\"Otro\"]},
        {\"name\":\"factura\",\"label\":\"Requiere factura?\",\"type\":\"radio\",\"required\":true,\"options\":[\"Si\",\"No\"]},
        {\"name\":\"comentarios\",\"label\":\"Comentarios adicionales\",\"type\":\"textarea\",\"required\":false}
      ]
    }" > /dev/null 2>&1
  echo "Form created."
else
  echo "Form already exists."
fi

echo "=== SEED COMPLETE ==="
