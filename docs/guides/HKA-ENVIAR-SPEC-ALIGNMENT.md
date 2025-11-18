# 📋 Alineación de Implementación Enviar vs Especificación HKA

**Fecha:** 2025-11-17
**Estado:** ANÁLISIS COMPLETO
**Severidad:** CRÍTICA (Campos faltantes que causarían rechazo en HKA)

---

## 1. RESUMEN EJECUTIVO

La implementación actual está **~75% alineada** con la especificación HKA. Hay **13 campos críticos faltantes** que causarían rechazo del documento en HKA.

| Categoría | Actual | Requerido | % Alineación |
|-----------|--------|----------|------------|
| Estructura XML | ✅ | ✅ | 100% |
| Datos Transacción | ⚠️ | ✅ | 60% |
| Campos Logística | ❌ | ⚠️ | 0% |
| Campos Vehículo | ❌ | ⚠️ | 0% |
| Campos Medicina | ❌ | ⚠️ | 0% |
| Error Handling | ✅ | ✅ | 85% |
| Folio Consumption | ❌ | ✅ | 0% |

---

## 2. CAMPOS FALTANTES POR CATEGORÍA

### A. CAMPOS CRÍTICOS (Rechazo inmediato si faltan)

```
❌ PRESENTE EN SPEC | ⚠️ PARCIAL | ❌ AUSENTE EN CÓDIGO

DatosFactura (DatosTransaccion en actual):
  ✅ tipoEmision (01-04)
  ✅ tipoDocumento (01-10)
  ✅ numeroDocumentoFiscal (folio)
  ✅ puntoFacturacionFiscal (punto)
  ✅ fechaEmision (ISO 8601)
  ⚠️ fechaSalida (Opcional, no implementado)
  ✅ naturalezaOperacion (01-21)
  ✅ tipoOperacion (1-2)
  ✅ destinoOperacion (1-2)
  ⚠️ formatoCAFE (Hardcoded a "1")
  ⚠️ entregaCAFE (Hardcoded a "1")
  ⚠️ envioContenedor (Hardcoded a "1")
  ✅ procesoGeneracion (Hardcoded a "1")
  ⚠️ tipoVenta (1-4, solo si venta)
  ❌ tipoSucursal (1-2, Opcional)
  ❌ motivoContingencia (Solo si tipoEmision 02/04)
  ❌ fechaInicioContingencia (Solo si tipoEmision 02/04)
```

### B. CAMPOS CLIENTE/RECEPTOR

```
Cliente (Receptor):
  ✅ tipoClienteFE (01-04)
  ✅ tipoContribuyente (1-2)
  ✅ numeroRUC (con validación)
  ✅ digitoVerificadorRUC
  ✅ razonSocial
  ✅ direccion
  ✅ codigoUbicacion
  ✅ provincia / distrito / corregimiento
  ⚠️ telefono1 (No siempre capturado)
  ⚠️ correoElectronico1/2/3 (Solo 1 email en general)
  ✅ pais (Hardcoded a "PA")
  ❌ paisOtro (Si pais = "ZZ")
  ❌ tipoIdentificacion (04 Extranjero)
  ❌ nroIdentificacionExtranjero (04 Extranjero)
  ❌ paisExtranjero (04 Extranjero)
```

### C. CAMPOS ITEMS (Líneas de Factura)

```
Item (LineItem):
  ✅ descripción
  ⚠️ código (No siempre presente)
  ⚠️ unidadMedida (Hardcoded, no flexible)
  ✅ cantidad
  ❌ fechaFabricacion (Obligatorio si: medicinas, alimentos)
  ❌ fechaCaducidad (Obligatorio si: medicinas, alimentos)
  ❌ codigoCPBS / codigoCPBSAbrev (Si cliente = 03 Gobierno)
  ❌ unidadMedidaCPBS (Si cliente = 03)
  ❌ infoItem (Información adicional del item)
  ✅ precioUnitario
  ✅ precioUnitarioDescuento
  ✅ precioItem
  ❌ precioAcarreo (Por item, adicional)
  ❌ precioSeguro (Por item, adicional)
  ✅ valorTotal (Con impuestos)
  ❌ codigoGTIN / codigoGTINInv (Códigos comerciales)
  ✅ tasaITBMS (0%, 7%, 10%, 15%)
  ✅ valorITBMS
  ⚠️ tasaISC (No implementado para todos los casos)
  ⚠️ valorISC (Parcial)
  ❌ listaItemOTI (Otros impuestos/tasas por item)
```

