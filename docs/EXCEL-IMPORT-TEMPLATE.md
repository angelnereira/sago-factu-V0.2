# 📊 PLANTILLA EXCEL PARA IMPORTAR FACTURAS

**Feature**: Importación de facturas desde Excel  
**Formatos**: .xlsx, .xls  
**Fecha**: 22 de octubre de 2025

---

## 🎯 FORMATOS SOPORTADOS

SAGO-FACTU puede importar facturas desde archivos Excel en dos formatos:

1. **Con Headers** (Recomendado)
2. **Sin Headers** (Formato simple)

---

## 📋 FORMATO 1: CON HEADERS (Recomendado)

### Estructura del Excel

El parser busca automáticamente las columnas por nombre. Puedes usar cualquiera de estos nombres:

#### Datos del Cliente
| Columna Española | Columna Inglesa | Ejemplo |
|------------------|-----------------|---------|
| Nombre / Cliente | Name / Customer | Juan Pérez S.A. |
| RUC / Cédula / NIT | TaxID / RUC | 12345678-1-123456 |
| Email / Correo | Email | cliente@example.com |
| Teléfono / Celular | Phone | +507 6000-0000 |
| Dirección | Address | Calle 50, Torre Global |
| Ciudad | City | Panamá |
| País | Country | PA |

#### Datos de Items
| Columna Española | Columna Inglesa | Ejemplo |
|------------------|-----------------|---------|
| Descripción / Producto / Servicio | Description / Product / Item | Servicio de Consultoría |
| Cantidad / Cant | Quantity / Qty | 5 |
| Precio / Valor Unitario | Price / Unit Price | 100.00 |
| Impuesto / ITBMS / IVA | Tax / Tax Rate | 7 |
| Descuento | Discount | 0 |

#### Información Adicional (Opcional)
| Columna Española | Columna Inglesa | Ejemplo |
|------------------|-----------------|---------|
| Notas / Observaciones | Notes / Comments | Pago en 30 días |
| Forma de Pago | Payment Method | Efectivo |

---

### Ejemplo Excel - Formato Con Headers

```
┌────────────────┬──────────────────────┬───────────────────────────┬────────────┬─────────┐
│ Nombre         │ RUC                  │ Email                     │ Teléfono   │ Dirección│
├────────────────┼──────────────────────┼───────────────────────────┼────────────┼─────────┤
│ Juan Pérez S.A.│ 12345678-1-123456    │ juan.perez@example.com    │ 6000-0000  │ Panamá  │
└────────────────┴──────────────────────┴───────────────────────────┴────────────┴─────────┘

┌──────────────────────────┬──────────┬─────────┬──────────┬───────────┐
│ Descripción              │ Cantidad │ Precio  │ Impuesto │ Descuento │
├──────────────────────────┼──────────┼─────────┼──────────┼───────────┤
│ Servicio de Consultoría  │ 5        │ 100.00  │ 7        │ 0         │
│ Desarrollo de Software   │ 10       │ 150.00  │ 7        │ 10.00     │
│ Hosting Anual            │ 1        │ 500.00  │ 7        │ 0         │
└──────────────────────────┴──────────┴─────────┴──────────┴───────────┘

┌────────────────────┬─────────────────┐
│ Notas              │ Forma de Pago   │
├────────────────────┼─────────────────┤
│ Pago en 30 días    │ Transferencia   │
└────────────────────┴─────────────────┘
```

---

## 📋 FORMATO 2: SIN HEADERS (Simple)

### Estructura del Excel

```
Fila 1: Cliente         | Juan Pérez S.A.
Fila 2: RUC             | 12345678-1-123456
Fila 3: Email           | juan.perez@example.com
Fila 4: Teléfono        | 6000-0000
Fila 5: Dirección       | Torre Global, Calle 50
Fila 6: (Vacía o separador)
Fila 7: Descripción     | Cantidad | Precio | Impuesto | Descuento
Fila 8: Item 1          | 5        | 100.00 | 7        | 0
Fila 9: Item 2          | 10       | 150.00 | 7        | 10.00
Fila 10: Item 3         | 1        | 500.00 | 7        | 0
```

### Ejemplo Excel - Formato Sin Headers

