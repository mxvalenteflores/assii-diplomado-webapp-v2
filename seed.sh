#!/bin/sh
# Wait for PocketBase to be ready
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
echo "Authenticating as superuser..."
TOKEN=$(curl -s -X POST "$PB/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not authenticate as superuser"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# --- 2. Add fields to all collections ---
echo "Adding fields to collections..."

# diplomados
curl -s -X PATCH "$PB/api/collections/pbc_2862470677" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"name","type":"text","required":true},
    {"name":"slug","type":"text","required":true},
    {"name":"modality","type":"text","required":false},
    {"name":"duration","type":"text","required":false},
    {"name":"dates","type":"text","required":false},
    {"name":"investment","type":"number","required":false},
    {"hidden":false,"id":"autodate2990389176","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate3332085495","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# forms
curl -s -X PATCH "$PB/api/collections/pbc_913941788" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"title","type":"text","required":true},
    {"name":"diplomadoId","type":"text","required":false},
    {"name":"isActive","type":"bool","required":false},
    {"name":"fields","type":"json","required":false},
    {"hidden":false,"id":"autodate_f1","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate_u1","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# students
curl -s -X PATCH "$PB/api/collections/pbc_3827815851" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"email","type":"email"},{"name":"firstName","type":"text"},{"name":"lastName","type":"text"},
    {"name":"phone","type":"text"},{"name":"empresa","type":"text"},{"name":"puesto","type":"text"},
    {"hidden":false,"id":"autodate_f2","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate_u2","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# enrollments
curl -s -X PATCH "$PB/api/collections/pbc_1009377862" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"studentId","type":"text"},{"name":"diplomadoId","type":"text"},
    {"name":"status","type":"text"},{"name":"paymentAmount","type":"number"},
    {"hidden":false,"id":"autodate_f3","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate_u3","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# payments
curl -s -X PATCH "$PB/api/collections/pbc_631030571" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"proof","type":"file","required":false,"options":{"mimeTypes":["image/jpeg","image/png","image/webp","application/pdf"],"maxSelect":1,"maxSize":5242880,"protected":false}},
    {"name":"amount","type":"number"},{"name":"status","type":"text"},
    {"name":"enrollmentId","type":"text"},{"name":"rejectionReason","type":"text"},
    {"hidden":false,"id":"autodate_f4","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate_u4","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# classes
curl -s -X PATCH "$PB/api/collections/pbc_2478702895" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"title","type":"text"},{"name":"description","type":"text"},
    {"name":"datetime","type":"date"},{"name":"meetingUrl","type":"url"},{"name":"diplomadoId","type":"text"},
    {"hidden":false,"id":"autodate_f5","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate_u5","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# recordings
curl -s -X PATCH "$PB/api/collections/pbc_392670462" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"fields":[
    {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
    {"name":"title","type":"text"},{"name":"url","type":"url"},{"name":"classId","type":"text"},
    {"hidden":false,"id":"autodate_f6","name":"created","onCreate":true,"onUpdate":false,"presentable":false,"system":false,"type":"autodate"},
    {"hidden":false,"id":"autodate_u6","name":"updated","onCreate":true,"onUpdate":true,"presentable":false,"system":false,"type":"autodate"}
  ]}' > /dev/null 2>&1

# submissions (replaces broken form_responses)
# Delete old broken form_responses if it exists (replaced by form_submissions)
OLD_FR_ID=$(curl -s "$PB/api/collections" -H "$AUTH" | python3 -c "import sys,json; items=[c for c in json.load(sys.stdin).get('items',[]) if c['name']=='form_responses']; print(items[0]['id'] if items else '')" 2>/dev/null)
if [ -n "$OLD_FR_ID" ]; then
  curl -s -X DELETE "$PB/api/collections/$OLD_FR_ID" -H "$AUTH" > /dev/null 2>&1
fi

echo "Fields added."

# --- 3. Create admin user ---
echo "Creating admin..."
curl -s -X POST "$PB/api/collections/admins/records" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\",\"passwordConfirm\":\"$ADMIN_PASS\",\"verified\":true}" > /dev/null 2>&1
echo "Admin created."

# --- 4. Create diplomado ---
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

# --- 5. Create form ---
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

echo "=== SEED COMPLETE ==="
