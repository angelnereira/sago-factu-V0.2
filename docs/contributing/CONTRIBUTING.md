# Contribuir a SAGO FACTU

¡Gracias por tu interés en contribuir! Sigue estas pautas para mantener un flujo de trabajo consistente y de alta calidad.

## 1. Código de Conducta

- Respeta al resto del equipo.
- Comunica cambios con claridad.
- Reporta vulnerabilidades de forma privada (security@sago-factu.com).

## 2. Flujo de Trabajo

1. Fork o rama feature desde `main`.
2. Instala dependencias: `npm install`.
3. Configura variables: `cp .env.example .env`.
4. Ejecuta `npm run db:migrate` y `npm run db:seed`.
5. Desarrolla tu cambio siguiendo la [Guía de Estilo](docs/contributing/code-style.md).
6. Asegura calidad:
   ```bash
   npm run lint
   npm run test
   ```
7. Actualiza documentación relevante (`README.md`, `docs/`, `CHANGELOG.md`).
8. Genera un commit convencional (`feat:`, `fix:`, etc.).
9. Crea un Pull Request usando la [plantilla oficial](docs/contributing/pull-request-template.md).

## 3. Revisión de Código

- Las revisiones se enfocan en funcionalidad, seguridad y mantenibilidad.
- Aporta contexto suficiente (capturas, logs, pasos de prueba).
- Atiende los comentarios de forma colaborativa.

## 4. Estándares

- TypeScript estricto, sin `any`.
- Componentes React concisos y reusables.
- Validación con Zod en toda entrada de usuario.
- Lógica de negocio documentada.

## 5. Issues y Roadmap

- Reporta bugs con pasos detallados y logs.
- Marca mejoras como `enhancement`.
- Consulta el roadmap en `README.md` y `CHANGELOG.md`.

## 6. Seguridad

- No compartas secretos en commits.
- Usa `.env.example` para documentar variables.
- Reporta vulnerabilidades vía security@sago-factu.com.

## 7. Licencia

- Al contribuir aceptas que tus cambios se publiquen bajo la licencia [MIT](LICENSE).

---

¿Necesitas ayuda? Escríbenos a `dev@sago-factu.com`. ¡Gracias por hacer SAGO FACTU mejor!