```
┌─────────────┬────────────────────────┐
│ Cliente     │ Juan Pérez S.A.        │
│ RUC         │ 12345678-1-123456      │
│ Email       │ juan.perez@example.com │
│ Teléfono    │ 6000-0000              │
│ Dirección   │ Torre Global, Calle 50 │
│             │                        │
│ Descripción             │ Cantidad │ Precio  │ Impuesto │ Descuento │
│ Servicio de Consultoría │ 5        │ 100.00  │ 7        │ 0         │
│ Desarrollo de Software  │ 10       │ 150.00  │ 7        │ 10.00     │
│ Hosting Anual           │ 1        │ 500.00  │ 7        │ 0         │
└─────────────┴────────────────────────┴──────────┴─────────┴──────────┴───────────┘
```

---

## 💾 PLANTILLAS DESCARGABLES

### Crear Plantilla en Excel

#### Opción 1: Formato Con Headers

1. **Hoja 1**: Datos del Cliente
   ```
   A1: Nombre
   B1: RUC
   C1: Email
   D1: Teléfono
   E1: Dirección
   
   A2: (tu cliente)
   B2: (RUC del cliente)
   C2: (email)
   D2: (teléfono)
   E2: (dirección)
   ```

2. **A partir de Fila 4**: Items
   ```
   A4: Descripción
   B4: Cantidad
   C4: Precio
   D4: Impuesto
   E4: Descuento
   
   A5: (descripción item 1)
   B5: (cantidad)
   C5: (precio)
   D5: 7
   E5: 0
   ```

#### Opción 2: Formato Sin Headers

```
A1: Cliente
B1: (Nombre del cliente)

A2: RUC
B2: (RUC del cliente)

A3: Email
B3: (email)

A4: Teléfono
B4: (teléfono)

A5: Dirección
B5: (dirección)

(Fila vacía)

A7: Descripción
B7: Cantidad
C7: Precio
D7: Impuesto
E7: Descuento

A8: (item 1)
B8: (cant)
C8: (precio)
D8: 7
E8: 0
```

---

## 🧪 EJEMPLO COMPLETO REAL

### Excel para Factura de Servicios

**Archivo**: `factura-ejemplo.xlsx`

#### Hoja de Datos:

| Nombre | RUC | Email | Teléfono | Dirección | Ciudad | País |
|--------|-----|-------|----------|-----------|--------|------|
| Empresa ABC S.A. | 12345678-1-123456 | contacto@abc.com | +507 6000-1234 | Ave. Balboa, Torre ABC | Panamá | PA |

| Descripción | Cantidad | Precio | Impuesto | Descuento |
|-------------|----------|--------|----------|-----------|
| Consultoría Tecnológica | 20 | 75.00 | 7 | 0 |
| Desarrollo Web | 1 | 3000.00 | 7 | 300.00 |
| Mantenimiento Mensual | 12 | 250.00 | 7 | 0 |
| Hosting y Dominio | 1 | 150.00 | 7 | 0 |

| Notas | Forma de Pago |
|-------|---------------|
| Proyecto Q4 2025 - Contrato #12345 | Transferencia ACH |

**Resultado al importar:**
- Cliente: Empresa ABC S.A.
- RUC: 12345678-1-123456
- 4 items con precios, cantidades y descuentos
- Nota incluida
- Forma de pago: Transferencia

---

## 🔍 VALIDACIONES

El parser de Excel realiza las siguientes validaciones:

### Validaciones Automáticas

✅ **Archivo**:
- Debe ser `.xlsx` o `.xls`
- Tamaño máximo: 5MB
- Debe tener al menos 1 hoja
- La hoja debe tener al menos 2 filas de datos

✅ **Datos del Cliente**:
- Si no se encuentra nombre, usa "Cliente Genérico"
- Si no se encuentra RUC, usa "000000000"
- Email y teléfono son opcionales

✅ **Items**:
- Debe haber al menos 1 item
- Descripción es obligatoria
- Cantidad por defecto: 1
- Precio por defecto: 0
- Impuesto por defecto: 7%
- Descuento por defecto: 0

---

## ⚠️ ERRORES COMUNES

### Error: "El archivo Excel está vacío"

**Causa**: La hoja no tiene datos  
**Solución**: Asegúrate de tener datos en la primera hoja

### Error: "El archivo Excel debe tener al menos 2 filas"

**Causa**: Solo hay 1 fila (headers)  
**Solución**: Agrega al menos 1 fila de datos

