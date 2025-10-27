# 📚 DOCUMENTACIÓN TÉCNICA - SAGO-FACTU

## 🎯 Descripción General

**SAGO-FACTU** es una plataforma multi-tenant de facturación electrónica para Panamá que actúa como intermediario entre clientes y "The Factory HKA" para la gestión, distribución y monitoreo de folios de facturación electrónica.

---

## 🛠️ STACK TECNOLÓGICO

### **Frontend**
- **Framework**: Next.js 15.5.6 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x (strict mode)
- **Estilos**: Tailwind CSS 4
- **UI Components**: 
  - Radix UI (primitivos accesibles)
  - Lucide React (iconos)
  - Recharts 3.3.0 (gráficos)
- **Formularios**: 
  - React Hook Form 7.65.0
  - Zod 4.1.12 (validación)
  - @hookform/resolvers
- **Temas/Autenticación**:
  - next-themes 0.4.6 (dark mode)
  - next-auth 5.0.0-beta.29 (JWT + Credentials)

### **Backend**
- **Runtime**: Node.js (Edge compatible)
- **ORM**: Prisma 6.17.1
- **Base de Datos**: PostgreSQL (Neon)
- **Autenticación**: NextAuth.js v5 (JWT)
- **Validación**: Zod
- **Encriptación**: bcryptjs 3.0.2 (contraseñas)

### **Integraciones Externas**
- **HKA (The Factory)**: 
  - SOAP Client (node-soap 1.0.0)
  - XML Generator (xml2js, xmlbuilder2)
- **Storage**: AWS S3 (@aws-sdk/client-s3)
- **Email**: Resend 6.1.3
- **Procesamiento Asíncrono**: 
  - BullMQ 5.61.0
  - ioredis 5.8.1

### **Utilidades**
- **Excel**: exceljs 4.4.0
- **Fechas**: date-fns 4.1.0
- **IDs**: nanoid 5.1.6
- **Parsing**: fast-xml-parser 5.3.0
- **Strings**: clsx, tailwind-merge

### **DevOps & Deployment**
- **Hosting**: Vercel
- **Base de Datos**: Neon PostgreSQL
- **PWA**: next-pwa 5.6.0
- **CI/CD**: GitHub Actions
- **Linting**: ESLint 9 (Next.js config)

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### **Estructura de Directorios**

```
sago-factu/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Endpoints administrativos
│   │   ├── auth/                # Autenticación NextAuth
│   │   ├── configuration/       # Configuración de sistema
│   │   ├── documentos/          # Gestión de documentos HKA
│   │   ├── folios/              # Gestión de folios
│   │   ├── hka/                 # Integración HKA
│   │   ├── invoices/            # Gestión de facturas
│   │   └── notifications/       # Sistema de notificaciones
│   ├── dashboard/               # Panel principal
│   │   ├── admin/              # Panel Super Admin
│   │   │   ├── auditoria/     # Logs de auditoría
│   │   │   ├── folios/        # Gestión de folios
│   │   │   ├── metricas/      # Estadísticas
│   │   │   ├── organizaciones/ # CRUD organizaciones
│   │   │   └── users/         # Gestión de usuarios
│   │   ├── clientes/           # Gestión de clientes
│   │   ├── configuracion/      # Configuración del usuario
│   │   ├── facturas/           # Gestión de facturas
│   │   ├── folios/             # Folios del usuario
│   │   └── reportes/           # Reportes
│   ├── layout.tsx              # Layout raíz (ThemeProvider)
│   └── page.tsx                # Landing page / Login
│
├── components/                   # Componentes React
│   ├── admin/                   # Componentes administrativos
│   ├── configuration/          # Gestión de configuración
│   ├── dashboard/              # Componentes del dashboard
│   ├── folios/                 # Componentes de folios
│   ├── home/                   # Landing page
│   ├── invoices/               # Gestión de facturas
│   ├── reports/                # Reportes
│   ├── ui/                     # Componentes UI base
│   ├── theme-toggle.tsx        # Toggle de tema
│   └── theme-provider.tsx      # Provider de tema
│
├── lib/                         # Librerías y utilidades
│   ├── db/                     # Conexiones DB
│   ├── hka/                    # Integración HKA
│   │   ├── methods/            # Métodos SOAP
│   │   ├── soap/               # Cliente SOAP
│   │   ├── transformers/       # Transformadores datos
│   │   └── xml/                # Generador XML
│   ├── utils/                  # Utilidades
│   ├── validations/            # Esquemas Zod
│   ├── workers/                # Procesadores asíncronos
│   ├── auth.config.ts         # Config NextAuth
│   ├── auth.ts                 # Session helpers
│   ├── config.ts               # Configuración global
│   ├── prisma.ts               # Cliente Prisma
│   └── prisma-server.ts        # Prisma para servidor
│
├── prisma/                      # Prisma ORM
│   ├── schema.prisma           # Esquema de BD
│   └── seed.ts                 # Datos iniciales
│
├── public/                      # Archivos estáticos
│   ├── manifest.json           # Manifest PWA
│   └── icons/                  # Iconos PWA
│
├── scripts/                     # Scripts auxiliares
│   └── [varios scripts .js/.ts]
│
├── docs/                        # Documentación
│   └── [archivos .md]
│
└── [archivos de configuración]
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── package.json
```