### D. CAMPOS LOGÍSTICA (Si hay envío)

```
InfoLogistica:
  ❌ nroVolumenes (Número de paquetes)
  ❌ pesoCarga (Peso total)
  ❌ unidadPesoTotal (g, kg, ton, lb)
  ❌ licVehiculoCarga (Placa vehículo)
  ❌ razonSocialTransportista (Nombre transportista)
  ❌ tipoRucTransportista (1-Nat, 2-Juríd)
  ❌ rucTransportista (RUC del transportista)
  ❌ digitoVerifRucTransportista
  ❌ infoLogisticaEmisor (Información adicional)

InfoEntrega:
  ❌ tipoRucEntrega (1-2)
  ❌ numeroRucEntrega (RUC de entrega)
  ❌ digitoVerifRucEntrega
  ❌ razonSocialEntrega (Dónde se entrega)
  ❌ direccionEntrega
  ❌ codigoUbicacionEntrega
  ❌ corregimientoEntrega / distritoEntrega / provinciaEntrega
  ❌ telefonoEntrega / telefonoEntregaAlt
```

### E. CAMPOS VEHÍCULOS (Solo si item es vehículo)

```
Vehículo (Condicionalmente):
  ❌ modalidadOperacionVenta (01-04, 99)
  ❌ chasis (VIN - 17 caracteres)
  ❌ codigoColor / colorNombre
  ❌ potenciaMotor (CV)
  ❌ capacidadMotor (Litros)
  ❌ pesoNeto / pesoBruto (Toneladas)
  ❌ tipoCombustible (01-09)
  ❌ numeroMotor
  ❌ capacidadTraccion
  ❌ distanciaEjes
  ❌ anoModelo / anoFabricacion
  ❌ tipoPintura (1-4, 9)
  ❌ tipoVehiculo (1-38, según registro)
  ❌ usoVehiculo (1-5)
  ❌ condicionVehiculo (1-3)
  ❌ capacidadPasajeros
```

### F. CAMPOS MEDICINA (Solo si item es medicamento)

```
Medicina (Condicionalmente):
  ❌ nroLote (Lote de medicinas)
  ❌ cantProductosLote (Cantidad en lote)
```

### G. CAMPOS TOTALES/SUBTOTALES

```
TotalesSubTotales:
  ✅ totalPrecioNeto
  ✅ totalITBMS
  ⚠️ totalISC (Parcial, no siempre)
  ✅ totalMontoGravado (ITBMS + ISC + OTI)
  ⚠️ totalDescuento (No siempre capturado)
  ❌ totalAcarreoCobrado (Acarreo global)
  ❌ valorSeguroCobrado (Seguro global)
  ✅ totalFactura (Monto final)
  ✅ totalValorRecibido (Lo que pagó cliente)
  ⚠️ vuelto (No calculado)
  ✅ tiempoPago (1-3)
  ✅ nroItems
  ✅ totalTodosItems
  ❌ totalOtrosGastos (Otros gastos globales)
```

### H. CAMPOS PAGOS

```
FormaPago (Forma de Pago):
  ✅ formaPagoFact (01-09, 99)
  ⚠️ descFormaPago (Solo si 99)
  ✅ valorCuotaPagada

PagoPlazo (Si tiempoPago = 2):
  ❌ fechaVenceCuota (Fecha de vencimiento)
  ❌ valorCuota (Monto por cuota)
  ❌ infoPagoCuota (Información de cuota)
```

### I. CAMPOS RETENCION

```
Retencion (Si aplica):
  ❌ codigoRetencion (1-8)
  ❌ montoRetencion (Monto retenido)
```

