# 📋 GUÍA DE LINTING Y LIMPIEZA DE CÓDIGO

**Fecha**: 22 de octubre de 2025  
**Estado**: ✅ Linting Habilitado (Modo Híbrido)

---

## 🎯 ESTRATEGIA HÍBRIDA

El proyecto usa una estrategia híbrida para el linting:

1. ✅ **Linting habilitado** en desarrollo
2. ✅ **Builds pasan** sin bloquear por lint errors
3. ✅ **Limpieza gradual** del código
4. ✅ **TypeScript strict** sigue activo (errores críticos)

---

## 🔧 CONFIGURACIÓN ACTUAL

### ESLint (`eslintrc.json`)

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "warn"
  }
}
```

### Next.js (`next.config.js`)

```javascript
eslint: {
  ignoreDuringBuilds: true,  // ← Permite builds con lint errors
  dirs: ['app', 'components', 'lib'],
}
```

---

## 📊 ESTADO ACTUAL DEL CÓDIGO

### Errores Detectados (~300+)

| Tipo de Error | Cantidad | Severidad |
|---------------|----------|-----------|
| `@typescript-eslint/no-explicit-any` | ~200 | Media |
| `@typescript-eslint/ban-ts-comment` | ~50 | Media |
| `@typescript-eslint/no-unused-vars` | ~30 | Baja |
| `prefer-const` | ~10 | Baja |
| `@next/next/no-img-element` | ~5 | Baja |

### Archivos con Más Errores

1. `lib/prisma-utils.ts` (50+ errores)
2. `lib/hka/soap-client.ts` (20+ errores)
3. `lib/utils/xml-parser.ts` (15+ errores)
4. `lib/utils/excel-parser.ts` (15+ errores)
5. `components/configuration/*` (40+ errores)

---

## 🚀 COMANDOS DISPONIBLES

### Ver Errores

```bash
# Ver todos los errores de linting
npm run lint

# Ver solo errores (sin warnings)
npm run lint 2>&1 | grep "Error:"

# Ver errores de un archivo específico
npm run lint -- app/dashboard/page.tsx
```

### Auto-Fix

```bash
# Auto-fix errores que se puedan arreglar automáticamente
npm run lint:fix

# Auto-fix un archivo específico
npm run lint:fix -- app/dashboard/page.tsx
```

### Build

```bash
# Build normal (ignora lint errors)
npm run build

# Build simple (legacy, también ignora lint)
npm run build:simple
```

---

## 📝 PLAN DE LIMPIEZA GRADUAL

### Fase 1: Low-Hanging Fruit (1-2 horas)

**Prioridad ALTA - Fácil de arreglar**

1. **Variables no usadas**
   ```bash
   # Buscar y eliminar
   npm run lint 2>&1 | grep "no-unused-vars"
   ```

2. **prefer-const**
   ```bash
   # Auto-fix automáticamente
   npm run lint:fix
   ```

3. **Imports no usados**
   ```bash
   # Eliminar manualmente o con IDE
   ```

### Fase 2: Archivos Legacy (3-4 horas)

**Prioridad MEDIA - Requiere tiempo**

Archivos que necesitan refactoring completo:

1. `lib/prisma-utils.ts`
   - Reemplazar `any` por tipos genéricos
   - Cambiar `@ts-ignore` por `@ts-expect-error` con comentarios

2. `lib/hka/soap-client.ts`
   - Definir interfaces para respuestas SOAP
   - Tipar correctamente los métodos

3. `lib/utils/xml-parser.ts` y `lib/utils/excel-parser.ts`
   - Crear tipos para los datos parseados
   - Eliminar `any` de los métodos de parsing

### Fase 3: Componentes (2-3 horas)

**Prioridad BAJA - Mejora UX**

1. **Reemplazar `<img>` por `<Image>`**
   ```typescript
   // ANTES
   <img src="/logo.png" alt="Logo" />
   
   // DESPUÉS
   import Image from 'next/image'
   <Image src="/logo.png" alt="Logo" width={100} height={100} />
   ```

2. **Arreglar `any` en manejadores de eventos**
   ```typescript
   // ANTES
   const handleSubmit = async (e: any) => { ... }
   
   // DESPUÉS
   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { ... }
   ```

---

## 🎓 MEJORES PRÁCTICAS

### 1. No usar `any`

```typescript
// ❌ MAL
function processData(data: any) {
  return data.value
}

// ✅ BIEN
interface DataType {
  value: string
}
function processData(data: DataType) {
  return data.value
}

// ✅ MEJOR (si no sabes el tipo exacto)
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data')
}
```

### 2. Usar `@ts-expect-error` en lugar de `@ts-ignore`

```typescript
// ❌ MAL
// @ts-ignore
const result = someLibrary.undocumentedMethod()

// ✅ BIEN
// @ts-expect-error - undocumented method, works in practice
const result = someLibrary.undocumentedMethod()
```

### 3. Eliminar variables no usadas

```typescript
// ❌ MAL
const unusedVariable = "never used"

// ✅ BIEN - Eliminar completamente

// ✅ O si necesitas mantenerla temporalmente
const _unusedVariable = "prefixed with underscore"
```

### 4. Usar `const` en lugar de `let` cuando sea posible

```typescript
// ❌ MAL
let counter = 0
// ... counter nunca se reasigna

// ✅ BIEN
const counter = 0
```

---

## 📊 TRACKING DE PROGRESO

### Checklist de Limpieza

- [ ] **Fase 1: Quick Wins**
  - [ ] Eliminar variables no usadas
  - [ ] Auto-fix `prefer-const`
  - [ ] Eliminar imports no usados

- [ ] **Fase 2: Archivos Legacy**
  - [ ] `lib/prisma-utils.ts`
  - [ ] `lib/hka/soap-client.ts`
  - [ ] `lib/utils/xml-parser.ts`
  - [ ] `lib/utils/excel-parser.ts`
  - [ ] `lib/hka/xml-generator.ts`

- [ ] **Fase 3: Componentes**
  - [ ] Reemplazar `<img>` por `<Image>`
  - [ ] Tipar event handlers
  - [ ] Arreglar components/configuration/*
  - [ ] Arreglar components/admin/*

- [ ] **Fase 4: Habilitar Reglas Estrictas**
  - [ ] Cambiar `@typescript-eslint/no-explicit-any` a `"warn"`
  - [ ] Cambiar `@typescript-eslint/ban-ts-comment` a `"warn"`
  - [ ] Cambiar `@typescript-eslint/no-unused-vars` a `"warn"`
  - [ ] Habilitar `ignoreDuringBuilds: false`

---

## 🔄 PROCESO DE LIMPIEZA RECOMENDADO

### Paso 1: Revisar errores

```bash
npm run lint > lint-errors.txt
code lint-errors.txt  # Abrir en VS Code
```

### Paso 2: Priorizar por archivo

Empezar con los archivos que más usas:

1. `app/dashboard/*` (lo que más ves)
2. `components/admin/*` (panel admin)
3. `lib/hka/*` (funcionalidad core)
4. `lib/utils/*` (utilidades)

### Paso 3: Arreglar un archivo a la vez

```bash
# 1. Ver errores del archivo
npm run lint -- app/dashboard/page.tsx

# 2. Auto-fix lo que se pueda
npm run lint:fix -- app/dashboard/page.tsx

# 3. Arreglar manualmente el resto

# 4. Verificar que no haya errores
npm run lint -- app/dashboard/page.tsx

# 5. Commit
git add app/dashboard/page.tsx
git commit -m "chore: clean up linting errors in dashboard page"
```

### Paso 4: Repeat

Ir archivo por archivo, commit por commit.

---

## 🎯 META FINAL

**Objetivo**: Tener 0 errores de linting y habilitar modo estricto

```javascript
// next.config.js - OBJETIVO FINAL
eslint: {
  ignoreDuringBuilds: false,  // ← Build falla si hay lint errors
}
```

```json
// .eslintrc.json - OBJETIVO FINAL
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/ban-ts-comment": "error"
  }
}
```

---

## 📚 RECURSOS

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/rules/)
- [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 🚨 REGLAS IMPORTANTES

### NO hacer:

❌ Deshabilitar reglas globalmente sin razón  
❌ Usar `// eslint-disable-line` en exceso  
❌ Ignorar errores sin entenderlos  
❌ Hacer cambios masivos sin testing  

### SÍ hacer:

✅ Limpiar un archivo a la vez  
✅ Commit después de cada archivo  
✅ Probar después de cada cambio  
✅ Documentar por qué ignoras una regla  

---

## 📊 MÉTRICAS

### Comando para contar errores:

```bash
# Total de errores
npm run lint 2>&1 | grep -c "Error:"

# Total de warnings
npm run lint 2>&1 | grep -c "Warning:"

# Errores por tipo
npm run lint 2>&1 | grep "Error:" | cut -d'@' -f2 | sort | uniq -c | sort -rn
```

### Meta semanal:

- **Semana 1**: Reducir a <200 errores
- **Semana 2**: Reducir a <100 errores
- **Semana 3**: Reducir a <50 errores
- **Semana 4**: 0 errores ✨

---

**Última actualización**: 22 de octubre de 2025  
**Estado**: ✅ Linting Habilitado (Modo Híbrido)  
**Errores actuales**: ~300  
**Meta**: 0 errores  

---

🚀 **¡Limpieza gradual en progreso!**

