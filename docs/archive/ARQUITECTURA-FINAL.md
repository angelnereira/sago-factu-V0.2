# 🏗️ ARQUITECTURA FINAL - SAGO-FACTU

**Fecha:** $(date)  
**Estado:** ✅ Completamente funcional  
**Versión:** 1.0.0

---

## 📊 STACK TECNOLÓGICO

### **Frontend & Backend**
- **Framework:** Next.js 15.5.6 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Componentes:** shadcn/ui + Radix UI

### **Base de Datos**
- **Provider:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma 6.17.1
- **Conexión:** Pooled connection para mejor performance
- **Ubicación:** 
  - Desarrollo: Neon (mismo que producción)
  - Producción: Neon (ep-divine-field-ad26eaav-pooler)

### **Autenticación**
- **Sistema:** NextAuth.js v5
- **Estrategia:** JWT (sin adapter de BD)
- **Provider:** Credentials (email/password)
- **Hash:** bcrypt (12 rounds)

### **Despliegue**
- **Plataforma:** Vercel
- **URL Producción:** https://sago-factu.vercel.app
- **Build:** Custom script (`vercel-build.sh`)
- **CI/CD:** Auto-deploy en push a `main`

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### **Modelos Principales:**

```
Organization (Multi-tenancy)
├── Users (autenticación y roles)
├── FolioAssignment (asignación de folios)
├── Invoices (facturas electrónicas)
└── ApiKeys (integraciones externas)

Supporting Models:
├── FolioPool (gestión centralizada de folios)
├── InvoiceItem (líneas de factura)
├── InvoiceLog (auditoría de facturas)
├── FolioConsumption (consumo de folios)
├── Notification (notificaciones de usuarios)
├── AuditLog (auditoría del sistema)
└── SystemConfig (configuración global)
```

### **Relaciones Clave:**

- **Organization 1:N User** (multi-tenancy)
- **Organization 1:N Invoice** (aislamiento de datos)
- **FolioPool 1:N FolioAssignment** (distribución de folios)
- **Invoice 1:N InvoiceItem** (líneas de factura)
- **Invoice 1:1 FolioConsumption** (tracking de folios)

---

## 🔐 FLUJO DE AUTENTICACIÓN

### **Registro de Usuario:**

```
1. Usuario → /auth/signup (formulario)
2. Validaciones del lado del servidor:
   - Campos requeridos
   - Contraseñas coinciden
   - Mínimo 6 caracteres
   - Email único
3. Buscar/Crear organización "empresa-demo"
4. Hash de contraseña (bcrypt, 12 rounds)
5. Crear usuario con rol USER
6. Redirigir a /auth/signin con mensaje de éxito
```

### **Login:**

```
1. Usuario → /auth/signin (formulario)
2. Server Action → signIn("credentials", { email, password })
3. NextAuth → CredentialsProvider → authorize()
4. Buscar usuario en BD (prisma.user.findUnique)
5. Verificar contraseña (bcrypt.compare)
6. Validar usuario activo
7. Retornar user object (id, email, name, role, organizationId)
8. NextAuth crea JWT token con callbacks:
   - jwt() → Agrega role y organizationId al token
   - session() → Agrega role y organizationId a la sesión
9. Redirigir a /dashboard
```

### **Protección de Rutas:**

```
1. Middleware (ligero):
   - Solo routing básico
   - Permite rutas públicas (/auth/*, /, /api/*)
   - Resto pasa al servidor

2. Server Components:
   - auth() para obtener sesión
   - Verificar session antes de renderizar
   - redirect("/auth/signin") si no autenticado
```

---

## 📂 ESTRUCTURA DE ARCHIVOS

### **Configuración Principal:**

```
sago-factu/
├── .env                        # Variables de entorno (Neon PostgreSQL)
├── .env.example                # Template de variables
├── .gitignore                  # Protege credenciales
├── next.config.js              # Config de Next.js
├── tailwind.config.js          # Config de Tailwind
├── tsconfig.json               # Config de TypeScript
├── package.json                # Dependencias y scripts
├── vercel.json                 # Config de Vercel
└── vercel-build.sh             # Build custom para Vercel
```

### **Prisma:**

```
prisma/
├── schema.prisma               # Schema de PostgreSQL (14 modelos)
└── seed.ts                     # Seed inicial (Super Admin + Demo)
```

### **Librerías:**

```
lib/
├── prisma.ts                   # Cliente Prisma único
└── auth.ts                     # Configuración NextAuth
```

### **Aplicación:**

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Layout global
├── auth/
│   ├── signin/page.tsx         # Login
│   └── signup/page.tsx         # Registro
├── dashboard/page.tsx          # Dashboard (protegido)
└── api/auth/[...nextauth]/
    └── route.ts                # API NextAuth
```

### **Scripts:**

```
scripts/
├── diagnose-neon.js            # Diagnóstico de BD
├── test-registration.js        # Test de registro
├── setup-db.js                 # Setup de BD
└── switch-db-provider.js       # Cambio de provider (legacy)
```

---

## 🔄 FLUJO DE DEPLOYMENT

### **Local → GitHub → Vercel:**

```
1. Desarrollo local:
   - DATABASE_URL → Neon PostgreSQL
   - NEXTAUTH_URL → http://localhost:3000
   - npm run dev