---

## 🗄️ MODELO DE DATOS (Prisma Schema)

### **Entidades Principales**

#### **1. Organization (Multi-tenancy)**
```prisma
model Organization {
  // Identificación
  id, slug (unique), name, ruc
  
  // Configuración HKA
  hkaEnabled, hkaTokenUser
  
  // Configuración de facturación
  autoSendToHKA, requireApproval, emailOnCertification
  
  // Límites
  maxUsers, maxFolios
  
  // Relaciones
  users, folios, invoices, apiKeys, customers
}
```

#### **2. User (Usuarios)**
```prisma
model User {
  // Autenticación
  email (unique), password (bcrypt)
  
  // Multi-tenancy
  organizationId (FK → Organization)
  
  // Roles
  role: SUPER_ADMIN | ORG_ADMIN | USER
  
  // Relaciones
  organization, invoices, tokens
}
```

#### **3. Invoice (Facturas)**
```prisma
model Invoice {
  // Multi-tenancy
  organizationId, createdBy
  
  // Emisor (snapshot)
  issuerRuc, issuerName, issuerAddress
  
  // Receptor
  receiverType, receiverName, receiverEmail
  
  // Documento
  invoiceNumber, cufe, qrCode
  
  // Montos
  subtotal, itbms, total, currency
  
  // Estado
  status: DRAFT | APPROVED | FAILED
  
  // Relaciones
  organization, user, items, logs
}
```

#### **4. FolioPool & FolioAssignment**
```prisma
model FolioPool {
  // Compra de folios
  totalFolios, purchasedAt, purchaseAmount
  
  // Organización dueña
  organizationId
}

model FolioAssignment {
  // Asignación
  folioPoolId, organizationId
  
  // Cantidades
  assignedAmount, consumedAmount
  
  // Alertas
  alertThreshold, alertSent
}
```

#### **5. Customer (Clientes)**
```prisma
model Customer {
  // Identificación
  ruc, rucType, name
  
  // Multi-tenancy
  organizationId
  
  // Contacto
  email, phone, address
}
```

