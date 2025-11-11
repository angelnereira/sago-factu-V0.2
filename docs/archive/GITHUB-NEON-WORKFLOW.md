# 🔄 GitHub Actions + Neon Workflow

## 📋 ¿Qué hace este workflow?

Este workflow de GitHub Actions crea automáticamente una **branch de base de datos en Neon** para cada Pull Request, permitiéndote probar cambios en un ambiente aislado antes de mergear a producción.

---

## 🎯 Flujo Automático

### **Cuando abres/actualizas un PR:**

```
1. Se crea un branch de Neon:
   - Nombre: preview/pr-{numero}-{branch-name}
   - Duración: 2 semanas (auto-delete)

2. Se ejecutan migraciones:
   - npx prisma db push
   - npm run db:seed (datos de prueba)

3. Se crea un comentario en el PR:
   - Link al branch en Neon Console
   - Fecha de expiración
   - Schema diff (cambios en BD)

4. Listo para probar!
```

### **Cuando cierras el PR:**

```
1. Se elimina el branch de Neon automáticamente
2. Se crea un comentario confirmando la eliminación
3. Limpieza completa ✅
```

---

## 🔑 Secretos Configurados en GitHub

Neon ya configuró estos secretos automáticamente:

- **`NEON_API_KEY`** (Secret) - API Key para Neon
- **`NEON_PROJECT_ID`** (Variable) - ID de tu proyecto en Neon

**⚠️ IMPORTANTE:** 
- Estos secretos están seguros en GitHub
- Solo los workflows pueden acceder a ellos
- Nunca los expongas en logs o comentarios

---

## 📊 Ventajas de este Workflow

### **1. Testing Aislado**
- Cada PR tiene su propia base de datos
- No afectas la BD de producción
- Pruebas realistas con datos reales

### **2. Review de Schema**
- Schema diff automático en cada PR
- Detecta cambios en modelos de Prisma
- Previene errores antes del merge

### **3. Limpieza Automática**
- Branches se eliminan al cerrar PR
- No desperdicias recursos
- Sin mantenimiento manual

### **4. Desarrollo en Paralelo**
- Múltiples PRs = múltiples DB branches
- No hay conflictos entre desarrolladores
- Cada uno trabaja independiente

---

## 🛠️ Pasos que Ejecuta el Workflow

### **Crear Branch:**

```yaml
1. Checkout del código
2. Setup Node.js 20
3. Instalar dependencias (npm ci)
4. Generar Prisma Client
5. Crear Neon Branch
6. Aplicar schema (prisma db push)
7. Seed con datos de prueba
8. Schema diff vs main
9. Comentar en PR con detalles
```

### **Eliminar Branch:**

```yaml
1. Eliminar Neon Branch
2. Comentar en PR confirmando eliminación
```

---

## 📝 Ejemplo de Uso

### **Escenario: Agregar campo a User**

1. **Creas una rama y modificas el schema:**
   ```prisma
   model User {
     // ... campos existentes
     bio String? // NUEVO CAMPO
   }
   ```

2. **Abres un Pull Request:**
   - GitHub Actions detecta el PR
   - Crea un branch de Neon: `preview/pr-42-add-user-bio`
   - Aplica el schema con el nuevo campo
   - Comenta en el PR con el link

3. **Pruebas en el branch de Neon:**
   - Puedes conectarte al branch para probar
   - DATABASE_URL del branch disponible en Neon Console
   - Datos de prueba ya están cargados

4. **Schema Diff en el PR:**
   - El bot comenta mostrando los cambios:
     ```diff
     + bio: String?
     ```

5. **Merges el PR:**
   - El branch de Neon se elimina automáticamente
   - Tu BD de producción aún no se afecta

6. **Despliegas a producción:**
   - Vercel ejecuta `prisma db push`
   - El campo `bio` se agrega a producción

---

## ⚙️ Configuración Actual

### **Archivo:** `.github/workflows/neon-branch.yml`

**Triggers:**
- `pull_request` con tipos: `opened`, `reopened`, `synchronize`, `closed`

**Permisos:**
- `contents: read` - Leer código del repo
- `pull-requests: write` - Comentar en PRs

**Jobs:**
1. **setup** - Obtiene nombre del branch
2. **create_neon_branch** - Crea y configura el branch
3. **delete_neon_branch** - Elimina el branch al cerrar PR

**Variables de Entorno en Workflow:**
- `DATABASE_URL` - URL del branch de Neon (con pooler)
- `SUPER_ADMIN_EMAIL` - Para seed
- `SUPER_ADMIN_PASSWORD` - Para seed

---

## 🔒 Seguridad

### **Secretos Protegidos:**
- ✅ `NEON_API_KEY` nunca se expone en logs
- ✅ `DATABASE_URL` nunca se imprime en comentarios
- ✅ Solo workflows autorizados pueden acceder

### **Permisos Mínimos:**
- ✅ Solo lee código necesario
- ✅ Solo escribe comentarios en PRs
- ✅ No puede modificar código

---

## 📊 Monitoreo

### **Ver Branches en Neon:**
1. Ve a [Neon Console](https://console.neon.tech)
2. Selecciona tu proyecto: `sago-factu`
3. Ve a la pestaña "Branches"
4. Verás todos los branches activos de PRs

### **Ver Workflow en GitHub:**
1. Ve a tu repo en GitHub
2. Pestaña "Actions"
3. Selecciona "Create/Delete Neon Branch for Pull Request"
4. Ve todos los runs del workflow

---

## 🚀 Mejoras Futuras

### **Posibles Optimizaciones:**

1. **Tests Automáticos:**
   ```yaml
   - name: Run tests
     run: npm test
     env:
       DATABASE_URL: ${{ steps.create_neon_branch.outputs.db_url_with_pooler }}
   ```

2. **Deploy Preview en Vercel:**
   - Conectar branch de Neon con preview de Vercel
   - Cada PR tendría su propia app + BD

3. **Backup Antes de Delete:**
   - Guardar snapshot del branch antes de eliminar
   - Útil para debugging

4. **Notificaciones:**
   - Slack/Discord cuando se crea/elimina branch
   - Email con detalles del preview

---

## 📚 Recursos

- **Neon Branching:** https://neon.tech/docs/guides/branching
- **GitHub Actions:** https://docs.github.com/actions
- **Prisma Migrations:** https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## 🆘 Troubleshooting

### **Problema: Workflow falla en "Create Neon Branch"**

**Solución:**
1. Verifica que `NEON_API_KEY` esté configurada en GitHub Secrets
2. Verifica que `NEON_PROJECT_ID` esté configurada en GitHub Variables
3. Revisa los logs del workflow en GitHub Actions

### **Problema: Schema diff no aparece**

**Solución:**
1. Verifica que el workflow tenga permisos de `pull-requests: write`
2. Asegúrate de que el schema.prisma tenga cambios vs main

### **Problema: Seed falla**

**Solución:**
1. Verifica que `npm run db:seed` funcione localmente
2. Revisa que las env vars estén configuradas en el workflow
3. Puede fallar si el seed ya corrió antes (datos duplicados)

---

**Última actualización:** $(date)  
**Mantenido por:** Equipo SAGO-FACTU

