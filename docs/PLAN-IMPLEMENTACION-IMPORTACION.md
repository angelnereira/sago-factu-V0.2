# PLAN COMPLETO - SISTEMA DE IMPORTACIÓN DE FACTURAS

## RESUMEN EJECUTIVO

Implementar un sistema completo de importación que permita a los usuarios cargar facturas en múltiples formatos (Excel, CSV, JSON, XML) y convertirlas automáticamente al formato XML HKA/DGI.

## OBJETIVOS

1. Permitir importar facturas desde formatos externos
2. Validar datos antes del envío
3. Convertir a formato XML HKA/DGI
4. Enviar directamente a HKA
5. Feedback claro al usuario

## FORMATOS SOPORTADOS

### Excel (.xlsx, .xls)
- Hoja "Datos Generales": Emisor, Receptor, Datos del documento
- Hoja "Items": Lista de productos/servicios con detalles

### CSV
- Primera fila: Encabezados
- Filas siguientes: Items de factura

### JSON
- Estructura: documento, emisor, receptor, items

### XML
- Formato HKA/DGI directo (ya validado)

## ARQUITECTURA

```
Usuario
  ↓
Frontend Component (FileUploader)
  ↓
POST /api/importacion/procesar
  ↓
FileProcessor
  ├─ detectarFormato()
  ├─ procesarExcel() / CSV / JSON / XML
  ├─ normalizarDatos()
  ├─ calcularTotales()
  └─ validarFactura()
  ↓
transformInvoiceToXMLInput() (existente)
  ↓
generarXMLFactura() (existente)
  ↓
Return XML HKA/DGI
```

## ESTADO ACTUAL

### COMPLETADO
- Dependencias instaladas
- Tipos TypeScript definidos
- Relación customer en schema
- Arquitectura documentada

### PENDIENTE

#### 1. FileProcessor    
**Prioridad:** ALTA
**Tiempo estimado:** 4-6 horas
- Detectores de formato
- Parsers (Excel, CSV, JSON, XML)
- Normalizador
- Calculadora de totales
- Validador

#### 2. API Endpoint
**Prioridad:** ALTA
**Tiempo estimado:** 1-2 horas
- POST /api/importacion/procesar
- Manejo de FormData
- Autenticación
- Manejo de errores

#### 3. Componente UI
**Prioridad:** ALTA
**Tiempo estimado:** 3-4 horas
- FileUploader con drag & drop
- Vista previa
- Feedback visual
- Descarga XML
- Envío a HKA

#### 4. Plantilla Excel
**Prioridad:** MEDIA
**Tiempo estimado:** 1 hora
- Generar archivo Excel de ejemplo
- Documentación de uso

## FLUJO DE USUARIO

1. Usuario arrastra archivo o selecciona archivo
2. Sistema detecta formato automáticamente
3. Sistema parsea archivo y extrae datos
4. Sistema normaliza y calcula totales
5. Sistema valida datos (RUC, totales, etc.)
6. Sistema genera XML HKA/DGI
7. Sistema muestra vista previa
8. Usuario puede:
   - Descargar XML
   - Enviar a HKA directamente
   - Corregir errores

## CASOS DE ERROR

1. Formato no soportado → Mensaje claro
2. Campos faltantes → Lista simultáneamente  
3. RUC inválido → Validar DV
4. Totales incorrectos → Mostrar diferencia
5. Archivo corrupto → Mensaje de error genérico

## INTEGRACIÓN CON CÓDIGO EXISTENTE

- Usa `transformInvoiceToXMLInput()` existente
- Usa `generarXMLFactura()` existente
- Usa `validarDatosFactura()` existente
- Compatible con flujo de procesamiento actual

## PRÓXIMOS PASOS INMEDIATOS

1. Crear estructura básica de FileProcessor
2. Implementar parser Excel primero (más común)
3. Crear API endpoint básico
4. Crear componente UI básico
5. Testing con archivo de prueba
6. Iterar según feedback

## RECURSOS NECESARIOS

- Archivos de ejemplo para testing
- Documentación de formatos aceptados
- Plantilla Excel de ejemplo
- Guía de uso para usuarios

## MÉTRICAS DE ÉXITO

- Usuario puede importar factura en < 30 segundos
- Validación previene 100% de errores de formato
- XML generado es 100% compatible con HKA
- Feedback claro al usuario en caso de error