#### **6. Notification & AuditLog**
```prisma
model Notification {
  userId, organizationId
  type, title, message
  read, readAt
}

model AuditLog {
  userId, organizationId
  action, entity, entityId
  metadata (JSON)
}
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### **NextAuth.js v5 Configuration**

```typescript
// lib/auth.config.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // Validación con Zod
      credentials: { email, password }
      // Autorización con Prisma
      authorize: async (credentials) => { /* ... */ }
    })
  ],
  pages: {
    signIn: '/',
    error: '/',
    signOut: 'https://sago-factu-v0-2.vercel.app/'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 días
  },
  callbacks: {
    jwt: ({ token, user }) => { /* ... */ },
    session: ({ session, token }) => { /* ... */ }
  }
})
```

### **Roles del Sistema**

1. **SUPER_ADMIN**: 
   - Acceso total al sistema
   - Gestión de organizaciones
   - Estadísticas globales
   
2. **ORG_ADMIN**:
   - Gestión de su organización
   - Usuarios de la organización
   - Configuración de la organización
   
3. **USER**:
   - Crear y gestionar facturas
   - Ver folios asignados
   - Clientes de la organización

---

## 🌐 INTEGRACIÓN HKA (The Factory)

### **Cliente SOAP**

```typescript
// lib/hka/soap/client.ts
class HKASOAPClient {
  private wsdl: string
  private createClient(): Promise<soap.Client>
  
  // Métodos disponibles:
  - consultarFolios()
  - enviarDocumento(recepcionFE)
  - consultarDocumento(consultaFE)
  - anularDocumento()
  - notaCredito()
  - notaDebito()
}
```

### **Generador XML**

```typescript
// lib/hka/xml/generator.ts
class XMLGenerator {
  generarXMLFactura(data: FacturaElectronicaInput): string
  calcularTotales(items): { subtotal, itbms, total }
  generarCUFE(datos): string
}
```

### **Procesamiento Asíncrono**

```typescript
// lib/workers/invoice-processor.ts
export class InvoiceProcessor {
  async process(invoiceId: string) {
    // 1. Obtener factura
    // 2. Transformar a XML
    // 3. Enviar a HKA
    // 4. Actualizar estado
    // 5. Enviar email
  }
}
```

---

## 🎨 SISTEMA DE DISEÑO

### **Tailwind CSS 4**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        violet: { 50-900 }, // Paleta personalizada
      },
      boxShadow: {
        'card': '0 8px 30px rgba(99, 102, 241, 0.12)',
        'card-hover': '0 12px 40px rgba(99, 102, 241, 0.18)',
      }
    }
  }
}
```

### **Dark Mode (next-themes)**

```typescript
// components/theme-provider.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}
  storageKey="sago-factu-theme"
>
  {children}
</ThemeProvider>
```

**Uso en componentes:**
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  {/* Contenido */}
</div>
```

---

## 📱 PROGRESSIVE WEB APP (PWA)

### **Configuración**

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.Nativity === 'development',
  runtimeCaching: [/* ... */]
})
```

### **Manifest**

```json
// public/manifest.json
{
  "name": "Sago Factu",
  "short_name": "SagoFactu",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "icons": [/* ... */]
}
```

---

## 🔄 FLUJO DE FACTURACIÓN

### **Proceso Completo**

```
1. Usuario crea factura (dashboard/facturas/nueva)
   ↓
2. Formulario validado con Zod
   ↓
3. POST /api/invoices/create
   ↓
4. Guardar en BD (status: DRAFT)
   ↓
5. Encolar job en BullMQ
   ↓
6. Protoniquet: Procesar factura
   ↓
   6.1. Obtener factura + items
   6.2. Transformar a FacturaElectronicaInput
   6.3. Generar XML
   6.4. Validar XML
   6.5. Enviar a HKA (SOAP)
   6.6. Actualizar status (APPROVED/FAILED)
   6.7. Enviar email con PDF/XML
   ↓
7. Usuario ve factura certificada
```

### **Estados de Factura**

- **DRAFT**: Borrador
- **PENDING**: Enviada a HKA
- **APPROVED**: Certificada
- **FAILED**: Rechazada
- **CANCELLED**: Anulada

---

## 🚀 DEPLOYMENT

### **Vercel**

