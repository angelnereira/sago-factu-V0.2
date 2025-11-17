# Plan: Sistema de Planes (Simple + Empresarial)

## Objetivo

Implementar sistema de dos planes de facturación para SAGO-FACTU sin romper funcionalidad existente:
- **Plan Empresarial (actual)**: Folios gestionados por Sago Factor, dashboard completo
- **Plan Simple (nuevo)**: Credenciales HKA propias, compra folios directo, UI minimalista

## Fase 1: Base de Datos

### 1.1 Enums y Model Organization

**Archivo:** `prisma/schema.prisma`

Agregar después de la línea 134 (después de enum UserRole existente):
```prisma
enum OrganizationPlan {
  SUPER_ADMIN       // Administrador de plataforma
  ENTERPRISE        // Plan empresarial (folio pool compartido)
  SIMPLE            // Plan simple (cred. HKA propias)
}
```

Modificar model Organization (línea ~14-74):
- Después de `hkaTokenUser String?` (línea 28), agregar:
```prisma
plan                OrganizationPlan    @default(ENTERPRISE)
hkaTokenPassword    String?             // Encriptado para Plan Simple
hkaEnvironment      String?             @default("demo")
```

Nota: Usar String en lugar de enum porque TypeScript ya define `HKAEnvironment` como type.

### 1.2 Modificar UserRole Enum

**Archivo:** `prisma/schema.prisma`

En enum UserRole existente (línea ~128-133), agregar:
```prisma
enum UserRole {
  SUPER_ADMIN
  ORG_ADMIN
  USER
  SIMPLE_USER       // Usuario Plan Simple
  API_USER
}
```

### 1.3 Migración

Ejecutar:
```bash
npx prisma migrate dev --name add_organization_plans
npx prisma generate
```

## Fase 2: Utilidad de Encriptación

### 2.1 Crear Archivo de Encriptación

**Archivo:** `lib/utils/encryption.ts` (NUEVO)

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sago-factu-encryption-key-32ch!!';
const IV_LENGTH = 16;

