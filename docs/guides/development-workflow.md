# Workflow de Desarrollo

## Checklists Diarios

1. Actualiza dependencias y esquema:
   ```bash
   git pull origin main
   npm install
   npm run db:migrate
   ```
2. Verifica config:
   ```bash
   npm run check-config
   ```
3. Ejecuta pruebas relevantes (`npm run test:unit` o `npm run test:integration`).

## Flujo de Trabajo

1. **Crear rama feature**
   ```bash
   git checkout -b feat/nombre-corto
   ```
2. **Desarrollo**
   - Usa `npm run dev` para Next.js con fast refresh.
   - Ejecuta scripts específicos (ej. `npm run test:excel-import`).
3. **Validar**
   ```bash
   npm run lint
   npm run test
   ```
4. **Actualiza docs**
   - `CHANGELOG.md`
   - Documentos en `docs/`
   - README si la funcionalidad es visible
5. **Commit convencional**
   ```bash
   git commit -m "feat(facturas): agrega reintento automático"
   ```
6. **Pull Request**
   - Rellena plantilla `docs/contributing/pull-request-template.md`.
   - Adjunta capturas o grabaciones si aplica.

## Herramientas Útiles

| Script | Uso |
|--------|-----|
| `npm run neon:info` | Diagnóstico de conexión Neon. |
| `npm run admin:reset` | Regenera super admin con contraseña segura. |
| `npm run test:excel-import` | Valida importaciones masivas de Excel. |
| `npm run db:reset` | Limpia y vuelve a sembrar datos demo (dev). |

## Colas y Workers

- Workers se inician automáticamente desde la app.
- Para debug local:
  ```bash
  REDIS_URL=redis://localhost:6379 npm run dev
  ```
- Monitoriza colas en `app/dashboard/admin/monitores`.

## Estándares de Código

- TypeScript estricto, evita `any`.
- Usa utilidades en `lib/utils/*` para logging y manejo de errores.
- Mantén componentes UI pequeños y reutilizables (`components/ui`).
- Sigue `docs/contributing/code-style.md` (nombres, formateo, patrones).

## Antes de Mergiar

- [ ] Lint sin errores.
- [ ] Tests unitarios y de integración verdes.
- [ ] Seed probado (`npm run db:seed`).
- [ ] Documentación actualizada.
- [ ] `CHANGELOG.md` con resumen de cambios.
- [ ] Revisado por otro desarrollador (code review).

