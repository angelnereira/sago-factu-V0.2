# 🔒 AVISO DE SEGURIDAD IMPORTANTE

## ⚠️ ARCHIVOS CON INFORMACIÓN SENSIBLE

Los siguientes archivos están **EXCLUIDOS** del repositorio público porque contienen o pueden contener credenciales reales:

### **Excluidos de Git (.gitignore):**

```
# Variables de entorno
.env
.env.local
.env.production

# Archivos de configuración con credenciales
vercel-env-*.txt
vercel-neon-env.txt
*-credentials.txt
*.secret

# Documentación con credenciales
NEON-SETUP.md
VERCEL-SETUP-COMPLETO.md
VERCEL-DEPLOYMENT.md
VERIFICACION-DEPLOYMENT.md
```

---

## 📋 ARCHIVOS SEGUROS (Plantillas)

Los siguientes archivos **SÍ** están en el repositorio porque usan **placeholders**:

- ✅ `.env.example` - Template sin credenciales reales
- ✅ `vercel-env.example.txt` - Template sin credenciales reales
- ✅ `ARQUITECTURA-FINAL.md` - Documentación con placeholders
- ✅ `SECURITY.md` - Guía de seguridad
- ✅ `README.md` - Documentación pública

---

## 🔐 CREDENCIALES QUE **NUNCA** DEBEN SER PÚBLICAS

### **1. DATABASE_URL**
```bash
# ❌ MAL (expone contraseña)
DATABASE_URL="postgresql://user:PASSWORD@host/db"

# ✅ BIEN (en documentación pública)
DATABASE_URL="postgresql://user:YOUR_PASSWORD@YOUR_HOST/db"
```

### **2. NEXTAUTH_SECRET**
```bash
# ❌ MAL
NEXTAUTH_SECRET="CDNvPtB/3VqcQOIL//p9if3oGQxx0qm2taE9GfsGE3w="

# ✅ BIEN
NEXTAUTH_SECRET="YOUR_SECRET_HERE"
```

### **3. Contraseñas de Admin**
```bash
# ❌ MAL
SUPER_ADMIN_PASSWORD="admin123"

# ✅ BIEN
SUPER_ADMIN_PASSWORD="YOUR_SECURE_PASSWORD"
```

### **4. API Keys**
```bash
# ❌ MAL
HKA_DEMO_TOKEN_PASSWORD="RealPassword123"

# ✅ BIEN (si es demo público de HKA)
HKA_DEMO_TOKEN_PASSWORD="Octopusp1oQs5"  # OK si es credencial pública de demo

# ✅ MEJOR (si es tu credencial)
HKA_PROD_TOKEN_PASSWORD="YOUR_HKA_PASSWORD"
```

---

## 🛡️ QUÉ HACER SI EXPUSISTE CREDENCIALES

### **Si ya hiciste commit con credenciales:**

1. **INMEDIATAMENTE rota las credenciales:**
   - Cambia contraseña de Neon
   - Genera nuevo NEXTAUTH_SECRET: `openssl rand -base64 32`
   - Cambia contraseña del Super Admin
   - Solicita nuevas API Keys

2. **Elimina del historial de Git:**
   ```bash
   # SOLO si es estrictamente necesario
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch ARCHIVO_CON_CREDENCIALES" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

3. **Notifica al equipo** si trabajas en grupo

---

## ✅ VERIFICACIÓN ANTES DE COMMIT

Antes de cada commit, verifica:

```bash
# 1. Ver qué archivos se subirán
git status

# 2. Buscar posibles secretos
git diff | grep -i "password"
git diff | grep -i "secret"
git diff | grep -i "npg_"

# 3. Revisar archivos staged
git diff --staged
```

---

## 📝 GUÍAS DE REFERENCIA

- **Configuración de variables:** Ver `vercel-env.example.txt`
- **Seguridad completa:** Ver `SECURITY.md`
- **Arquitectura:** Ver `ARQUITECTURA-FINAL.md`

---

## 🚨 RECORDATORIO

**NUNCA incluyas en el repositorio público:**
- ❌ Contraseñas reales
- ❌ API Keys privadas
- ❌ URLs de base de datos con credenciales
- ❌ Secrets de autenticación
- ❌ Tokens de servicios externos

**SIEMPRE usa placeholders en documentación pública:**
- ✅ `YOUR_PASSWORD`
- ✅ `YOUR_SECRET_HERE`
- ✅ `YOUR_API_KEY`

---

**Fecha de última actualización:** $(date)  
**Mantenido por:** Equipo SAGO-FACTU