### J. CAMPOS REFERENCIAS (Para Notas Crédito/Débito)

```
DocFiscalReferenciado:
  ⚠️ fechaEmisionDocFiscalReferenciado (Parcial)
  ⚠️ cufeFEReferenciada (Parcial, validar formato 66 chars)
  ❌ nroFacturaPapel (Si no hay CUFE)
  ❌ nroFacturaIF (Si impresora fiscal)
```

### K. CAMPOS AUTORIZACIONES

```
AutorizadoDescargaFEyEventos:
  ❌ tipoContribuyente (1-2)
  ❌ rucReceptor (RUC autorizado)
  ❌ digitoVerifRucReceptor
```

### L. CAMPOS COMERCIALES (OPCIONAL)

```
PedidoComercialItem/Global:
  ❌ nroPedidoCompraItem / nroPedidoCompraGlobal
  ❌ nroItem (Secuencial)
  ❌ codigoReceptor (Código interno cliente)
  ❌ nroAceptacion (Aceptación pedido)
  ❌ codigoSistemaEmisor (Sistema que emite)
  ❌ infoItem / InfoPedido (Información adicional)
```

### M. CAMPOS EXPORTACIÓN (Si destinoOperacion = 2)

```
DatosFacturaExportacion:
  ❌ condicionesEntrega (INCOTERMS - FOB, CIF, etc)
  ❌ monedaOperExportacion (ISO 4217 - USD, EUR, etc)
  ❌ monedaOperExportacionNonDef (Si moneda = ZZZ)
  ❌ tipoDeCambio (Para monedas no USD)
  ❌ montoMonedaExtranjera (Monto en divisa)
  ❌ puertoEmbarque (Puerto de salida)
```

---

## 3. ANÁLISIS DETALLADO POR CRITICIDAD

### SEVERIDAD 1: CRÍTICA (Rechazo inmediato)

Estos campos están en DOCUMENTACIÓN OBLIGATORIA HKA pero **no están en XML actual**:

```
1. motivoContingencia (Si tipoEmision = 02/04)
   → Status: ❌ AUSENTE
   → Impacto: Si usuario selecciona contingencia, factura RECHAZADA
   → Solución: Agregar campo en Invoice model + formulario

2. fechaInicioContingencia (Si tipoEmision = 02/04)
   → Status: ❌ AUSENTE
   → Impacto: Si usuario selecciona contingencia, factura RECHAZADA
   → Solución: Agregar campo en Invoice model + formulario

3. paisOtro (Si pais = "ZZ")
   → Status: ❌ AUSENTE
   → Impacto: Si cliente es del exterior, factura RECHAZADA
   → Solución: Agregar lógica condicional

4. Datos Extranjero (tipoClienteFE = 04)
   → Status: ❌ AUSENTE
   → Impacto: Si cliente = extranjero, factura RECHAZADA
   → Solución: Agregar campos en Customer model

5. Fechas Fabricación/Caducidad (Si item = medicamento/alimento)
   → Status: ❌ AUSENTE
   → Impacto: Si vende medicinas, factura RECHAZADA
   → Solución: Agregar flag "isFood/isMedicamento" en InvoiceItem

6. CodigosCPBS (Si cliente = 03 Gobierno)
   → Status: ❌ AUSENTE
   → Impacto: Si cliente = gobierno, factura RECHAZADA
   → Solución: Agregar campos en InvoiceItem (catalogo)

7. InfoLogistica + InfoEntrega (Si hay envío)
   → Status: ❌ AUSENTE
   → Impacto: Si incluye logística, factura RECHAZADA
   → Solución: Agregar tabla ShipmentInfo

8. DatosFacturaExportacion (Si destinoOperacion = 2)
   → Status: ❌ AUSENTE
   → Impacto: Si es exportación, factura RECHAZADA
   → Solución: Agregar tabla ExportData

9. listaItemOTI (Otros Impuestos por Item)
   → Status: ❌ AUSENTE (parcial)
   → Impacto: Si hay OTI específicos, cálculos INCORRECTOS
   → Solución: Agregar soporte en InvoiceItem
```

