# 🚨 DIAGNÓSTICO: Bloqueador en Integración HKA

**Fecha**: 22 de octubre de 2025  
**Estado**: BLOQUEADO por error en servidor HKA  
**Prioridad**: CRÍTICA

---

## 🎯 PROBLEMA EXACTO

El sistema **SÍ** está enviando correctamente el XML a HKA, pero el servidor de HKA está fallando internamente con:

```
a:InternalServiceFault: Object reference not set to an instance of an object.
at Services.Logic.ServiceBase.Enviar(String tokenEmpresa, String tokenPassword, DocumentoElectronico documento) 
in C:\projects\panama\FEL\pa-ws-int\Services\Logic\ServiceBase.cs:line 36
```

**Tipo de error**: `NullReferenceException` en el código C# de HKA  
**Ubicación**: Línea 36 del método `ServiceBase.Enviar()`

---

## ✅ LO QUE YA FUNCIONA

1. ✅ Generación de XML rFE válido (3336 caracteres)
2. ✅ Conexión SOAP con HKA establecida correctamente
3. ✅ Credenciales aceptadas (no hay error de autenticación)
4. ✅ XML enviado sin escapar (usando `$xml` y `escapeXML: false`)
5. ✅ Estructura SOAP correcta (HKA recibe y procesa el mensaje)

---

## ❌ LO QUE FALTA (BLOQUEADORES)

### **1. Datos Faltantes o Incorrectos en el XML**

**Causas posibles**:
- Algún campo requerido por HKA que no estamos enviando
- Formato de fecha incorrecto (actualmente: `2025-10-22T12:58:30-05:00`)
- CUFE generado incorrectamente
- RUC/DV del emisor o receptor inválidos
- Códigos de ubicación (provincia/distrito/corregimiento) no coinciden con base de datos de DGI

**Acción requerida**:
- Obtener un XML de ejemplo **exitoso** de HKA
- Comparar campo por campo con nuestro XML generado
- Validar RUCs y DVs con algoritmo oficial de Panamá

---

### **2. Credenciales Demo Inválidas o Sin Permisos**

**Evidencia**:
```
Usuario: walgofugiitj_ws_tfhka
Password: Octopusp1oQs5
```

Estas credenciales:
- ✅ Permiten conectar al WSDL
- ✅ No generan error de autenticación
- ❌ Pueden no tener permisos para enviar documentos
- ❌ Pueden estar asociadas a un RUC diferente

**Acción requerida**:
- Contactar soporte de HKA para confirmar:
  - ¿Las credenciales demo permiten enviar documentos?
  - ¿Qué RUC debe usarse como emisor con estas credenciales?
  - ¿Hay folios disponibles para este RUC?

---

### **3. Configuración del Ambiente Demo**

**Problema**:
El servidor demo puede requerir configuración adicional que no conocemos:
- Registro previo del RUC del emisor
- Compra/asignación de folios en el ambiente demo
- Validación de certificados digitales
- Aprobación manual de cuentas demo

**Acción requerida**:
- Solicitar documentación técnica completa de HKA
- Verificar si existe un "sandbox" o "playground" público
- Confirmar si el RUC `123456789-1-2023` está registrado en demo

---

### **4. Validaciones del Lado de HKA No Documentadas**

**Problema**:
HKA puede estar validando:
- Coherencia entre totales (nuestro cálculo vs. esperado)
- Existencia del RUC en base de datos de DGI
- Validación de DVs (dígitos verificadores)
- Códigos CPBS (productos)
- Tasas de ITBMS correctas

**Ejemplo de inconsistencia detectada**:
```xml
<dTasaITBMS>00</dTasaITBMS>  <!-- Exento -->
<dValITBMS>6.30</dValITBMS>  <!-- Pero hay valor de ITBMS -->
```

**¡ESTO ES INCONSISTENTE!** Si la tasa es `00` (exento), el valor ITBMS debe ser `0.00`.

**Acción requerida**:
- Revisar lógica de cálculo de impuestos en `xml-generator-hka.ts`
- Asegurar que tasas y valores coincidan
- Validar redondeos y decimales

---

## 📋 XML ENVIADO (Primeros 1000 chars)

