# Guía de Estilo de Código

## Principios Generales

- Escribe código **auto-documentado** y evita duplicidad (DRY).
- Mantén funciones y componentes con responsabilidad única.
- Prefiere composición sobre herencia.
- Documenta el “por qué” con comentarios breves cuando la lógica no sea obvia.

## TypeScript

- `strict` habilitado. Evita `any`; usa `unknown` + validaciones cuando sea necesario.
- Exporta tipos desde `types/` o módulos cercanos (`export type`).
- Usa `enum` o `as const` para valores constantes.
- Importa tipos con `import type`.

## React + Next.js

- Server Components por defecto. Usa `use client` solo cuando sea necesario.
- Hooks personalizados en `lib/hooks/*` o `components/*/hooks.ts`.
- Formularios con React Hook Form + Zod.
- Sigue convención de nombres:
  - Componentes: `PascalCase`.
  - Hooks: `useCamelCase`.
  - Props: defínelas con `interface Props`.

## Estilos

- Tailwind CSS como base.
- Usa `class-variance-authority` para variantes.
- Evita estilos inline complejos; crea utilidades en `components/ui`.

## Arquitectura de Carpetas (simplificada)

```
app/
  api/               ← Rutas API
  dashboard/         ← UI interna
  auth/              ← Login/Registro
components/
  ui/                ← Componentes reusables (botones, inputs)
  invoices/          ← Componentes específicos
lib/
  auth/              ← Autenticación y políticas
  hka/               ← Integración con The Factory HKA
  monitoring/        ← Métricas y monitores
  utils/             ← Helpers compartidos
scripts/
  *.ts               ← Automatizaciones (setup, diagnostico)
```

## Convenciones de Commit

- Sigue [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/).
- Ejemplos:
  - `feat(facturas): soporta reintento automático`
  - `fix(hka): corrige parser de respuesta`
  - `chore(deps): actualiza prisma 6.17.1`

## Pull Requests

- Adjunta descripción clara, contexto y tickets relacionados.
- Incluye capturas/gifs cuando afecte UI.
- Actualiza documentación (`README`, `docs/`) y `CHANGELOG.md`.
- Asegúrate de que `npm run lint` y `npm run test` pasen antes de solicitar revisión.

## Revisiones de Código

- Prioriza bugs, regresiones y seguridad por encima del estilo.
- Sugiere mejoras con argumentos técnicos y referencias.
- Respeta la guía de revisión interna documentada en `docs/contributing/pull-request-template.md`.

## Recursos

- ESLint configurado en `eslint.config.mjs`.
- Prettier alineado con Tailwind (ver `package.json`).
- Scripts de formateo: `npm run lint:fix`.