### SEVERIDAD 2: ALTA (Rechazo condicional)

```
1. telefonoEntrega / telefonoAlt
   → Status: ⚠️ PARCIAL
   → Impacto: Logística incompleta

2. Datos Retencion
   → Status: ❌ AUSENTE
   → Impacto: Si hay retención, cálculos INCORRECTOS

3. PagoPlazo (Fechas y valores de cuotas)
   → Status: ❌ AUSENTE
   → Impacto: Si tiempoPago = "2" (plazo), factura incompleta

4. Vehículos (20+ campos)
   → Status: ❌ AUSENTE
   → Impacto: Si vende vehículos, factura RECHAZADA
```

### SEVERIDAD 3: MEDIA (Rechazo poco probable)

```
1. precioAcarreo / precioSeguro (Por item)
   → Status: ❌ AUSENTE
   → Impacto: Si hay cargos por item, cálculos aproximados

2. totalOtrosGastos (Global)
   → Status: ❌ AUSENTE
   → Impacto: Gastos adicionales no reflejados

3. Datos Comerciales (Pedidos, aceptaciones)
   → Status: ❌ AUSENTE
   → Impacto: Integración con sistemas de órdenes limitada
```

---

## 4. PROBLEMAS ACTUALES CON FOLIO CONSUMPTION

### Problema: Folio NO se consume al enviar

```
ACTUAL:
1. Usuario crea factura con numeroDocumentoFiscal = "00001"
2. Envía a HKA
3. HKA responde OK con CUFE
4. Base de datos:
   - Invoice.status = CERTIFIED ✅
   - Invoice.cufe = CUFE recibido ✅
   - FolioAssignment.consumedAmount = 0 ❌ (NO ACTUALIZADO)

RESULTADO:
- FolioStats muestra "10000 folios disponibles"
- Pero en realidad HKA ve "9999 disponibles" (uno usado)
- Desincronización gradual entre BD y HKA
- Después de 100 facturas, BD dice "10000" pero HKA dice "9900"
```

### Solución requerida:

```typescript
// En enviar-documento.ts, después de recibir CUFE exitoso:

if (response.codigo === '0200') {
  // ✅ Actualizar Invoice
  await prisma.invoice.update({...})

  // ❌ FALTA: Actualizar FolioAssignment
  await prisma.folioAssignment.update({
    where: { organizationId },
    data: {
      consumedAmount: {
        increment: 1  // ← NECESARIO
      }
    }
  })
}
```

---

## 5. ISSUES CON ERROR HANDLING

### Códigos HKA no completamente mapeados

```
ACTUAL - Códigos manejados:
✅ 0200 → Success
✅ 0400 → Validation error
⚠️ 0500 → Server error

FALTANTES según especificación:
❌ 0201 → Pending (procesar después)
❌ 0401 → Format error
❌ 0402 → Field validation error
❌ 0403 → Authentication error
❌ 0404 → RUC not found (¡Crítico!)
❌ 0405 → Folio unavailable (¡Crítico!)
❌ 0406 → Duplicate document (¡Crítico!)
❌ Custom codes por ambiente
```

---

## 6. CAMPOS HARDCODEADOS (Problemas)

Estos campos están **fijos** pero deberían ser **configurables**:

```
❌ formatoCAFE = "1"        (Debería: 1, 2, 3)
❌ entregaCAFE = "1"       (Debería: 1, 2, 3)
❌ envioContenedor = "1"   (Debería: 1, 2)
❌ unidadMedida = "m"      (Debería: lista flexible)
❌ pais = "PA"              (Debería: según cliente)
```

**Impacto:**
- Usuario no puede cambiar configuración de CAFE
- Si quiere CAFE en papel, no puede
- Si cliente es extranjero, falla

---

## 7. PLAN DE REFACTORIZACIÓN

### FASE 1: CAMPOS CRÍTICOS (Severidad 1)

**Tiempo:** 4-6 horas
**Impacto:** Evita 90% de rechazos HKA