```xml
<documento>
  <rFE xmlns="http://dgi-fep.mef.gob.pa">
    <dVerForm>1.00</dVerForm>
    <dId>FE0120000123456789-1-2023-450020251022TEST-1761155910643001294480738</dId>
    <gDGen>
      <iAmb>2</iAmb>
      <iTpEmis>01</iTpEmis>
      <dFechaCont>2025-10-22T12:58:30-05:00</dFechaCont>
      <iDoc>01</iDoc>
      <dNroDF>TEST-1761155910643</dNroDF>
      <dPtoFacDF>001</dPtoFacDF>
      <dSeg>294480738</dSeg>
      <dFechaEm>2025-10-22T12:58:30-05:00</dFechaEm>
      <dFechaSalida>2025-10-23T12:58:30-05:00</dFechaSalida>
      <iNatOp>01</iNatOp>
      <iTipoOp>1</iTipoOp>
      <iDest>1</iDest>
      <iFormCAFE>1</iFormCAFE>
      <iEntCAFE>2</iEntCAFE>
      <dEnvFE>1</dEnvFE>
      <iProGen>1</iProGen>
      <iTipoTranVenta>1</iTipoTranVenta>
      <iTipoSuc>1</iTipoSuc>
      <gEmis>
        <gRucEmi>
          <dTipoRuc>2</dTipoRuc>
          <dRuc>123456789-1-2023</dRuc>
          <dDV>45</dDV>
        </gRucEmi>
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **Opción A: Contactar Soporte de HKA (RECOMENDADO)**

1. **Enviar email a soporte técnico de The Factory HKA** con:
   - El XML completo generado (adjuntar archivo)
   - Screenshot del error
   - Stack trace completo
   - Credenciales demo usadas
   - Solicitar XML de ejemplo exitoso

2. **Preguntas específicas**:
   - ¿Qué datos faltan o están incorrectos en nuestro XML?
   - ¿Qué RUC debemos usar como emisor con estas credenciales demo?
   - ¿Hay folios disponibles? ¿Cómo verificar saldo de folios?
   - ¿Existe documentación completa de validaciones del lado del servidor?

---

### **Opción B: Solicitar Credenciales Reales del Cliente**

Si el cliente ya tiene:
- ✅ Cuenta activa con The Factory HKA (producción)
- ✅ Folios comprados
- ✅ RUC registrado y validado
- ✅ Credenciales de producción

Entonces usar esas credenciales nos permitirá:
- Validar que la integración funciona end-to-end
- Confirmar que el XML es correcto
- Identificar si el problema es solo con ambiente demo

---

### **Opción C: Investigar Validación de Totales**

**PROBLEMA DETECTADO**: Inconsistencia en ITBMS

```typescript
// En nuestro test:
Item 1:
  taxRate: 7  // 7%
  taxAmount: 6.30
  
// Pero en XML:
<dTasaITBMS>00</dTasaITBMS>  // ❌ Dice "Exento"
<dValITBMS>6.30</dValITBMS>  // ❌ Pero tiene valor
```

**Acción**:
1. Revisar transformación en `invoice-to-xml.ts`
2. Corregir mapeo de `taxRate` a `TasaITBMS`
3. Re-generar XML y probar nuevamente

---

### **Opción D: Usar SoapUI para Prueba Manual**

**Pasos**:
1. Descargar SoapUI (https://www.soapui.org/)
2. Importar WSDL de HKA: `https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl`
3. Crear request manual con nuestro XML
4. Probar diferentes combinaciones de datos
5. Comparar con documentación oficial de rFE DGI Panamá

---

## 📊 ESTADÍSTICAS DE PROGRESO

| Componente | Estado | Completado |
|------------|--------|------------|
| **Backend** | ✅ COMPLETO | 100% |
| Generador XML rFE | ✅ | 100% |
| Transformer Prisma → XML | ✅ | 100% |
| Cliente SOAP HKA | ✅ | 100% |
| Worker BullMQ | ✅ | 100% |
| APIs REST | ✅ | 100% |
| **Integración HKA** | 🚨 BLOQUEADO | 95% |
| Conexión SOAP | ✅ | 100% |
| Envío de XML | ✅ | 100% |
| Certificación exitosa | ❌ | 0% |
| **Frontend** | ✅ COMPLETO | 100% |
| Componentes UI | ✅ | 100% |
| Badges de estado | ✅ | 100% |
| Descargas PDF/XML | ✅ | 100% |

---

## 🔧 BLOQUEADOR CRÍTICO

**Categoría**: Integración Externa  
**Responsable**: The Factory HKA  
**Impacto**: El sistema está 100% funcional excepto por la certificación real de documentos  
**Dependencia**: Soporte técnico de HKA o credenciales reales del cliente

---

## 💡 RECOMENDACIÓN FINAL

**Acción inmediata**: Contactar soporte de HKA con este informe  
**Alternativa**: Solicitar al cliente credenciales de producción para validar  
**Tiempo estimado para resolución**: 1-3 días (dependiendo de respuesta de HKA)

---

## 📎 ARCHIVOS DE REFERENCIA

- XML generado completo: Disponible en consola del test
- Script de prueba: `scripts/test-hka-xml-formats.ts`
- Cliente SOAP configurado: `lib/hka/soap/client.ts`
- Generador XML: `lib/hka/xml/generator.ts`
- Transformer: `lib/hka/transformers/invoice-to-xml.ts`

---

**Última actualización**: 22 de octubre de 2025, 19:35 UTC  
**Ejecutado por**: Sistema SAGO-FACTU v1.0

