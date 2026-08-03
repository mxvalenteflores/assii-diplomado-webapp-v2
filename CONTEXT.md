# assii-diplomado-v2
> url: https://portal.diplomadosassii.site
> host: Coolify (VPS 89.117.18.0)
> stack: Vite + React + Tailwind (SPA) + PocketBase (backend)
> status: en desarrollo

## Últimos cambios
- 2026-08-02 21:00 — Creacion del proyecto: DNS, repo, scaffolding, Dockerfile, paginas base

## Credenciales (sin valores)
- coolify: pass coolify/api-token
- hostinger: pass hostinger/api-token
- agentmail: arqonlabs@agentmail.to, API key en el Dockerfile
- pocketbase admin: arqonlabshq@gmail.com
- r2: pass projects/assii-diplomado/r2-*

## Para retomar
1. `cd /root/projects-clients/assii/diplomado1/appv2 && docker compose up -d`
2. Configurar PocketBase Admin UI en http://localhost:8090/_/
3. `cd app && npm install && npm run dev` (frontend en http://localhost:5173)

## Pendientes
- Configurar colecciones en PocketBase (schema + API rules)
- Conectar R2 como file storage
- Desplegar en Coolify
- Seed de 7 modulos
