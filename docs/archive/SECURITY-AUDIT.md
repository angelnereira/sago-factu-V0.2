# 🔐 Security Audit - SAGO-FACTU

**Fecha:** 23 de Octubre, 2025  
**Vulnerabilidades Detectadas:** 12 (7 moderate, 5 high)

---

## 📋 RESUMEN DE VULNERABILIDADES

### ❌ **CRÍTICAS - REQUIEREN ACCIÓN**

#### 1. **xlsx (SheetJS) - HIGH** ⚠️
- **Vulnerabilidades:**
  - Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
  - Regular Expression Denial of Service (ReDoS) (GHSA-5pgg-2g8v-p4x9)
- **Severidad:** HIGH
- **Status:** ❌ No fix available
- **Uso en la app:** Importación de archivos Excel para facturas

**ACCIÓN REQUERIDA:** Reemplazar o mitigar

---

### ⚠️ **MODERADAS/HIGH - SOLO EN DEVELOPMENT**

#### 2. **esbuild <=0.24.2 - MODERATE**
- **Vulnerabilidad:** Permite requests arbitrarias al servidor de desarrollo
- **Severidad:** MODERATE
- **Alcance:** Solo en `npm run dev` (desarrollo local)
- **Producción:** ✅ No afecta (Vercel usa su propio build)

#### 3. **path-to-regexp 4.0.0 - 6.2.2 - HIGH**
- **Vulnerabilidad:** Backtracking regular expressions
- **Severidad:** HIGH
- **Alcance:** Dependencia de @vercel/node (CLI tool)
- **Producción:** ✅ No afecta el runtime de la app

#### 4. **undici <=5.28.5 - MODERATE**
- **Vulnerabilidades:**
  - Use of Insufficiently Random Values (GHSA-c76h-2ccp-4975)
  - Denial of Service attack via bad certificate (GHSA-cxrh-j4jr-qwg3)
- **Severidad:** MODERATE
- **Alcance:** Dependencia de @vercel/node (CLI tool)
- **Producción:** ✅ No afecta el runtime de la app

---

## 🎯 PLAN DE ACCIÓN

### **1. XLSX - ACCIÓN INMEDIATA** 🚨

#### **Opción A: Reemplazar con alternativa segura**

**Recomendación:** Usar `exceljs` (más seguro y mantenido)

```bash
npm uninstall xlsx
npm install exceljs
```

**Ventajas:**
- ✅ Sin vulnerabilidades conocidas
- ✅ Activamente mantenido
- ✅ API más moderna
- ✅ Mejor manejo de tipos TypeScript
- ✅ Soporte para streaming

**Desventajas:**
- ⚠️ Requiere refactorizar código existente
- ⚠️ API diferente

---

#### **Opción B: Mitigación de Riesgos (temporal)**

Si no podemos reemplazar inmediatamente, implementar:

1. **Validación Estricta de Archivos**
   ```typescript
   // Limitar tamaño de archivos
   const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
   
   // Validar extensión
   const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
   
   // Sanitizar input
   function validateExcelFile(file: File) {
     if (file.size > MAX_FILE_SIZE) {
       throw new Error('Archivo demasiado grande')
     }
     // ... más validaciones
   }
   ```

2. **Timeout para Procesamiento**
   ```typescript
   const processWithTimeout = async (file: File, timeout = 10000) => {
     return Promise.race([
       processExcelFile(file),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('Timeout')), timeout)
       )
     ])
   }
   ```

3. **Sandboxing**
   - Procesar archivos Excel en Worker threads
   - Limitar memoria y CPU

4. **Rate Limiting**
   - Limitar uploads de Excel por usuario/IP
   - Implementar CAPTCHA para uploads frecuentes

---

### **2. VERCEL CLI - ACCIÓN OPCIONAL** ℹ️

#### **Análisis de Riesgo:**

Las vulnerabilidades en `vercel`, `esbuild`, `path-to-regexp` y `undici` están en:
- **Herramientas de CLI** (vercel deploy)
- **Servidor de desarrollo** local (`npm run dev`)
- **NO afectan** el runtime de producción en Vercel

#### **Recomendaciones:**

1. **Entorno de Desarrollo Seguro**
   ```bash
   # Nunca exponer servidor de desarrollo a internet
   npm run dev # Solo localhost:3000
   
   # Usar VPN o firewall en redes públicas
   ```

2. **Actualizar Vercel CLI** (opcional, breaking changes)
   ```bash
   # Solo si necesitas las últimas features de Vercel CLI
   npm install vercel@latest
   # Requiere testing completo
   ```

3. **Deploy desde CI/CD Seguro**
   ```yaml
   # GitHub Actions con Vercel
   - uses: amondnet/vercel-action@v25
     env:
       VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
   ```

---

## 🛡️ SOLUCIONES IMPLEMENTADAS

### **1. Reemplazar xlsx con exceljs** ✅

<parameter name="contents">
