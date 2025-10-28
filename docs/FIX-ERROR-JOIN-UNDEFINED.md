# FIX: Error "Cannot read properties of undefined (reading 'join')"

## Problema Identificado

El error ocurre cuando se intenta ejecutar `.join()` sobre `undefined` en lugar de un array.

## Causas Posibles

1. **La hoja "Items" no existe en el Excel**
2. **La hoja "Items" está vacía**
3. **El array `itemsRaw` no se inicializa correctamente**
4. **No hay validación previa antes de usar `.map().join()`**

## Solución: Validaciones Defensivas

### Nivel 1: Validación Inicial
```typescript
if (!file) {
  throw new Error('Archivo no proporcionado');
}
```

### Nivel 2: Validación de Hojas Excel
```typescript
if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
  throw new Error('El archivo Excel no contiene hojas');
}

const hojasFaltantes = hojaRequeridas.filter(h => !hojasDisponibles.includes(h));
if (hojasFaltantes.length > 0) {
  throw new Error(`Faltan hojas: ${hojasFaltantes.join(', ')}`);
}
```

### Nivel 3: Validación de Items Array
```typescript
if (!itemsRaw || !Array.isArray(itemsRaw) || itemsRaw.length === 0) {
  throw new Error('La hoja "Items" está vacía o mal formateada');
}
```

### Nivel 4: Validación Antes de `.join()`
```typescript
if (!factura.items || !Array.isArray(factura.items) || factura.items.length === 0) {
  throw new Error('No se pueden generar XML sin items');
}

// AHORA ES SEGURO usar .map().join()
const itemsXML = factura.items.map(item => `...`).join('\n');
```

## Implementación Recomendada

Ver el código completo en el análisis técnico proporcionado por el usuario.

## Testing

Probar con:
1. Excel sin hoja "Items"
2. Excel con hoja "Items" vacía
3. Items con datos faltantes
4. Excel válido para confirmar que funciona

