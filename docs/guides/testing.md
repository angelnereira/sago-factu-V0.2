# Estrategia de Testing

## Herramientas

- **Jest 30** como runner principal.
- **Testing Library** para pruebas de componentes React.
- **ts-jest** para transformar TypeScript.
- Scripts específicos en `package.json` (`test:unit`, `test:integration`, `test:excel-import`).

## Tipos de Pruebas

| Tipo | Cobertura | Scripts |
|------|-----------|---------|
| Unitarias | Validaciones, utils, hooks | `npm run test:unit` |
| Integración | Importación de Excel, flujos HKA | `npm run test:integration` |
| E2E manuales | Dashboard, emisión de factura completa | Usar `docs/guides/development-workflow.md` |

## Estructura

- `__tests__/validations/*`: Validadores y parsers.
- `__tests__/integration/*`: Casos integrados (importación, workers).
- `__tests__/hka/*`: Cobertura específica para utilidades HKA.
- `__tests__/setup.ts`: Setup global (mocks, entorno).

## Comandos Principales

```bash
npm run test             # Suite completa
npm run test:coverage    # Con reporte de cobertura
npm run test:watch       # Modo watch
npm run test:excel-import
```

## Cobertura Objetivo

- Mínimo **80%** en lógica crítica (`lib/hka`, `lib/parsers`, `lib/validations`).
- Validar escenarios edge: XML inválido, Excel sin datos, credenciales erróneas.

## Mocks y Fixtures

- Usa fixtures en `temp/` (Excel, XML) para reproducir casos reales.
- Mockea dependencias externas (SOAP, Redis) con jest mocks.
- Mantén los fixtures actualizados cuando cambien los requerimientos HKA.

## Integración Continua

- Incluye `npm run lint` y `npm run test` en pipelines (ver `docs/contributing/pull-request-template.md`).
- Adjunta reportes de cobertura en artefactos o badges (pendiente de implementación).

## Troubleshooting

| Error | Causa | Acción |
|-------|-------|--------|
| `TypeError: Cannot read properties of undefined` | Variables de entorno faltantes en tests. | Crea archivo `.env.test` o mockea `process.env`. |
| Tests de importación fallan | Cambios en templates Excel. | Actualiza fixtures en `temp/*.xlsx` y validadores en `lib/parsers`. |
| Timeout en pruebas HKA | Tests no mockean llamadas SOAP. | Usa mocks en `__tests__/setup.ts` o `jest.mock('node-soap')`. |

## Próximos Pasos

- Añadir pruebas E2E automatizadas (Playwright/Cypress).
- Integrar coverage a `CHANGELOG.md` por release.
- Publicar reporte HTML de cobertura en CI.

