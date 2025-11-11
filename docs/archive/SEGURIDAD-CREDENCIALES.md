# 🔒 SEGURIDAD DE CREDENCIALES - SAGO-FACTU

**Fecha**: 22 de octubre de 2025  
**Criticidad**: 🚨 ALTA  
**Tipo**: Guía de Seguridad

---

## ⚠️ PROBLEMA RESUELTO

Se ha implementado protección completa contra la exposición de credenciales sensibles en el repositorio Git.

---

## 🎯 MEDIDAS IMPLEMENTADAS

### 1. ✅ Protección de Archivos `.env`

**Archivos protegidos en `.gitignore`:**
```gitignore
# env files - NUNCA SUBIR CREDENCIALES
.env*
# Incluir .env.example también por seguridad (contiene datos sensibles)
# Usar env.template en su lugar
```

**Archivos bloqueados:**
- ✅ `.env` (archivo principal con credenciales reales)
- ✅ `.env.local`
- ✅ `.env.development`
- ✅ `.env.production`
- ✅ `.env.example` (puede contener credenciales demo)
- ✅ `.env.backup`
- ✅ Cualquier archivo que empiece con `.env`

---

### 2. ✅ Archivo Template Seguro

**Creado: `env.template`**

Este archivo:
- ✅ NO contiene credenciales reales
- ✅ SÍ se puede subir a Git
- ✅ Sirve como guía para configuración
- ✅ Incluye placeholders genéricos
- ✅ Documenta todas las variables necesarias

**Uso:**
```bash
# Copiar template
cp env.template .env

# Editar con credenciales reales
nano .env

# NUNCA hacer commit de .env
git status  # Verificar que .env no aparece
```

---

## 🚨 CREDENCIALES SENSIBLES

### ❌ NUNCA subir a Git:

1. **Credenciales de Base de Datos**
   ```
   DATABASE_URL="postgresql://user:password@host/db"
   NEON_DATABASE_URL="https://..."
   ```

2. **Credenciales de HKA**
   ```
   HKA_DEMO_TOKEN_USER="..."
   HKA_DEMO_TOKEN_PASSWORD="..."
   HKA_PROD_TOKEN_USER="..."
   HKA_PROD_TOKEN_PASSWORD="..."
   ```

3. **Secrets de NextAuth**
   ```
   NEXTAUTH_SECRET="..."
   ```

4. **API Keys de Terceros**
   ```
   RESEND_API_KEY="..."
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   REDIS_URL="..."
   SENTRY_DSN="..."
   ```

5. **Credenciales de Super Admin**
   ```
   SUPER_ADMIN_EMAIL="..."
   SUPER_ADMIN_PASSWORD="..."
   ```

---

## ✅ CHECKLIST DE SEGURIDAD

### Antes de Hacer Commit

```bash
# 1. Verificar que .env no está staged
git status

# 2. Verificar .gitignore
cat .gitignore | grep "\.env"

# 3. Ver archivos que se van a subir
git diff --cached

# 4. Buscar credenciales accidentales
git diff --cached | grep -i "password\|token\|secret\|key"
```

### Antes de Push a GitHub

```bash
# 1. Revisar el historial de commits
git log --oneline -5

# 2. Ver archivos cambiados
git diff origin/main

# 3. Buscar archivos sensibles
git ls-files | grep -E "\.env|credentials|secret"

# 4. Si encuentras algo sensible, NO hacer push
```

---

## 🔧 CONFIGURACIÓN SEGURA

### Para Desarrollo Local

```bash
# 1. Copiar template
cp env.template .env

# 2. Rellenar con credenciales de DESARROLLO
# - Usar credenciales demo de HKA
# - Usar base de datos de desarrollo
# - Usar passwords simples (admin123)

# 3. Verificar que .env está en .gitignore
git check-ignore .env
# Debe devolver: .env
```

### Para Staging/Producción

```bash
# NO usar archivos .env en Vercel/producción
# En su lugar, usar variables de entorno de Vercel:

# 1. Ir a Vercel Dashboard
# 2. Settings > Environment Variables
# 3. Agregar variables UNA POR UNA
# 4. Seleccionar ambiente: Production, Preview, Development
```

---

## 🚨 QUÉ HACER SI YA SUBISTE CREDENCIALES

### Paso 1: Rotar Credenciales INMEDIATAMENTE

```bash
# 1. Cambiar password de base de datos
# 2. Regenerar NEXTAUTH_SECRET
# 3. Regenerar API keys
# 4. Contactar a HKA para nuevas credenciales
```

### Paso 2: Eliminar del Historial de Git

```bash
# ⚠️ PELIGROSO - Solo si es necesario
# Esto reescribe el historial de Git

# Eliminar archivo del historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (requiere permisos)
git push origin --force --all
```

### Paso 3: Notificar al Equipo

- Avisar a todos los desarrolladores
- Documentar el incidente
- Revisar logs de acceso
- Implementar medidas adicionales

---

## 📚 ARCHIVOS DE CONFIGURACIÓN

### Archivos en el Proyecto

| Archivo | Descripción | ¿Se sube a Git? |
|---------|-------------|-----------------|
| `env.template` | Template sin credenciales | ✅ SÍ |
| `.env` | Credenciales locales | ❌ NO |
| `.env.local` | Override local | ❌ NO |
| `.env.development` | Desarrollo | ❌ NO |
| `.env.production` | Producción | ❌ NO |
| `.env.example` | Ejemplo (bloqueado) | ❌ NO |
| `.env.backup` | Backup local | ❌ NO |