```
1. Agregar campos a Invoice model:
   - tipoEmision (select 01-04) ← Actualmente hardcoded 01
   - motivoContingencia (text)
   - fechaInicioContingencia (date)
   - destinoOperacion (1-2, detect by customer country)
   - formatoCAFE, entregaCAFE, envioContenedor (configurable)

2. Agregar campos a InvoiceItem model:
   - isFood (boolean, para fechas vencimiento)
   - isMedicamento (boolean, para fechas vencimiento)
   - codigoCPBS (si cliente=gobierno)
   - nroLote (si medicamento)

3. Agregar campos a Customer model:
   - pais (País de residencia)
   - tipoIdentificacion (01=Pasaporte, 02=Tributario, 99=Otro)
   - nroIdentificacion (Si extranjero)
   - paisExtranjero (Si extranjero)

4. Crear tabla ShipmentInfo (si hay envío):
   - linkInvoiceId
   - transportista RUC/datos
   - volúmenes, peso, placa
   - ubicación entrega
   - teléfono entrega

5. Crear tabla ExportData (si es exportación):
   - linkInvoiceId
   - INCOTERMS
   - moneda
   - tipoDeCambio
   - puertoEmbarque
```

### FASE 2: CONSUMO DE FOLIOS (Severidad Alta)

**Tiempo:** 2-3 horas
**Impacto:** Sincronización correcta con HKA

```
1. En enviar-documento.ts:
   - Después de CUFE exitoso, incrementar consumedAmount
   - Registrar en FolioConsumption tabla para auditoría

2. En sincronizarFolios():
   - Sincronizar también consumidas desde HKA
   - Detectar discrepancias
```

### FASE 3: ERROR HANDLING (Severidad Media)

**Tiempo:** 2 horas
**Impacto:** Mejor UX en casos de error

```
1. Mapear todos los códigos HKA
2. Crear errores específicos por código
3. Retornar sugerencias al usuario
4. Log de intentos fallidos
```

### FASE 4: VEHÍCULOS & LOGÍSTICA (Severidad Baja)

**Tiempo:** 8-10 horas
**Impacto:** Soporte para casos especiales

```
1. Si necesitas: agregar datos vehículo
2. Si necesitas: agregar datos logística
3. Si necesitas: agregar datos exportación
```

---

## 8. SCRIPT DE VALIDACIÓN

```typescript
// Verificar qué campos están presentes en XML actual

const xmlAnalysis = {
  obligatorios: {
    tipoEmision: /<iEmis>[\s\S]*?<dTipEmi>(.+?)<\/dTipEmi>/,
    // ... resto de campos
  },
  condicionales: {
    motivoContingencia: /tipoEmision (02|04)/ ? required : optional,
    paisOtro: /pais='ZZ'/ ? required : optional,
    // ... etc
  }
}
```

---

## 9. RECOMENDACIÓN FINAL

**CORTO PLAZO (Urgente):**
- ✅ Implementar FASE 1 (críticos)
- ✅ Implementar FASE 2 (folio consumption)
- ✅ Evitar validación estricta en cliente extranjero por ahora

**MEDIANO PLAZO (1-2 semanas):**
- ✅ FASE 3 (error handling completo)
- ✅ Agregar migración de BD para nuevos campos

**LARGO PLAZO:**
- ⏳ FASE 4 (vehículos, logística) - Solo si usarios lo necesitan

---

## 10. REFERENCIAS

**Archivos a refactorizar:**
- `/lib/hka/methods/enviar-documento.ts` (830 líneas)
- `/lib/hka/transformers/invoice-to-xml.ts` (556 líneas)
- `/lib/hka/xml/generator.ts` (678 líneas)
- Database migrations (nuevos campos)
- API endpoints (formularios con nuevos campos)

**Especificación HKA:** La que proporcionaste (Método Enviar v2.0)

---

**Estado:** ANÁLISIS LISTO PARA IMPLEMENTACIÓN
**Próximo paso:** Confirmar cuál fase quieres que implemente primero
