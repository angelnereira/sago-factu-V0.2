# 🔧 STATUS: Integración HKA con Credenciales Reales

**Fecha**: 22 de Octubre, 2025  
**Status**: ⚠️ En progreso - Ajustando formato de envío

---

## ✅ CREDENCIALES HKA DEMO CONFIGURADAS

```env
HKA_ENV="demo"
HKA_DEMO_SOAP_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_DEMO_TOKEN_USER="walgofugiitj_ws_tfhka"
HKA_DEMO_TOKEN_PASSWORD="Octopusp1oQs5"
HKA_DEMO_REST_URL="https://demointegracion.thefactoryhka.com.pa"
```

---

## 📊 PROGRESO ACTUAL

### ✅ **LO QUE FUNCIONA:**
1. ✅ Cliente SOAP se inicializa correctamente
2. ✅ Conexión con HKA establecida
3. ✅ WSDL cargado sin errores
4. ✅ Métodos detectados (9 métodos)
5. ✅ XML generado correctamente (3,375 caracteres)
6. ✅ CUFE generado
7. ✅ Credenciales válidas

### ⚠️ **PROBLEMA ACTUAL:**

**Error**: `DeserializationFailed - Error in line 1 position 513`

**Mensaje completo**:
```
The formatter threw an exception while trying to deserialize the message: 
There was an error while trying to deserialize parameter http://tempuri.org/:documento. 
The InnerException message was 'Error in line 1 position 513. 
Expecting state 'Element'.. Encountered 'Text' with name '', namespace ''.
```

**Causa**: 
HKA espera que el parámetro `documento` sea un **elemento XML complejo**, no un **string de texto**.

El servicio SOAP de HKA usa `DataContractSerializer` de .NET WCF, que espera que el XML del documento electrónico sea un objeto deserializable, no texto escapado.

---

## 🔍 ANÁLISIS TÉCNICO

### **Request Actual** (lo que estamos enviando):
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Enviar xmlns="http://tempuri.org/">
      <tokenEmpresa>walgofugiitj_ws_tfhka</tokenEmpresa>
      <tokenPassword>Octopusp1oQs5</tokenPassword>
      <documento>
        &lt;rFE xmlns=&quot;http://dgi-fep.mef.gob.pa&quot;&gt;
          &lt;dVerForm&gt;1.00&lt;/dVerForm&gt;
          ...
        &lt;/rFE&gt;
      </documento>
    </Enviar>
  </soap:Body>
</soap:Envelope>
```

**Problema**: El XML está **escapado** (`&lt;` en lugar de `<`)

### **Request Esperado** (lo que HKA necesita):
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Enviar xmlns="http://tempuri.org/">
      <tokenEmpresa>walgofugiitj_ws_tfhka</tokenEmpresa>
      <tokenPassword>Octopusp1oQs5</tokenPassword>
      <documento>
        <rFE xmlns="http://dgi-fep.mef.gob.pa">
          <dVerForm>1.00</dVerForm>
          ...
        </rFE>
      </documento>
    </Enviar>
  </soap:Body>
</soap:Envelope>
```

**Solución**: El XML debe ir **sin escapar** como elemento XML anidado.

---

## 🛠️ SOLUCIONES INTENTADAS

### **Intento 1**: Remover declaración XML ❌
- Removimos `<?xml version="1.0" encoding="UTF-8"?>`
- Resultado: Mismo error

### **Intento 2**: Cambiar SOAP 1.2 a SOAP 1.1 ❌
- Cambiamos `forceSoap12Headers: true` a `false`
- Resultado: Mismo error

### **Intento 3**: Headers personalizados ❌
- Añadimos `Accept-Encoding: gzip,deflate`
- Resultado: Mismo error

---

## 🎯 PRÓXIMOS PASOS

### **Opción A**: Modificar el cliente SOAP
Necesitamos que `node-soap` envíe el parámetro `documento` como **XML embebido**, no como texto.

Posibles soluciones:
1. Usar `args` con tipo `any` en lugar de string
2. Configurar `node-soap` para no escapar ciertos parámetros
3. Crear un custom serializer

### **Opción B**: Consultar documentación HKA
¿Tienes acceso a:
- Documentación técnica de integración HKA?
- Ejemplos de requests SOAP exitosos?
- Postman collection o similar?
- Soporte técnico de The Factory HKA?

### **Opción C**: Usar REST API en lugar de SOAP
HKA también tiene una REST API:
```
HKA_DEMO_REST_URL="https://demointegracion.thefactoryhka.com.pa"
```

Podría ser más sencillo trabajar con REST que con SOAP.

---

## 📋 CHECKLIST DE DIAGNÓSTICO

- [x] Credenciales configuradas
- [x] Cliente SOAP inicializado
- [x] Conexión establecida
- [x] WSDL cargado
- [x] Métodos detectados
- [x] XML generado correctamente
- [x] CUFE generado
- [x] Request enviado
- [ ] **Request con formato correcto** ⬅️ **BLOQUEADOR ACTUAL**
- [ ] Respuesta exitosa de HKA

---

## 💡 RECOMENDACIONES

### **Recomendación 1**: Contactar soporte HKA
The Factory HKA tiene soporte técnico que puede proporcionar:
- Ejemplos de requests exitosos
- Documentación detallada del SOAP
- Ayuda con el formato correcto

### **Recomendación 2**: Usar REST API
Si HKA tiene una REST API (que por la URL parece que sí), podría ser más fácil:
```typescript
// En lugar de SOAP
fetch('https://demointegracion.thefactoryhka.com.pa/api/enviar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tokenEmpresa: 'xxx',
    tokenPassword: 'xxx',
    documento: xmlBase64, // o XML directo
  })
});
```

### **Recomendación 3**: Verificar con Postman
Si tienes Postman, podemos:
1. Importar el WSDL
2. Hacer un request manual
3. Ver exactamente qué formato necesita HKA

---

## 📞 SIGUIENTE PASO

**¿Tienes?**:
- [ ] Documentación técnica de HKA
- [ ] Ejemplos de requests exitosos
- [ ] Postman collection
- [ ] Contacto de soporte técnico HKA

**Si no**, podemos:
1. Investigar cómo modificar `node-soap` para enviar XML embebido
2. Probar con la REST API si está disponible
3. Contactar a The Factory HKA para soporte

---

**Status**: ⏸️ **PAUSADO** - Esperando:
- Documentación de HKA sobre formato de request
- O intentar REST API en lugar de SOAP

