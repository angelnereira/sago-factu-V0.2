# 🔍 DEBUG: Upload de XML

**Problema**: Error al subir XML - "El archivo no parece ser XML válido"  
**Fecha**: 22 de octubre de 2025  
**Estado**: En diagnóstico

---

## 🎯 MEJORAS APLICADAS

### 1. Manejo de BOM (Byte Order Mark)

El parser ahora elimina el BOM que pueden agregar algunos editores de texto:

```typescript
// Limpiar BOM si existe
let cleaned = xmlContent
if (cleaned.charCodeAt(0) === 0xFEFF) {
  cleaned = cleaned.slice(1)
}
```

### 2. Mejor Mensaje de Error

Ahora muestra los primeros 50 caracteres del archivo si no es XML válido:

```typescript
errors.push(`El archivo no parece ser XML válido. Primeros caracteres: "${trimmed.substring(0, 50)}"`)
```

---

## 🧪 CÓMO DIAGNOSTICAR

### Paso 1: Verificar el Archivo XML

Abre el archivo XML en un editor de texto y verifica:

1. **¿Empieza con `<?xml`?**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <rFE>
     ...
   </rFE>
   ```

2. **¿O empieza directamente con `<`?**
   ```xml
   <rFE>
     ...
   </rFE>
   ```

3. **¿Tiene caracteres extraños al inicio?**
   - BOM (invisible en algunos editores)
   - Espacios en blanco
   - Caracteres especiales

### Paso 2: Verificar el Tamaño

```bash
# El archivo debe ser menor a 5MB
ls -lh tu-archivo.xml
```

### Paso 3: Validar el XML

```bash
# En Linux/Mac
xmllint --noout tu-archivo.xml

# Si da error, el XML está mal formado
```

---

## 📋 FORMATOS SOPORTADOS

### 1. FEL Panamá (The Factory HKA)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dVerForm>1.00</dVerForm>
  <gDGen>
    <iAmb>2</iAmb>
    <dFechaCont>2025-10-22T10:00:00</dFechaCont>
    ...
  </gDGen>
  <gDatRec>
    <dNombRec>Cliente Name</dNombRec>
    <dRuc>12345678-1-123456</dRuc>
    ...
  </gDatRec>
  <gItem>
    <dDescProd>Producto 1</dDescProd>
    <dCantCodInt>1</dCantCodInt>
    <dPrUnit>100.00</dPrUnit>
    ...
  </gItem>
</rFE>
```

### 2. XML Genérico

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <Customer>
    <Name>Cliente Name</Name>
    <TaxID>12345678-1-123456</TaxID>
    <Email>cliente@example.com</Email>
  </Customer>
  <Items>
    <Item>
      <Description>Producto 1</Description>
      <Quantity>1</Quantity>
      <UnitPrice>100.00</UnitPrice>
    </Item>
  </Items>
</Invoice>
```

### 3. CFDI México

```xml
<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4">
  <cfdi:Receptor Nombre="Cliente" Rfc="XAXX010101000"/>
  <cfdi:Conceptos>
    <cfdi:Concepto Descripcion="Producto" Cantidad="1" ValorUnitario="100"/>
  </cfdi:Conceptos>
</cfdi:Comprobante>
```

---

## 🔧 PRUEBA MANUAL

### Crear XML de Prueba

Crea un archivo `test.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <Customer>
    <Name>Test Cliente</Name>
    <TaxID>123456789</TaxID>
    <Address>Calle Test 123</Address>
  </Customer>
  <Items>
    <Item>
      <Description>Producto Test</Description>
      <Quantity>2</Quantity>
      <UnitPrice>50.00</UnitPrice>
      <TaxRate>7</TaxRate>
      <Discount>0</Discount>
    </Item>
  </Items>
  <PaymentMethod>CASH</PaymentMethod>
  <Notes>Nota de prueba</Notes>
</Invoice>
```

### Subir en la Aplicación

1. Ir a Dashboard → Facturas → Nueva Factura
2. Click en "Cargar desde XML"
3. Seleccionar `test.xml`
4. Debe mostrar: "✅ XML procesado correctamente: 1 item(s) encontrado(s)"

---

## 🐛 ERRORES COMUNES

### Error: "El archivo está vacío"

**Causa**: El archivo no tiene contenido  
**Solución**: Verifica que el archivo tenga datos

### Error: "El archivo no parece ser XML válido"

**Causa**: El archivo no empieza con `<`  
**Solución**:
- Abre el archivo en un editor de texto
- Verifica que empiece con `<?xml` o `<`
- Elimina espacios en blanco al inicio
- Guarda con encoding UTF-8

### Error: "Error al parsear el XML: ..."

**Causa**: El XML está mal formado  
**Solución**:
- Valida el XML con `xmllint`
- Verifica que todas las etiquetas cierren correctamente
- Verifica que no haya caracteres especiales sin escapar

### Error: "Formato de XML no reconocido"

**Causa**: El XML no tiene ninguna estructura conocida  
**Solución**:
- Verifica que tenga `<rFE>`, `<Invoice>` o `<cfdi:Comprobante>` como raíz
- Adapta el XML al formato genérico mostrado arriba

### Error: "El archivo es demasiado grande"

**Causa**: El archivo pesa más de 5MB  
**Solución**:
- Reduce el tamaño del XML
- Elimina facturas antiguas del archivo
- Separa en múltiples archivos

---

## 🔍 DEBUG EN CONSOLA

### Activar Logs

1. Abrir DevTools (F12)
2. Ir a la tab "Console"
3. Subir el XML
4. Buscar mensajes de error

### Inspeccionar Request

```javascript
// En la consola del navegador
console.log(validation)
console.log(parsed)
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

### Antes de Subir XML

- [ ] El archivo tiene extensión `.xml`
- [ ] El archivo abre correctamente en un editor de texto
- [ ] El archivo empieza con `<?xml` o `<`
- [ ] El archivo tiene etiquetas de apertura y cierre
- [ ] El archivo pesa menos de 5MB
- [ ] El XML es válido (validado con xmllint o herramienta online)

### Formatos Aceptados

- [ ] rFE (FEL Panamá)
- [ ] Invoice (XML genérico)
- [ ] cfdi:Comprobante (CFDI México)

---

## 🛠️ HERRAMIENTAS ÚTILES

### Validadores Online

- https://www.xmlvalidation.com/
- https://codebeautify.org/xmlvalidator
- https://www.freeformatter.com/xml-validator-xsd.html

### Formateadores

- https://codebeautify.org/xmlviewer
- https://jsonformatter.org/xml-formatter

### Convertidores

- JSON to XML: https://www.convertjson.com/json-to-xml.htm
- Excel to XML: Exportar como XML desde Excel

---

## 💡 SOLUCIONES RÁPIDAS

### Problema: Archivo con BOM

```bash
# Eliminar BOM en Linux/Mac
sed -i '1s/^\xEF\xBB\xBF//' archivo.xml
```

### Problema: Codificación Incorrecta

```bash
# Convertir a UTF-8
iconv -f ISO-8859-1 -t UTF-8 archivo.xml > archivo_utf8.xml
```

### Problema: Espacios en Blanco

```bash
# Eliminar espacios al inicio
sed -i 's/^[[:space:]]*//' archivo.xml
```

---

## 📞 SOPORTE

Si el problema persiste:

1. **Enviar el archivo XML** (o primeras 100 líneas)
2. **Screenshot del error**
3. **Logs de la consola del navegador**

---

**Última actualización**: 22 de octubre de 2025  
**Versión del Parser**: 2.1 (con manejo de BOM)  
**Estado**: Mejorado ✅