### Error: "El archivo Excel no tiene hojas"

**Causa**: El archivo está corrupto  
**Solución**: Vuelve a crear el Excel

### Warning: "No se encontraron items"

**Causa**: No hay columnas de productos/items  
**Solución**: Agrega al menos una fila con Descripción, Cantidad y Precio

---

## 💡 CONSEJOS

### Para Mejores Resultados

1. **Usa headers en español o inglés** - El parser reconoce ambos
2. **Primera hoja para datos** - Solo se lee la primera hoja del Excel
3. **Números sin formato** - Usa números simples (100.00, no $100.00)
4. **RUC completo** - Incluye guiones (12345678-1-123456)
5. **Email válido** - Formato: usuario@dominio.com
6. **Impuesto en porcentaje** - Usa 7 para 7%, no 0.07

### Formato de Números

✅ **Correcto**:
- Precio: `100.00`
- Cantidad: `5`
- Impuesto: `7`
- Descuento: `10.50`

❌ **Incorrecto**:
- Precio: `$100.00` (símbolo de moneda)
- Cantidad: `5 unidades` (texto adicional)
- Impuesto: `7%` (símbolo de porcentaje)
- Descuento: `10,50` (coma como decimal)

---

## 📊 COLUMNAS RECONOCIDAS

### Para Cliente

**Nombre del Cliente**:
- `nombre`, `name`, `cliente`, `customer`

**RUC/NIT/Cédula**:
- `ruc`, `taxid`, `tax`, `nit`, `cedula`

**Email**:
- `email`, `correo`

**Teléfono**:
- `telefono`, `phone`, `tel`, `celular`

**Dirección**:
- `direccion`, `address`, `direc`

**Ciudad**:
- `ciudad`, `city`

**País**:
- `pais`, `country`

### Para Items

**Descripción**:
- `descripcion`, `description`, `producto`, `product`, `item`, `servicio`

**Cantidad**:
- `cantidad`, `quantity`, `cant`, `qty`

**Precio Unitario**:
- `precio`, `price`, `valor`, `unitprice`, `unit`

**Impuesto**:
- `impuesto`, `tax`, `itbms`, `iva`, `taxrate`

**Descuento**:
- `descuento`, `discount`

### Para Información Adicional

**Notas**:
- `notas`, `notes`, `nota`, `comentario`, `observaciones`, `observ`

**Forma de Pago**:
- `pago`, `payment`, `formapago`, `paymentmethod`

---

## 🚀 USO EN LA APLICACIÓN

### Pasos para Importar

1. **Ir a Dashboard → Facturas → Nueva Factura**
2. **Click en "Cargar desde XML/Excel"**
3. **Seleccionar o arrastrar archivo .xlsx**
4. **Esperar procesamiento** (1-3 segundos)
5. **Revisar vista previa**:
   - Cliente
   - Items
   - Totales
6. **Click en "Aplicar Datos al Formulario"**
7. **Revisar y ajustar si es necesario**
8. **Guardar factura**

---

## 🔧 TROUBLESHOOTING

### El Excel no se procesa

1. **Verifica el formato**: ¿Es .xlsx o .xls?
2. **Abre en Excel**: ¿Se ve bien?
3. **Revisa la primera hoja**: ¿Tiene datos?
4. **Verifica los nombres de columnas**: ¿Están bien escritos?
5. **Prueba con plantilla de ejemplo**

### Los datos no se importan correctamente

1. **Revisa las columnas**: ¿Usan los nombres correctos?
2. **Verifica los números**: ¿Sin símbolos o texto?
3. **Chequea el RUC**: ¿Formato correcto?
4. **Prueba formato simple**: Sin headers

### Algunos items no aparecen

1. **Descripción vacía**: Asegúrate que todos los items tengan descripción
2. **Filas vacías**: Elimina filas vacías entre items
3. **Formato de números**: Usa números simples sin formato especial

---

## 📞 SOPORTE

Si tienes problemas:

1. **Descarga plantilla de ejemplo**
2. **Prueba con datos de prueba**
3. **Comparte tu Excel** (o screenshot) si persiste el error
4. **Revisa la consola del navegador** (F12) para errores

---

**Última actualización**: 22 de octubre de 2025  
**Versión del Parser**: 1.0  
**Librería**: xlsx (SheetJS)  
**Estado**: ✅ IMPLEMENTADO

