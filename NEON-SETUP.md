# 🚀 Configuración de Neon Database para SAGO-FACTU

## ¿Por qué Neon?

SQLite no funciona en Vercel porque es un sistema de archivos efímero. Neon es una base de datos PostgreSQL serverless perfecta para Vercel.

## 📋 Pasos para configurar Neon

### 1. Crear cuenta en Neon

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "sago-factu"

### 2. Obtener la URL de conexión

1. En el dashboard de Neon, ve a "Connection Details"
2. Copia la "Connection String" que se ve así:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Configurar variables en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a "Settings" > "Environment Variables"
3. Agrega estas variables:

```bash
# Database (reemplaza con tu URL de Neon)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth.js
NEXTAUTH_URL=https://sago-factu-v0-2.vercel.app
NEXTAUTH_SECRET=CDNvPtB/3VqcQOIL//p9if3oGQxx0qm2taE9GfsGE3w=

# App
NEXT_PUBLIC_APP_NAME=SAGO-FACTU
NEXT_PUBLIC_APP_URL=https://sago-factu-v0-2.vercel.app
NODE_ENV=production

# Super Admin
SUPER_ADMIN_EMAIL=admin@sagofactu.com
SUPER_ADMIN_PASSWORD=admin123

# Features
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_WEBHOOKS=false
ENABLE_API_KEYS=true
```

### 4. Actualizar el schema de Prisma

1. Reemplaza `prisma/schema.prisma` con `prisma/schema-postgresql.prisma`
2. Ejecuta las migraciones:

```bash
# Localmente
npx prisma migrate dev --name init

# O usar el script de setup
node scripts/setup-neon.js
```

### 5. Redesplegar en Vercel

1. Haz commit de los cambios:
   ```bash
   git add .
   git commit -m "Configurar Neon PostgreSQL"
   git push origin main
   ```

2. Vercel detectará los cambios y redesplegará automáticamente

### 6. Verificar el funcionamiento

1. Ve a `https://sago-factu-v0-2.vercel.app/auth/signin`
2. Usa las credenciales:
   - Email: `admin@sagofactu.com`
   - Contraseña: `admin123`

## 🔧 Solución de problemas

### Error: "relation does not exist"
- Ejecuta el script de setup: `node scripts/setup-neon.js`
- O ejecuta las migraciones de Prisma

### Error: "connection refused"
- Verifica que la URL de Neon sea correcta
- Asegúrate de que `sslmode=require` esté en la URL

### Error: "InvalidCredentials"
- Verifica que el usuario se haya creado correctamente
- Revisa los logs de Vercel para más detalles

## 📊 Ventajas de Neon

- ✅ **Gratuito** hasta 0.5GB
- ✅ **Serverless** - no necesitas gestionar servidores
- ✅ **Compatible** con Vercel
- ✅ **PostgreSQL** completo
- ✅ **Escalable** automáticamente
- ✅ **Backup** automático

## 🎯 Próximos pasos

Una vez que el login funcione:
1. Implementar dashboard completo
2. Agregar gestión de folios
3. Implementar emisión de facturas
4. Configurar monitoreo y logs

