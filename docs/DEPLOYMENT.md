# 🚀 Guía de Despliegue - SAGO-FACTU

## Despliegue en Vercel

### 1. Preparación del Proyecto

El proyecto ya está configurado para desplegarse en Vercel. Los archivos necesarios son:
- `vercel.json` - Configuración de Vercel
- `vercel-env-example.txt` - Variables de entorno necesarias

### 2. Crear Cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Crea una cuenta o inicia sesión
3. Conecta tu cuenta de GitHub

### 3. Desplegar el Proyecto

1. **Importar Proyecto:**
   - Haz clic en "New Project"
   - Selecciona tu repositorio `sago-factu`
   - Vercel detectará automáticamente que es un proyecto Next.js

2. **Configurar Variables de Entorno:**
   - En la sección "Environment Variables"
   - Agrega las siguientes variables (copia desde `vercel-env-example.txt`):

```bash
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=tu-secreto-super-seguro-aqui
HKA_ENV=demo
HKA_DEMO_SOAP_URL=https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
HKA_DEMO_TOKEN_USER=walgofugiitj_ws_tfhka
HKA_DEMO_TOKEN_PASSWORD=Octopusp1oQs5
HKA_DEMO_REST_URL=https://demointegracion.thefactoryhka.com.pa
NEXT_PUBLIC_APP_NAME=SAGO-FACTU
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
NODE_ENV=production
SUPER_ADMIN_EMAIL=admin@sagofactu.com
SUPER_ADMIN_PASSWORD=72bb9e47a5373f74cb1e31b065aaec45
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_WEBHOOKS=false
ENABLE_API_KEYS=true
```

3. **Generar NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

4. **Desplegar:**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente

### 4. Probar el Login

Una vez desplegado:

1. **Ve a tu URL de Vercel:** `https://tu-proyecto.vercel.app`
2. **Navega al login:** `https://tu-proyecto.vercel.app/auth/signin`
3. **Usa las credenciales:**
   - Email: `admin@sagofactu.com`
   - Contraseña: `72bb9e47a5373f74cb1e31b065aaec45`

### 5. Verificar Funcionamiento

Si el login funciona en producción pero no en desarrollo, el problema puede ser:
- Configuración de NextAuth en desarrollo
- Variables de entorno locales
- Cache del navegador
- Configuración de CSRF

### 6. Solución de Problemas

**Si el login no funciona en producción:**
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de Vercel en el dashboard
3. Asegúrate de que `NEXTAUTH_URL` coincida con tu dominio de Vercel

**Si el build falla:**
1. Verifica que `prisma generate` funcione localmente
2. Revisa que todas las dependencias estén en `package.json`
3. Verifica que no haya errores de TypeScript

### 7. Comandos Útiles

```bash
# Probar build localmente
npm run build

# Verificar configuración
npm run check-config

# Resetear base de datos
npm run db:reset
```

## 🎯 Próximos Pasos

Una vez que el login funcione en producción:
1. Implementar dashboard completo
2. Agregar gestión de folios
3. Implementar emisión de facturas
4. Configurar base de datos de producción (PostgreSQL)
5. Agregar monitoreo y logs
