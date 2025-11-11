# 🔒 Seguridad y Variables de Entorno

## ⚠️ Archivos Sensibles - NO COMPARTIR

Los siguientes archivos contienen **credenciales reales** y **NUNCA** deben ser compartidos públicamente o subidos a GitHub:

### 🚫 Archivos Excluidos del Repositorio

- `.env` - Variables de entorno locales
- `.env.local` - Variables locales (desarrollo)
- `.env.production` - Variables de producción
- `vercel-neon-env.txt` - Credenciales reales de Neon y Vercel
- `vercel-env-production.txt` - Variables de producción con credenciales
- Cualquier archivo `*-credentials.txt`
- Cualquier archivo `*.secret`

**Estos archivos están listados en `.gitignore` y no se subirán al repositorio.**

---

## ✅ Archivos Seguros (Plantillas)

Los siguientes archivos **SÍ** pueden estar en el repositorio porque son solo plantillas:

- `.env.example` - Plantilla de variables de entorno
- `vercel-env.example.txt` - Plantilla de variables para Vercel
- Este archivo (`SECURITY.md`)

---

## 🔐 Información Sensible

### **NO compartas públicamente:**

1. **Database URLs** (Neon, PostgreSQL, etc.)
   - Contienen usuario y contraseña en texto plano
   - Ejemplo: `postgresql://user:PASSWORD@host/db`

2. **NEXTAUTH_SECRET**
   - Clave secreta para firmar tokens JWT
   - Si se filtra, un atacante puede falsificar sesiones

3. **Contraseñas de Admin**
   - `SUPER_ADMIN_PASSWORD`
   - Contraseñas de usuarios de sistema

4. **API Keys y Tokens**
   - `HKA_DEMO_TOKEN_USER`
   - `HKA_DEMO_TOKEN_PASSWORD`
   - Cualquier token de servicios externos

5. **AWS Credentials**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

---

## 📝 Cómo Manejar Variables de Entorno

### **Para Desarrollo Local:**

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tus credenciales locales
3. **NUNCA** hagas commit de `.env`

### **Para Producción en Vercel:**

1. Copia `vercel-env.example.txt` localmente (no en git):
   ```bash
   cp vercel-env.example.txt vercel-neon-env.txt
   ```

2. Edita `vercel-neon-env.txt` con tus credenciales reales

3. Configura las variables **manualmente** en Vercel Dashboard:
   - Ve a: https://vercel.com/dashboard
   - Settings → Environment Variables
   - Copia cada variable una por una

4. **NO** subas `vercel-neon-env.txt` a GitHub

---

## 🚨 ¿Qué hacer si expones credenciales?

Si accidentalmente subiste credenciales al repositorio:

### **1. Rota TODAS las credenciales inmediatamente:**

- **Neon Database**: Cambia la contraseña en Neon Console
- **NEXTAUTH_SECRET**: Genera uno nuevo con `openssl rand -base64 32`
- **SUPER_ADMIN_PASSWORD**: Cambia en la base de datos
- **API Keys HKA**: Solicita nuevas credenciales

### **2. Elimina el commit del historial:**

```bash
# CUIDADO: Esto reescribe el historial de Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch vercel-neon-env.txt" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

**⚠️ Advertencia**: Esto afecta a todos los colaboradores del repositorio.

### **3. Notifica al equipo**

Si trabajas en equipo, notifica a todos que:
- Las credenciales fueron comprometidas
- Han sido rotadas
- Deben actualizar sus variables locales

---

## 🛡️ Mejores Prácticas

1. ✅ **Siempre usa `.gitignore`** para archivos sensibles
2. ✅ **Usa gestores de secretos** (Vercel, Railway, 1Password, etc.)
3. ✅ **Nunca hardcodees credenciales** en el código
4. ✅ **Rota credenciales regularmente**
5. ✅ **Usa diferentes credenciales** para dev/staging/production
6. ✅ **Audita los commits** antes de hacer push
7. ❌ **Nunca compartas credenciales** por email, chat, etc.
8. ❌ **Nunca uses credenciales de producción** en desarrollo

---

## 🔍 Verificación

### **Verifica que no hay secretos expuestos:**

```bash
# Buscar posibles secretos en el código
git grep -i "password"
git grep -i "secret"
git grep -i "token"
git grep -i "api.key"

# Verificar que .gitignore funciona
git status --ignored
```

### **Herramientas útiles:**

- [git-secrets](https://github.com/awslabs/git-secrets) - Previene commits con secretos
- [truffleHog](https://github.com/trufflesecurity/truffleHog) - Escanea secretos en git
- [GitGuardian](https://www.gitguardian.com/) - Monitoreo continuo de secretos

---

## 📞 Contacto de Seguridad

Si encuentras una vulnerabilidad de seguridad, por favor:

1. **NO** abras un issue público
2. Contacta al equipo de desarrollo directamente
3. Espera a que se corrija antes de divulgar

---

**Última actualización**: $(date)
**Mantenedor**: Equipo SAGO-FACTU