2. Commit y Push:
   - git add -A
   - git commit -m "..."
   - git push origin main

3. Vercel Auto-Deploy:
   - Detecta push a main
   - Ejecuta vercel-build.sh:
     a. Genera Prisma Client
     b. Aplica schema con `prisma db push`
     c. Ejecuta seed (si necesario)
     d. Build de Next.js
   - Deploy a producción
   - URL: https://sago-factu.vercel.app
```

---

## 🌐 VARIABLES DE ENTORNO

### **Desarrollo (.env):**

```bash
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_ENDPOINT.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET_HERE"
SUPER_ADMIN_EMAIL="admin@sagofactu.com"
SUPER_ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
HKA_ENV="demo"
# ... más variables
```

### **Producción (Vercel):**

```bash
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_ENDPOINT.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="https://sago-factu.vercel.app"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET_HERE"
# ... mismas variables que dev
```

**Nota:** Mismo DATABASE_URL en dev y prod (Neon)
**⚠️ IMPORTANTE:** Ver `vercel-env.example.txt` para configurar tus propias credenciales

---

## ✅ ESTADO ACTUAL

### **Completado:**

- ✅ Configuración de Next.js 15 + TypeScript
- ✅ Prisma Schema con 14 modelos (PostgreSQL)
- ✅ Conexión a Neon PostgreSQL (dev y prod)
- ✅ Sistema de autenticación completo (login + registro)
- ✅ Middleware optimizado (< 100 KB)
- ✅ Protección de rutas por servidor
- ✅ Multi-tenancy básico (organizaciones)
- ✅ Roles de usuario (SUPER_ADMIN, ORG_ADMIN, USER, API_USER)
- ✅ Deployment en Vercel funcional
- ✅ Scripts de diagnóstico y testing
- ✅ Seguridad (credenciales en .gitignore)
- ✅ Documentación completa

### **Datos de Prueba:**

**Usuarios existentes en Neon:**
- `admin@sagofactu.com` / `admin123` (SUPER_ADMIN)
- `usuario@empresa.com` / `usuario123` (USER)
- `angelnereira15@gmail.com` (USER)

**Organización:**
- Empresa Demo S.A. (empresa-demo)

---

## 🚧 PENDIENTE (Próximas Fases)

### **Fase 2: Gestión de Folios**
- [ ] API para compra de folios
- [ ] API para asignación de folios a organizaciones
- [ ] Sistema de alertas de folios bajos
- [ ] Dashboard de consumo de folios

### **Fase 3: Emisión de Facturas**
- [ ] Formulario de nueva factura
- [ ] Integración con HKA SOAP
- [ ] Generación de XML FEL (Panamá)
- [ ] Worker async con BullMQ + Redis
- [ ] Almacenamiento en AWS S3
- [ ] Descarga de PDF/XML certificado

### **Fase 4: Dashboard y Reportes**
- [ ] Métricas en tiempo real
- [ ] Gráficos de consumo
- [ ] Lista de facturas
- [ ] Filtros y búsqueda
- [ ] Exportación de datos

### **Fase 5: Integraciones**
- [ ] API Keys para clientes
- [ ] Webhooks
- [ ] Rate limiting
- [ ] Documentación de API (OpenAPI)

---

## 📊 MÉTRICAS

**Base de Datos:**
- 14 tablas creadas
- 3 usuarios de prueba
- 1 organización activa
- 0 facturas (por ahora)

**Código:**
- Líneas de código: ~2,500+
- Archivos TypeScript: 15+
- Modelos Prisma: 14
- Rutas de API: 1 (/api/auth/[...nextauth])
- Páginas: 4 (home, signin, signup, dashboard)

**Performance:**
- Build time: ~30-40 segundos
- Middleware size: < 100 KB ✅
- First Load JS: ~102 KB

---

## 🔧 COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev                     # Iniciar servidor de desarrollo
npm run build                   # Build de producción

# Base de Datos
npx prisma generate             # Generar Prisma Client
npx prisma db push              # Aplicar schema a BD
npx prisma studio               # Abrir GUI de BD
npm run db:seed                 # Poblar BD con datos iniciales

# Testing
node scripts/diagnose-neon.js   # Diagnosticar BD
node scripts/test-registration.js  # Probar registro

# Deployment
git push origin main            # Auto-deploy a Vercel
```

---

## 📚 RECURSOS

- **Documentación Next.js:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth.js:** https://next-auth.js.org
- **Neon PostgreSQL:** https://neon.tech/docs
- **Vercel Docs:** https://vercel.com/docs

---

## 👨‍💻 MANTENIMIENTO

**Creado por:** Sistema de Desarrollo SAGO-FACTU  
**Última actualización:** $(date)  
**Estado:** ✅ Producción  
**Contacto:** admin@sagofactu.com

---

**NOTA IMPORTANTE:** 
- Todas las credenciales sensibles están protegidas en `.gitignore`
- Usar `vercel-env.example.txt` como referencia para configurar nuevos ambientes
- Ver `SECURITY.md` para guías de seguridad
- Ver `DIAGNOSTICO-ARQUITECTURA.md` para troubleshooting


