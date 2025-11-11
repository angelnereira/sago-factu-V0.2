# Sistema de Manejo de Errores Detallado para SUPER_ADMIN

## Objetivo

Proporcionar mensajes de error detallados y específicos para usuarios con rol SUPER_ADMIN, facilitando el debugging y pruebas en ambiente de desarrollo/producción.

## Características

### Para SUPER_ADMIN:
- ✅ Stack trace completo
- ✅ Contexto detallado del error
- ✅ Código de error específico
- ✅ Timestamp del error
- ✅ Información de causa (si aplica)
- ✅ Mensajes de debug adicionales

### Para usuarios normales:
- ✅ Mensajes genéricos y amigables
- ✅ Sin información sensible expuesta
- ✅ Experiencia de usuario mejorada

## Uso en API Routes

### Ejemplo Básico

```typescript
import { createErrorResponse } from '@/lib/utils/api-error-response';

export async function POST(request: NextRequest) {
  try {
    // ... código de lógica ...
  } catch (error) {
    const session = await auth();
    return createErrorResponse(
      error,
      500,
      session?.user?.role,
      session?.user?.id
    );
  }
}
```

### Ejemplo con Errores de Validación

```typescript
import { validationErrorResponse } from '@/lib/utils/api-error-response';

const validationErrors = ['Campo requerido', 'Formato inválido'];

return validationErrorResponse(validationErrors, session?.user?.role);
```

### Crear Errores Detallados

```typescript
import { createDetailedError } from '@/lib/utils/error-handler';

throw createDetailedError(
  'Customer data is required',
  'CUSTOMER_MISSING',
  { invoiceId, organizationId }
);
```

## Respuesta de Error - SUPER_ADMIN

```json
{
  "success": false,
  "error": "Error procesando solicitud",
  "details": {
    "message": "Customer data is required for XML transformation",
    "code": "CUSTOMER_MISSING",
    "context": {
      "invoiceId": "clx123...",
      "organizationId": "cly456..."
    },
    "timestamp": "2025-01-27T10:30:00.000Z",
    "userId": "user789",
    "userRole": "SUPER_ADMIN"
  },
  "_debug": "Super Admin Mode - Detalles completos"
}
```

## Respuesta de Error - Usuario Normal

```json
{
  "success": false,
  "error": "Error al procesar la solicitud. Por favor, intente nuevamente."
}
```

## Códigos de Error Comunes

- `CUSTOMER_MISSING`: Customer no encontrado
- `INVOICE_NOT_FOUND`: Factura no existe
- `VALIDATION_ERROR`: Error de validación de datos
- `HKA_ERROR`: Error en comunicación con HKA
- `XML_GENERATION_ERROR`: Error generando XML
- `PERMISSION_DENIED`: Sin permisos para la acción

## Helpers Disponibles

### createErrorResponse()
Respuesta de error principal con detección automática de rol

### notFoundResponse()
Helper para errores 404

### unauthorizedResponse()
Helper para errores 401

### validationErrorResponse()
Helper para errores de validación

### createDetailedError()
Crear errores personalizados con contexto

## Logging

Todos los errores se registran completamente usando el sistema de logging existente, independientemente del rol del usuario.

## Seguridad

- Información sensible se sanitiza en producción
- Stack traces solo visibles para SUPER_ADMIN
- Logs completos siempre disponibles en servidor

## Próximos Pasos

1. Integrar en todos los endpoints críticos
2. Agregar códigos de error específicos
3. Documentar todos los errores posibles
4. Crear panel de monitoreo de errores

