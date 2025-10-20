# 🚀 Despliegue en Vercel - SAGO-FACTU

## 📋 Pasos para desplegar en Vercel

### 1. Configurar Neon PostgreSQL

1. **Crear cuenta en Neon**:
   - Ve a [neon.tech](https://neon.tech)
   - Crea una cuenta gratuita
   - Crea un nuevo proyecto llamado `sago-factu`

2. **Obtener la URL de conexión**:
   - En el dashboard de Neon, copia la URL de conexión
   - Debería verse así: `postgresql://username:password@hostname/database?sslmode=require`

### 2. Configurar variables de entorno en Vercel

1. **En el dashboard de Vercel**:
   - Ve a tu proyecto
   - Settings → Environment Variables
   - Agrega las siguientes variables:

```bash
# Base de datos
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
NEXTAUTH_SECRET="2KjMnkOzQCc/jOjSsr2VySk2MXLpidtsusbgWF29Aaw="

# The Factory HKA - Demo Environment
HKA_ENV="demo"
HKA_DEMO_SOAP_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_DEMO_TOKEN_USER="walgofugiitj_ws_tfhka"
HKA_DEMO_TOKEN_PASSWORD="Octopusp1oQs5"
HKA_DEMO_REST_URL="https://demointegracion.thefactoryhka.com.pa"

# App
NEXT_PUBLIC_APP_NAME="SAGO-FACTU"
NEXT_PUBLIC_APP_URL="https://tu-proyecto.vercel.app"
NODE_ENV="production"

# Super Admin
SUPER_ADMIN_EMAIL="admin@sagofactu.com"
SUPER_ADMIN_PASSWORD="admin123"
```

### 3. Desplegar

1. **Conectar repositorio**:
   - En Vercel, conecta tu repositorio de GitHub
   - Asegúrate de que esté en la rama `main`

2. **Configurar build**:
   - El proyecto ya está configurado con `vercel.json`
   - Usará el comando `npm run build:vercel`

3. **Desplegar**:
   - Haz clic en "Deploy"
   - Espera a que termine el build

### 4. Verificar despliegue

1. **Probar login**:
   - Ve a `https://tu-proyecto.vercel.app/auth/signin`
   - Usa las credenciales:
     - Email: `admin@sagofactu.com`
     - Contraseña: `admin123`

2. **Verificar dashboard**:
   - Después del login, deberías ver el dashboard

## 🔧 Solución de problemas

### Error: "the URL must start with the protocol postgresql://"
- **Causa**: `DATABASE_URL` no está configurada o es incorrecta
- **Solución**: Verificar que `DATABASE_URL` esté configurada en Vercel con una URL de PostgreSQL válida

### Error: "PrismaClientKnownRequestError"
- **Causa**: La base de datos no tiene las tablas creadas
- **Solución**: El script `build:vercel` ejecuta `prisma db push` automáticamente

### Error: "InvalidCredentials"
- **Causa**: El usuario no existe en la base de datos
- **Solución**: El script `build:vercel` ejecuta el seed automáticamente

## 📁 Archivos importantes

- `vercel.json` - Configuración de Vercel
- `vercel-build.sh` - Script de build personalizado
- `prisma/schema.prisma` - Schema de PostgreSQL
- `prisma/seed-simple.ts` - Datos de prueba

## 🎯 Próximos pasos

1. Configurar Neon PostgreSQL
2. Configurar variables de entorno en Vercel
3. Desplegar
4. Probar login
5. Implementar funcionalidades adicionales
