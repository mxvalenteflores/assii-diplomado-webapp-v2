# assii-diplomado-v2
> url: https://portal.diplomadosassii.site
> host: Coolify (VPS 89.117.18.0)
> stack: Vite + React + Tailwind (SPA) + PocketBase (backend)
> repo: https://github.com/mxvalenteflores/assii-diplomado-webapp-v2 (publico)
> status: vivo

## Ultimos cambios
- 2026-08-03 06:00 — R2 file storage configurado en PocketBase (Settings > Files). Litestream integrado en Dockerfile (backups cada 15min a R2, retention 30d).
- 2026-08-03 06:00 — Campo `proof` (file) agregado a coleccion payments via PocketBase Admin API. Frontend actualizado (proofUrl -> proof).
- 2026-08-03 05:58 — Toggle de visibilidad de contraseña en login agregado.
- 2026-08-03 02:40 — Deploy exitoso en Coolify. Seed production completo: admin, diplomado, form 15 campos, 7 modulos.
- 2026-08-03 02:24 — Schema + seed local. pb_migrations commit.
- 2026-08-03 02:11 — Scaffolding Vite+React+Tailwind+Router, Dockerfile, hooks AgentMail.
- 2026-08-03 01:52 — DNS portal.diplomadosassii.site creado. Repo GitHub privado.

## Credenciales (sin valores)
- coolify: pass coolify/api-token
- hostinger: pass hostinger/api-token
- agentmail: arqonlabs@agentmail.to, API key en Dockerfile y hooks
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
