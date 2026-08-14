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
      "name":"Diplomado en Competencias Gerenciales para la Gestion de la Seguridad y Salud en el Trabajo",
      "slug":"competencias-gerenciales-sst",
      "modality":"En linea sincronica (Google Meet)",
      "duration":"12 semanas",
      "dates":"09 de agosto al 25 de octubre",
      "investment":10000
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
        {\"name\":\"acepto_privacidad\",\"label\":\"Acepta los terminos del aviso de privacidad para el uso y tratamiento de sus datos personales?\",\"type\":\"radio\",\"required\":true,\"options\":[\"Si, he leido y acepto el aviso de privacidad.\"]},
        {\"name\":\"nombre_completo\",\"label\":\"Nombre completo (Como desea que aparezca en la documentacion oficial)\",\"type\":\"text\",\"required\":true},
        {\"name\":\"correo_electronico\",\"label\":\"Correo electronico principal\",\"type\":\"email\",\"required\":true},
        {\"name\":\"telefono\",\"label\":\"Numero de telefono celular (para WhatsApp)\",\"type\":\"tel\",\"required\":true},
        {\"name\":\"nivel_estudios\",\"label\":\"Ultimo grado de estudios\",\"type\":\"select\",\"required\":true,\"options\":[\"Primaria\",\"Secundaria\",\"Media Superior\",\"Universidad\",\"Postgrado\"]},
        {\"name\":\"carrera_especialidad\",\"label\":\"En caso de Universidad o Postgrado, indique cual es su carrera o especialidad\",\"type\":\"text\",\"required\":false},
        {\"name\":\"empresa\",\"label\":\"Empresa, Organizacion o Institucion de procedencia\",\"type\":\"text\",\"required\":true},
        {\"name\":\"puesto\",\"label\":\"Puesto o cargo actual\",\"type\":\"text\",\"required\":true},
        {\"name\":\"pertenece_institucion\",\"label\":\"Forma parte de alguna de las siguientes instituciones?\",\"type\":\"radio\",\"required\":true,\"options\":[\"Si, pertenezco al REDVITAB o Institucion Educativa con convenio ASSII\",\"Si, pertenezco a una Empresa del COCOESST\",\"Si, pertenezco a un Sindicato del COCOESST\",\"Si, pertenezco a COPARMEX Tabasco\",\"Si, pertenezco a International Lean Six Sigma Group\",\"No, no pertenezco a ninguna\"]},
        {\"name\":\"esquema_pago\",\"label\":\"Seleccion de Esquema de Inversion y Pago\",\"type\":\"radio\",\"required\":true,\"options\":[\"Pago unico - Publico General: 10% de descuento (\\$9,000.00 MXN) - Transferencia a Scotiabank\",\"Pago unico - Comunidad ASSII: 25% de descuento + 5% adicional (\\$7,125.00 MXN) - Transferencia a Scotiabank\",\"6 Meses sin intereses - Publico General: Sin descuento (\\$1,667.00 MXN mensuales)\",\"6 meses sin intereses - Comunidad ASSII: 25% de descuento (\\$1,250.00 MXN mensuales)\"]},
        {\"name\":\"factura\",\"label\":\"Requerira comprobante fiscal (Factura / CFDI) por su inversion?\",\"type\":\"radio\",\"required\":true,\"options\":[\"Si, requiero factura\",\"No requiero factura\"]},
        {\"name\":\"expectativa\",\"label\":\"Cual es su expectativa a alcanzar con respecto al Diplomado?\",\"type\":\"radio\",\"required\":true,\"options\":[\"Mejorar mi rol actual en SST\",\"Aspirar a un puesto de mayor jerarquia gerencial\",\"Asegurar el cumplimiento normativo en mi organizacion\",\"Obtener un conocimiento formal y una constancia/diploma\",\"Networking con otros profesionales del sector\"]},
        {\"name\":\"nivel_conocimiento\",\"label\":\"Como evalua su nivel actual de conocimiento en Competencias Gerenciales aplicadas a la GSST?\",\"type\":\"scale\",\"required\":true},
        {\"name\":\"tema_critico\",\"label\":\"Cual de los siguientes temas de SST considera mas critico para su desarrollo profesional?\",\"type\":\"radio\",\"required\":true,\"options\":[\"Liderazgo y Cultura de Seguridad\",\"Gestion de Riesgos Psicosociales\",\"Cumplimiento Normativo (NOMs y Legislacion)\",\"Investigacion de Accidentes y Analisis Causa Raiz\",\"Auditorias y Sistemas de Gestion (ISO 45001)\"]},
        {\"name\":\"comentarios\",\"label\":\"Comentarios adicionales o dudas\",\"type\":\"textarea\",\"required\":false}
      ]
    }" > /dev/null 2>&1
  echo "Form created."
else
  echo "Form already exists."
fi

echo "=== SEED COMPLETE ==="