---

## 🔐 BUENAS PRÁCTICAS

### 1. Separación de Ambientes

```bash
# Desarrollo
DATABASE_URL="postgresql://localhost/sago_dev"
HKA_ENV="demo"

# Staging
DATABASE_URL="postgresql://staging-host/sago_staging"
HKA_ENV="demo"

# Producción
DATABASE_URL="postgresql://production-host/sago_prod"
HKA_ENV="prod"
```

### 2. Rotación de Credenciales

- **Cada 90 días**: Rotar passwords de BD
- **Cada 180 días**: Rotar API keys
- **Cada 365 días**: Rotar secrets de NextAuth
- **Inmediatamente**: Si hay sospecha de compromiso

### 3. Acceso Limitado

- Solo desarrolladores senior tienen credenciales de producción
- Usar credenciales de demo para desarrollo
- Documentar quién tiene acceso a qué
- Revocar acceso al salir del proyecto

### 4. Monitoreo

```bash
# Configurar alertas para:
- Intentos de acceso fallidos
- Cambios en variables de entorno (Vercel)
- Commits con palabras clave sensibles
- Accesos inusuales a la base de datos
```

---

## 🛡️ VERIFICACIÓN CONTINUA

### Git Hooks (Recomendado)

Crear `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Buscar credenciales en archivos staged
if git diff --cached | grep -qE 'PASSWORD|SECRET|TOKEN|API_KEY'; then
  echo "⚠️  ADVERTENCIA: Posibles credenciales detectadas"
  echo "Revisar los cambios antes de hacer commit"
  exit 1
fi

# Verificar que .env no está staged
if git diff --cached --name-only | grep -q "^\.env"; then
  echo "❌ ERROR: Intentando subir archivo .env"
  echo "Ejecutar: git reset HEAD .env"
  exit 1
fi
```

Hacer ejecutable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 📊 CHECKLIST DE PROYECTO NUEVO

### Al Iniciar Desarrollo

- [ ] Copiar `env.template` a `.env`
- [ ] Rellenar con credenciales de desarrollo
- [ ] Verificar que `.env` está en `.gitignore`
- [ ] Probar `git check-ignore .env` (debe devolver `.env`)
- [ ] Configurar git hooks
- [ ] Documentar credenciales en gestor de passwords (1Password, LastPass)

### Al Desplegar a Producción

- [ ] NO copiar `.env` al servidor
- [ ] Configurar variables de entorno en Vercel
- [ ] Usar credenciales de PRODUCCIÓN de HKA
- [ ] Configurar base de datos de producción (Neon)
- [ ] Generar nuevo `NEXTAUTH_SECRET` para producción
- [ ] Configurar monitoreo (Sentry, Vercel)
- [ ] Documentar credenciales de producción de forma segura

---

## 🚨 INCIDENTES COMUNES

### 1. "Subí .env por error"

```bash
# Solución inmediata
git reset HEAD .env
git checkout .env

# Si ya hiciste commit
git reset --soft HEAD~1
git reset HEAD .env
```

### 2. ".env aparece en Git"

```bash
# Verificar .gitignore
cat .gitignore | grep "\.env"

# Remover del tracking
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### 3. "Credenciales expuestas en historial"

```bash
# Ver si está en el historial
git log --all --full-history -- .env

# Si aparece, seguir "Paso 2" de la sección anterior
```

---

## 📞 CONTACTOS DE EMERGENCIA

### En caso de exposición de credenciales:

1. **Líder Técnico**: Notificar inmediatamente
2. **DevOps**: Rotar credenciales
3. **The Factory HKA**: Solicitar nuevas credenciales
4. **Neon**: Cambiar password de BD
5. **Equipo**: Avisar a todos los desarrolladores

---

## 📚 RECURSOS

### Documentación Relacionada

- [`docs/NEON-SETUP.md`](NEON-SETUP.md) - Configuración de base de datos
- [`docs/DESPLIEGUE-VERCEL.md`](DESPLIEGUE-VERCEL.md) - Variables en Vercel
- [`env.template`](../env.template) - Template de variables

### Herramientas de Seguridad

- **git-secrets**: Prevenir commits con credenciales
- **truffleHog**: Buscar credenciales en historial
- **1Password**: Gestor de credenciales del equipo
- **Vercel Secrets**: Variables de entorno seguras

---

## ✅ RESUMEN

### ✅ Archivos Protegidos
- Todos los archivos `.env*` bloqueados en `.gitignore`
- Template seguro creado: `env.template`
- README actualizado con instrucciones seguras

### ✅ Buenas Prácticas
- Separación de ambientes (dev/staging/prod)
- Rotación periódica de credenciales
- Acceso limitado y documentado
- Monitoreo continuo

### ✅ Procedimientos
- Checklist antes de commit/push
- Plan de respuesta a incidentes
- Contactos de emergencia definidos

---

**Última actualización**: 22 de octubre de 2025  
**Estado de Seguridad**: ✅ PROTEGIDO  
**Próxima revisión**: Cada 90 días

---

🔒 **NUNCA subir credenciales a Git. Siempre usar `env.template` y configurar variables de entorno en Vercel.**