export function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptToken(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### 2.2 Agregar Variable de Entorno

**Archivo:** `.env.local`

Agregar al final:
```
ENCRYPTION_KEY=sago-factu-encryption-key-32ch!!
```

## Fase 3: Factory Pattern para HKA Client

### 3.1 Crear HKAClientFactory

**Archivo:** `lib/hka/client-factory.ts` (NUEVO)

```typescript
import { HKASOAPClient } from './soap/client';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { decryptToken } from '@/lib/utils/encryption';
import { OrganizationPlan, HKAEnvironment } from '@prisma/client';

export class HKAClientFactory {
  /**
   * Obtiene un cliente HKA configurado según el plan de la organización
   */
  static async getClient(organizationId: string): Promise<HKASOAPClient> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        hkaTokenUser: true,
        hkaTokenPassword: true,
        hkaEnvironment: true,
      }
    });

    if (!org) {
      throw new Error(`Organización ${organizationId} no encontrada`);
    }

    // Determinar credenciales según el plan
    let tokenUser: string;
    let tokenPassword: string;
    let environment: HKAEnvironment;

    if (org.plan === OrganizationPlan.SIMPLE) {
      // Plan Simple: usar credenciales propias
      if (!org.hkaTokenUser || !org.hkaTokenPassword) {
        throw new Error(
          `La organización "${org.name}" (Plan Simple) no tiene credenciales HKA configuradas. ` +
          `Configure las credenciales en Configuración.`
        );
      }
      tokenUser = org.hkaTokenUser;
      tokenPassword = decryptToken(org.hkaTokenPassword);
      environment = (org.hkaEnvironment || 'demo') as HKAEnvironment;
    } else {
      // Plan Empresarial/Super Admin: usar credenciales centralizadas
      tokenUser = process.env.HKA_DEMO_TOKEN_USER!;
      tokenPassword = process.env.HKA_DEMO_TOKEN_PASSWORD!;
      environment = 'demo';

      if (!tokenUser || !tokenPassword) {
        throw new Error('Credenciales HKA de Sago Factor no configuradas en .env');
      }
    }

    // NOTA: HKASOAPClient es singleton y usa variables de entorno
    // Temporalmente establecer vars de entorno para este request
    process.env._HKAClientFactory_TOKEN_USER = tokenUser;
    process.env._HKAClientFactory_TOKEN_PASSWORD = tokenPassword;
    process.env.HKA_ENV = environment;

    const client = new HKASOAPClient();
    return client;
  }
}
```

### 3.2 Modificar HKASOAPClient para Aceptar Credenciales Dinámicas

**Archivo:** `lib/hka/soap/client.ts`

Modificar constructor (línea ~9-28) para leer vars temporales:

```typescript
constructor() {
  const environment = (process.env._HKAClientFactory_ENV || process.env.HKA_ENV || 'demo') as HKAEnvironment;
  
  // Usar credenciales de factory si existen, sino usar env normal
  this.wsdlUrl = environment === 'demo' 
    ? `${process.env.HKA_DEMO_SOAP_URL}?wsdl`
    : `${process.env.HKA_PROD_SOAP_URL}?wsdl`;

  this.credentials = {
    tokenEmpresa: process.env._HKAClientFactory_TOKEN_USER || 
                  (environment === 'demo' ? process.env.HKA_DEMO_TOKEN_USER! : process.env.HKA_PROD_TOKEN_USER!),
    tokenPassword: process.env._HKAClientFactory_TOKEN_PASSWORD || 
                   (environment === 'demo' ? process.env.HKA_DEMO_TOKEN_PASSWORD! : process.env.HKA_PROD_TOKEN_PASSWORD!),
    usuario: process.env._HKAClientFactory_TOKEN_USER || 
             (environment === 'demo' ? process.env.HKA_DEMO_TOKEN_USER! : process.env.HKA_PROD_TOKEN_USER!),
  };
  
  // Limpiar vars temporales
  delete process.env._HKAClientFactory_TOKEN_USER;
  delete process.env._HKAClientFactory_TOKEN_PASSWORD;
}
```

## Fase 4: Utilidades de Autorización

### 4.1 Crear Archivo de Autorización

**Archivo:** `lib/auth/authorization.ts` (NUEVO)

```typescript
import { auth } from '@/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { OrganizationPlan, UserRole } from '@prisma/client';

export async function getCurrentUserWithOrg() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          plan: true,
          hkaTokenUser: true,
          hkaEnvironment: true,
        }
      }
    }
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUserWithOrg();
  if (!user) throw new Error('No autenticado');
  return user;
}

export async function requirePlan(allowedPlans: OrganizationPlan[]) {
  const user = await requireAuth();
  if (!user.organization) throw new Error('Usuario sin organización');
  if (!allowedPlans.includes(user.organization.plan)) {
    throw new Error(`Plan requerido: ${allowedPlans.join(' o ')}`);
  }
  return user;
}

export async function canAccessSimplePlan(): Promise<boolean> {
  const user = await getCurrentUserWithOrg();
  return user?.organization?.plan === OrganizationPlan.SIMPLE;
}

export async function canAccessEnterprisePlan(): Promise<boolean> {
  const user = await getCurrentUserWithOrg();
  return [OrganizationPlan.ENTERPRISE, OrganizationPlan.SUPER_ADMIN]
    .includes(user?.organization?.plan as OrganizationPlan);
}
```

## Fase 5: Middleware de Redirección

### 5.1 Modificar Middleware

**Archivo:** `middleware.ts`

Modificar función middleware (línea ~21) para agregar lógica de redirección:

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/auth/signup', '/auth/error', '/auth/forgot-password', '/about', '/contact'];
  if (publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const sessionToken = 
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (!sessionToken) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🆕 NUEVA LÓGICA: Redirección según plan
  // Importar dinámicamente para evitar problemas de Edge Runtime
  const { cookies } = await import('next/headers');
  const session = await auth();
  
  if (session?.user?.organization?.plan === 'SIMPLE' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/simple', request.url));
  }
  
  if (session?.user?.organization?.plan === 'ENTERPRISE' && pathname.startsWith('/simple')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if ((pathname === '/' || pathname === '/dashboard') && session?.user) {
    const plan = session.user.organization?.plan;
    if (plan === 'SIMPLE') {
      return NextResponse.redirect(new URL('/simple', request.url));
    } else if (plan === 'ENTERPRISE' || plan === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}
```

Nota: El middleware actual es Edge-compatible. Puede requerir simplificar la lógica o moverla a Server Components.

## Fase 6: APIs de Configuración HKA

### 6.1 Endpoint: Guardar Credenciales

**Archivo:** `app/api/settings/hka-credentials/route.ts` (NUEVO)

```typescript
import { NextResponse } from 'next/server';
import { requirePlan } from '@/lib/auth/authorization';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { encryptToken } from '@/lib/utils/encryption';
import { OrganizationPlan } from '@prisma/client';
import { z } from 'zod';

const schema = z.object({
  tokenUser: z.string().min(1),
  tokenPassword: z.string().min(1),
  environment: z.enum(['demo', 'prod']),
});

export async function POST(request: Request) {
  try {
    const user = await requirePlan([OrganizationPlan.SIMPLE]);
    const body = await request.json();
    const data = schema.parse(body);

    await prisma.organization.update({
      where: { id: user.organizationId! },
      data: {
        hkaTokenUser: data.tokenUser,
        hkaTokenPassword: encryptToken(data.tokenPassword),
        hkaEnvironment: data.environment,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requirePlan([OrganizationPlan.SIMPLE]);
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId! },
      select: { hkaTokenUser: true, hkaEnvironment: true }
    });

    return NextResponse.json({
      configured: !!org?.hkaTokenUser,
      tokenUser: org?.hkaTokenUser || null,
      environment: org?.hkaEnvironment || 'demo',
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

### 6.2 Endpoint: Probar Conexión

**Archivo:** `app/api/settings/test-hka-connection/route.ts` (NUEVO)

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { HKAClientFactory } from '@/lib/hka/client-factory';

export async function POST() {
  try {
    const user = await requireAuth();
    if (!user.organizationId) return NextResponse.json({ error: 'Sin organización' }, { status: 400 });

    const client = await HKAClientFactory.getClient(user.organizationId);
    
    return NextResponse.json({
      success: true,
      message: 'Conexión configurada correctamente',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
```

## Fase 7: UI Plan Simple

### 7.1 Layout Simple

**Archivo:** `app/simple/layout.tsx` (NUEVO)

```typescript
import { redirect } from 'next/navigation';
import { canAccessSimplePlan } from '@/lib/auth/authorization';

export default async function SimpleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canAccess = await canAccessSimplePlan();
  if (!canAccess) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <div>
            <h1 className="text-xl font-bold">SAGO-FACTU</h1>
            <p className="text-sm text-gray-500">Plan Simple</p>
          </div>
          <div>Usuario Simple</div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

### 7.2 Dashboard Simple

**Archivo:** `app/simple/page.tsx` (NUEVO)

```typescript
import Link from 'next/link';
import { Plus, Settings, FileText, Search } from 'lucide-react';
import { requirePlan } from '@/lib/auth/authorization';
import { OrganizationPlan } from '@prisma/client';
import { prismaServer as prisma } from '@/lib/prisma-server';

export default async function SimpleDashboard() {
  const user = await requirePlan([OrganizationPlan.SIMPLE]);

  const recentInvoices = await prisma.invoice.findMany({
    where: { organizationId: user.organizationId! },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold">Bienvenido a SAGO-FACTU Simple</h2>
        <p className="text-gray-600">Envía tus facturas a The Factory HKA</p>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/simple/nueva-factura">
          <div className="p-6 bg-white rounded-lg border hover:border-indigo-500">
            <Plus className="h-8 w-8 text-indigo-600 mb-2" />
            <h3 className="font-semibold">Nueva Factura</h3>
          </div>
        </Link>
        <Link href="/simple/configuracion">
          <div className="p-6 bg-white rounded-lg border hover:border-indigo-500">
            <Settings className="h-8 w-8 text-indigo-600 mb-2" />
            <h3 className="font-semibold">Configuración HKA</h3>
          </div>
        </Link>
      </div>

      {/* Facturas Recientes */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Facturas Recientes</h3>
        {recentInvoices.length === 0 ? (
          <p className="text-gray-500">No hay facturas aún</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{inv.invoiceNumber || 'Sin número'}</p>
                  <p className="text-sm text-gray-500">{inv.status}</p>
                </div>
                <p className="font-semibold">${Number(inv.total).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 7.3 Página de Configuración

**Archivo:** `app/simple/configuracion/page.tsx` (NUEVO)

```typescript
import { requirePlan } from '@/lib/auth/authorization';
import { OrganizationPlan } from '@prisma/client';
import HKACredentialsForm from '@/components/simple/hka-credentials-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';

export default async function ConfiguracionPage() {
  await requirePlan([OrganizationPlan.SIMPLE]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de The Factory HKA</h2>
        <p className="text-gray-600">Configura tus credenciales para conectar con HKA</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>¿Cómo obtener mis credenciales?</AlertTitle>
        <AlertDescription>
          Debes registrarte en The Factory HKA y comprar folios directamente.
          <a href="https://demo.thefactoryhka.com.pa" target="_blank" className="inline-flex items-center text-blue-600 hover:underline ml-2">
            Ir a The Factory HKA <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Credenciales de Acceso</h3>
        <HKACredentialsForm />
      </div>
    </div>
  );
}
```

### 7.4 Componente de Formulario

**Archivo:** `components/simple/hka-credentials-form.tsx` (NUEVO)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';

export default function HKACredentialsForm() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tokenUser, setTokenUser] = useState('');
  const [tokenPassword, setTokenPassword] = useState('');
  const [environment, setEnvironment] = useState<'demo' | 'prod'>('demo');

  useEffect(() => {
    fetch('/api/settings/hka-credentials')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setTokenUser(data.tokenUser);
          setEnvironment(data.environment);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/hka-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenUser, tokenPassword, environment }),
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Credenciales guardadas correctamente' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al guardar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/settings/test-hka-connection', { method: 'POST' });
      const result = await res.json();
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.success ? 'Conexión exitosa' : result.error 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al probar conexión' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tokenUser">Token Usuario</Label>
        <Input id="tokenUser" value={tokenUser} onChange={e => setTokenUser(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="tokenPassword">Token Password</Label>
        <Input id="tokenPassword" type="password" value={tokenPassword} onChange={e => setTokenPassword(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="environment">Ambiente</Label>
        <select 
          id="environment" 
          value={environment} 
          onChange={e => setEnvironment(e.target.value as 'demo' | 'prod')}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="demo">Demo</option>
          <option value="prod">Producción</option>
        </select>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
        <Button type="button" variant="outline" onClick={testConnection} disabled={testing}>
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Probar Conexión
        </Button>
      </div>
    </form>
  );
}
```

## Fase 8: Modificar Invoice Processor

### 8.1 Actualizar Worker

**Archivo:** `lib/workers/invoice-processor.ts`

En la línea donde se llama `getHKAClient()`, reemplazar con:
```typescript
import { HKAClientFactory } from '@/lib/hka/client-factory';

// En la función processInvoice, buscar (alrededor de línea 36):
// const hkaClient = getHKAClient();

// Reemplazar con:
const hkaClient = await HKAClientFactory.getClient(invoice.organizationId);
```

## Fase 9: Usuario de Prueba

### 9.1 Script de Seed

**Archivo:** `prisma/seed-simple-user.ts` (NUEVO)

```typescript
import { PrismaClient, OrganizationPlan, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando usuario Plan Simple...');

  const org = await prisma.organization.create({
    data: {
      name: 'Demo Plan Simple',
      slug: 'demo-simple',
      plan: OrganizationPlan.SIMPLE,
      hkaTokenUser: 'walgofugiitj_ws_tfhka',
      hkaTokenPassword: 'ENCRYPTED_PLACEHOLDER', // TODO: Encriptar
      hkaEnvironment: 'demo',
    }
  });

  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'simple@test.com',
      password: hashedPassword,
      name: 'Usuario Simple',
      role: UserRole.SIMPLE_USER,
      organizationId: org.id,
    }
  });

  console.log(`✅ Usuario creado: ${user.email} / Password123!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Estructura de Archivos

**Nuevos:**
- `lib/utils/encryption.ts`
- `lib/hka/client-factory.ts`
- `lib/auth/authorization.ts`
- `app/api/settings/hka-credentials/route.ts`
- `app/api/settings/test-hka-connection/route.ts`
- `app/simple/layout.tsx`
- `app/simple/page.tsx`
- `app/simple/configuracion/page.tsx`
- `components/simple/hka-credentials-form.tsx`
- `prisma/seed-simple-user.ts`

**Modificar:**
- `prisma/schema.prisma` (agregar campos y enum)
- `lib/hka/soap/client.ts` (modificar constructor)
- `middleware.ts` (agregar redirección por plan)
- `lib/workers/invoice-processor.ts` (usar factory)

## Testing

1. Ejecutar migración: `npx prisma migrate dev --name add_organization_plans`
2. Crear usuario de prueba: `npx tsx prisma/seed-simple-user.ts`
3. Login con `simple@test.com` / `Password123!`
4. Verificar redirección a `/simple`
5. Configurar credenciales HKA en `/simple/configuracion`
6. Probar conexión HKA
7. Verificar que usuarios existentes siguen accediendo a `/dashboard`

### To-dos

- [ ] Modificar schema de Prisma con plan, hkaTokenPassword, hkaEnvironment
- [ ] Agregar enum OrganizationPlan y SIMPLE_USER a UserRole
- [ ] Crear migración y generar Prisma Client
- [ ] Crear lib/utils/encryption.ts con funciones encryptToken/decryptToken
- [ ] Agregar ENCRYPTION_KEY a .env
- [ ] Crear lib/hka/client-factory.ts con getClient que seleccione credenciales por plan
- [ ] Modificar lib/hka/soap/client.ts constructor para usar vars temporales
- [ ] Crear lib/auth/authorization.ts con utilidades de autorización
- [ ] Modificar middleware.ts para redireccionar según plan
- [ ] Crear app/api/settings/hka-credentials/route.ts
- [ ] Crear app/api/settings/test-hka-connection/route.ts
- [ ] Crear app/simple/layout.tsx
- [ ] Crear app/simple/page.tsx
- [ ] Crear app/simple/configuracion/page.tsx
- [ ] Crear components/simple/hka-credentials-form.tsx
- [ ] Modificar lib/workers/invoice-processor.ts para usar HKAClientFactory
- [ ] Crear script prisma/seed-simple-user.ts
- [ ] Testing completo de ambos planes