1. **Variables de Entorno**:
   - `DATABASE_URL` (Neon PostgreSQL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - Credenciales HKA (demo/prod)
   - AWS S3 credentials
   - Redis URL

2. **Build Command**: `npm run build`

3. **Start Command**: `npm start`

### **Neon PostgreSQL**

- Database: Serverless PostgreSQL
- Connection: Connection Pooling
- Extensions: Prisma + @neondatabase/serverless

---

## 📊 API ENDPOINTS

### **Autenticación**
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `GET /api/auth/[...nextauth]` - NextAuth handler

### **Facturas**
- `POST /api/invoices/create` - Crear factura
- `POST /api/invoices/[id]/process` - Procesar factura
- `GET /api/invoices/[id]/pdf` - Obtener PDF
- `GET /api/invoices/[id]/xml` - Obtener XML
- `POST /api/invoices/[id]/cancel` - Anular factura

### **Folios**
- `POST /api/folios/purchase` - Comprar folios
- `GET /api/folios/available` - Folios disponibles
- `POST /api/folios/sincronizar` - Sincronizar con HKA
- `GET /api/folios/tiempo-real` - Estado en tiempo real

### **Configuración**
- `PUT /api/configuration/organization` - Actualizar organización
- `PUT /api/configuration/invoice-settings` - Ajustes factura
- `PUT /api/configuration/notifications` - Notificaciones
- `PUT /api/configuration/security` - Seguridad

### **HKA**
- `GET /api/hka/test-connection` - Probar conexión HKA
- `POST /api/documentos/enviar` - Enviar documento
- `POST /api/documentos/consultar` - Consultar documento
- `POST /api/documentos/anular` - Anular documento

---

## 🔒 SEGURIDAD

### **Implementado**

1. **Autenticación**:
   - JWT tokens
   - Bcrypt hashing (contraseñas)
   - Session management

2. **Autorización**:
   - Role-based access control (RBAC)
   - Route protection
   - API endpoint guards

3. **Validación**:
   - Zod schemas
   - Input sanitization
   - SQL injection prevention (Prisma)

4. **Encriptación**:
   - HTTPS (Vercel)
   - Env variables seguras

---

## 🧪 TESTING & CALIDAD

### **Linting**
```bash
npm run lint          # Ejecutar ESLint
npm run lint:fix      # Corregir automáticamente
```

### **TypeScript**
```bash
tsc --noEmit          # Verificar tipos
```

---

## 📈 MÉTRICAS Y MONITOREO

### **Stadísticas Disponibles**

- Organizaciones activas/inactivas
- Usuarios totales/recientes
- Facturas emitidas/certificadas
- Folios asignados/consumidos
- Ingresos estimados
- Actividad mensual (gráficos)

---

## 🔧 SCRIPTS DISPONIBLES

```bash
# Desarrollo
npm run dev              # Servidor desarrollo
npm run dev:turbo        # Con Turbopack

# Build
npm run build           # Build producción
npm run build:vercel    # Build para Vercel

# Base de datos
npm run db:generate     # Generar Prisma Client
npm run db:push         # Push schema a BD
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Seed inicial
npm run db:studio       # Prisma Studio

# Administración
npm run admin:reset     # Reset Super Admin
npm run admin:check     # Verificar usuario

# Neon
npm run neon:auth       # Autenticar Neon CLI
npm run neon:info       # Info de conexión
```

---

## 📝 NOTAS IMPORTANTES

1. **Multi-tenancy**: Todas las consultas filtran por `organizationId`

2. **JWT**: No usa Prisma Adapter, solo JWT con custom callbacks

3. **Edge Runtime**: Compatible con Edge Functions de Vercel

4. **PWA**: Solo activa en producción

5. **Dark Mode**: Class-based, no system preference

6. **HKA**: Credenciales separadas para demo y producción

---

## 🎯 MEJORAS FUTURAS

- [ ] Tests unitarios e integración
- [ ] Sentry para error tracking
- [ ] Email templates personalizados
- [ ] Exportación de reportes (PDF/Excel)
- [ ] API pública con autenticación API Keys
- [ ] Webhooks para integraciones
- [ ] Multi-idioma (i18n)
- [ ] Dashboard analytics avanzado

---

**Generado**: `$(date)`  
**Versión**: 0.1.0  
**Última actualización**: Commit ef12426
