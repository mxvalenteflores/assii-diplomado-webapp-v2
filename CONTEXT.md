# assii-diplomado-v2
> url: https://portal.diplomadosassii.site
> host: Coolify (VPS 89.117.18.0)
> stack: Vite + React + Tailwind (SPA) + PocketBase (backend)
> repo: https://github.com/mxvalenteflores/assii-diplomado-webapp-v2 (publico)
> status: vivo

## Ultimos cambios
- 2026-08-14 10:45 — **Reprogramación.** Los 83 emails se movieron de 2026-08-15 a **hoy 2026-08-14 08:30 AM America/Mexico_City** (`scheduled_at = 2026-08-14T08:30:00-06:00`, 14:30 UTC) vía `PATCH /emails/{id}`.
- 2026-08-14 10:35 — **Campaña programada (Resend).** 83 emails transaccionales programados con `scheduled_at = 2026-08-15T08:30:00-06:00` (mañana 08:30 AM America/Mexico_City). Correo A (COCOCESST) → 22 destinatarios; Correo B (REDVITAB/ASSII) → 55. Copias de validación (ambos correos) a `assii.org.net@gmail.com`, `assii.paraiso@gmail.com`, `valente.contacto@gmail.com`. From: `ASSII Diplomados <contacto@diplomadosassii.site>`. Idempotency: `campana-sst-A/B-2026-08-15`.
- 2026-08-14 10:23 — **Campaña email marketing (Resend).** Se revisó Google Sheet "Contactos con correo" (90 filas). Segmentación por "Origen del prospecto": A_DECISION (COCOCESST + mixtos) = 22, B_REDVITAB_ASSII = 55, excluidos 13 (12 emails inválidos tipo CURP/RFC + 1 sin origen). Se crearon plantillas HTML premium alineadas a la paleta (`#1e40af`/`#1f3864`) en `emails/campana-cococesst.html` y `emails/campana-redvitab-assii.html`. Lista segmentada en `emails/contactos_segmentados.csv`. Pruebas enviadas: Correo A → `valente.contacto@gmail.com`, Correo B → `vadeflo@gmail.com`. **Pendiente:** tras validación del contenido, programar envío transaccional (batch con `scheduled_at`) para mañana 08:30 AM America/Mexico_City. From: `ASSII Diplomados <contacto@diplomadosassii.site>`.
- 2026-08-06 23:02 — **Migracion AgentMail → Resend.** Dominio `diplomadosassii.site` verificado en Resend (DKIM + SPF + MX). emails.pb.js v5 usa Resend API (`RESEND_API_KEY`). From: `notificaciones@diplomadosassii.site`. DNS: DKIM `resend._domainkey`, SPF/MX en `send`. MX en Hostinger requiere priority en content: `"10 feedback-smtp..."` (no hay campo priority en la API).
- 2026-08-03 09:30 — **Persistence fix.** Data survives redeploys. Litestream auto-restore (R2 backup) + seed adds created/updated autodate fields on startup. `getFullList` replaced with `getList` to bypass PocketBase `skipTotal=1` 400 bug. Toast errors removed on page load.
- 2026-08-03 06:00 — R2 file storage configurado en PocketBase (Settings > Files). Litestream integrado en Dockerfile (backups cada 15min a R2, retention 30d).
- 2026-08-03 06:00 — Campo `proof` (file) agregado a coleccion payments via PocketBase Admin API. Frontend actualizado (proofUrl -> proof).
- 2026-08-03 05:58 — Toggle de visibilidad de contraseña en login agregado.
- 2026-08-03 02:40 — Deploy exitoso en Coolify. Seed production completo: admin, diplomado, form 15 campos, 7 modulos.
- 2026-08-03 02:24 — Schema + seed local. pb_migrations commit.
- 2026-08-03 02:11 — Scaffolding Vite+React+Tailwind+Router, Dockerfile, hooks AgentMail.
- 2026-08-03 01:52 — DNS portal.diplomadosassii.site creado. Repo GitHub privado.

## Architecture decisions
### Persistencia de datos
- **Litestream restore al arrancar**: entrypoint.sh borra DB local, restaura desde backup R2.
  Si no hay backup, el seed crea datos iniciales (admin, diplomado, form).
- **Litestream replicate continuo**: backups incrementales cada 5 min a R2, snapshots cada 4h.
- **Volumen pb_data**: Coolify preserva el volumen entre deploys (verificado con 3 redeploys).
  El restore de Litestream es safety net por si el volumen se pierde.
- **Seed script**: python3 añade campos `created`/`updated` (autodate) a todas las colecciones
  si no existen. Esto corrige DBs creadas antes de que las migraciones los incluyeran.

### PocketBase SDK bugs workaround
- `pb.collection().getFullList()` añade `skipTotal=1` que PocketBase v0.39.10 rechaza con 400.
  Workaround: usar `getList(1, 1000, {...})` en todo el frontend.
- Colecciones creadas via API POST después de inserts se corrompen (bug v0.39.10).
  Workaround: formulario guarda respuestas en `students.formData` en vez de colección separada.

## Credenciales (sin valores)
- coolify: pass coolify/api-token
- hostinger: pass hostinger/api-token
- resend: pass projects/assii-diplomado/resend-api-key | dominio verificado: diplomadosassii.site (from: notificaciones@)
- pocketbase admin: arqonlabshq@gmail.com
- r2: pass projects/assii-diplomado/r2-*

## Para retomar
1. `cd /root/projects-clients/assii/diplomado1/appv2 && docker compose up -d`
2. `cd app && npm run dev` (frontend en http://localhost:5173)
3. Login admin: https://portal.diplomadosassii.site/login (arqonlabshq@gmail.com / #Arqon.app.001)
4. Admin UI PocketBase: https://portal.diplomadosassii.site/_/
5. Formulario publico: https://portal.diplomadosassii.site/forms/competencias-gerenciales-sst

## Pendientes
- Dashboard de estudiantes (futuro)
- Crear nuevo diplomado/forms (proximo ciclo)

## Para retomar
1. `cd /root/projects-clients/assii/diplomado1/appv2 && docker compose up -d`
2. `cd app && npm run dev` (frontend en http://localhost:5173)
3. Login admin: https://portal.diplomadosassii.site/login (arqonlabshq@gmail.com / #Arqon.app.001)
4. Admin UI PocketBase: https://portal.diplomadosassii.site/_/
5. Formulario publico: https://portal.diplomadosassii.site/forms/competencias-gerenciales-sst
