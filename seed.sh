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

# --- 2. Ensure autodate fields exist on all collections ---
echo "Checking autodate fields..."
python3 -c "
import urllib.request, json

PB = '$PB'
headers = {'Authorization': 'Bearer $TOKEN', 'Content-Type': 'application/json'}
coll_ids = ['pbc_3827815851','pbc_2862470677','pbc_913941788','pbc_1009377862','pbc_631030571','pbc_2478702895','pbc_392670462','pbc_1739871503']

for cid in coll_ids:
    req = urllib.request.Request(f'{PB}/api/collections/{cid}', headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    fields = data.get('fields', [])
    
    has_created = any(f.get('name') == 'created' for f in fields)
    if has_created:
        continue
    
    print(f'  Adding autodate to {cid}')
    fields.append({
        'hidden': False, 'id': 'autodate_cre', 'name': 'created',
        'onCreate': True, 'onUpdate': False, 'presentable': False,
        'system': False, 'type': 'autodate'
    })
    fields.append({
        'hidden': False, 'id': 'autodate_upd', 'name': 'updated',
        'onCreate': True, 'onUpdate': True, 'presentable': False,
        'system': False, 'type': 'autodate'
    })
    
    body = json.dumps({'fields': fields}).encode()
    req = urllib.request.Request(f'{PB}/api/collections/{cid}', data=body, headers=headers, method='PATCH')
    urllib.request.urlopen(req)

print('Autodate check complete.')
" 2>&1 || echo "Autodate update attempted."
echo "Autodate check complete."

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
