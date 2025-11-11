# 🚀 Guía de Inicio Rápido - SAGO-FACTU

## Configuración en 5 minutos

### 1. Instalación
```bash
# Instalar dependencias
npm install
```

### 2. Configuración Automática
```bash
# Generar archivo .env automáticamente
npm run setup
```

### 3. Configurar Base de Datos
```bash
# Editar .env con tu DATABASE_URL
# Ejemplo: DATABASE_URL="postgresql://user:password@localhost:5432/sagofactu"

# Generar cliente Prisma
npm run db:generate

# Crear tablas
npm run db:migrate

# Poblar con datos iniciales
npm run db:seed
```

### 4. Verificar Configuración
```bash
# Verificar que todo esté configurado correctamente
npm run check-config
```

### 5. Ejecutar Aplicación
```bash
# Iniciar servidor de desarrollo
npm run dev
```

## 🔑 Credenciales de Acceso

Después de ejecutar `npm run db:seed`:

- **Super Admin**: `admin@sagofactu.com` / `[password generado]`
- **Usuario Demo**: `usuario@empresa.com` / `usuario123`

## 📋 URLs Importantes

- **Aplicación**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Prisma Studio**: `npm run db:studio`

## 🛠️ Scripts Disponibles

```bash
# Configuración
npm run setup              # Configuración inicial automática
npm run check-config       # Verificar configuración

# Base de datos
npm run db:generate        # Generar cliente Prisma
npm run db:migrate         # Aplicar migraciones
npm run db:seed            # Poblar datos iniciales
npm run db:studio          # Abrir Prisma Studio
npm run db:reset           # Resetear base de datos

# Desarrollo
npm run dev                # Servidor de desarrollo
npm run build              # Construir para producción
npm run start              # Servidor de producción
```

## 🔧 Configuración Opcional

### AWS S3 (Para almacenamiento de archivos)
```env
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_S3_BUCKET="sago-factu-documents"
```

### Email (Para notificaciones)
```env
# Opción 1: Resend
RESEND_API_KEY="tu-resend-key"

# Opción 2: SendGrid
SENDGRID_API_KEY="tu-sendgrid-key"
```

### HKA (Para facturación electrónica)
```env
# Demo (ya configurado)
HKA_ENV="demo"

# Producción (solicitar credenciales a HKA)
HKA_ENV="production"
HKA_PROD_TOKEN_USER="tu-token-user"
HKA_PROD_TOKEN_PASSWORD="tu-token-password"
```

## 🚨 Solución de Problemas

### Error: "DATABASE_URL not found"
```bash
# Verificar que el archivo .env existe
ls -la .env

# Si no existe, ejecutar setup
npm run setup
```

### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

### Error: "Database connection failed"
```bash
# Verificar que PostgreSQL esté ejecutándose
# Verificar que DATABASE_URL sea correcta en .env
```

### Error: "Migration failed"
```bash
# Resetear base de datos
npm run db:reset
```

## 📞 Soporte

Si encuentras problemas:

1. Ejecuta `npm run check-config` para verificar la configuración
2. Revisa los logs en la consola
3. Verifica que todas las dependencias estén instaladas
4. Asegúrate de que PostgreSQL esté ejecutándose

---

**¡Listo! Tu sistema SAGO-FACTU está configurado y listo para usar.** 🎉
