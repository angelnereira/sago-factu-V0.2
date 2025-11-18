# 🔐 Role-Based Access Control (RBAC) Guide

## Overview

SAGO-FACTU implements a hierarchical role-based access control system. As of 2025-11-17, the system has been refactored to ensure:

1. **Only SUPER_ADMIN and ORG_ADMIN have administrative features**
2. **All regular USER roles have identical features and workflows**
3. **Consistent access control across all endpoints**
4. **Clear separation of concerns between roles**

---

## Role Hierarchy

```
┌─────────────────────────────────────────┐
│        SUPER_ADMIN (Global)             │
│  (Manages all organizations/users)      │
└─────────────────────────────────────────┘
           ↓ Manages
┌─────────────────────────────────────────┐
│     ORG_ADMIN (Organization)            │
│  (Manages single organization + users)  │
└─────────────────────────────────────────┘
           ↓ Manages
┌─────────────────────────────────────────┐
│    USER / SIMPLE_USER (Regular)         │
│  (Standard invoice/document operations) │
└─────────────────────────────────────────┘
```

---

## Role Definitions

### 1. SUPER_ADMIN (Global Administrator)

**Purpose:** System-wide administration

**Features:**
- ✅ User management (create, edit, delete)
- ✅ Organization management
- ✅ Folio synchronization from HKA
- ✅ System monitoring and metrics
- ✅ API logging and auditing
- ✅ Access to `/dashboard/admin` section
- ✅ Can manage any organization's settings
- ✅ Can view all invoices/documents
- ✅ Can trigger system monitors

**API Endpoints (Exclusive Access):**
```
POST   /api/admin/users/create
PUT    /api/admin/users/[id]/update
DELETE /api/admin/users/[id]/delete
POST   /api/admin/organizations
PUT    /api/admin/organizations/[orgId]
DELETE /api/admin/organizations/[orgId]
PUT    /api/admin/organizations/[orgId]/toggle
POST   /api/admin/folios/assign
GET    /api/admin/api-logs
DELETE /api/admin/api-logs/[id]
POST   /api/monitors/create
GET    /api/monitors/list
POST   /api/monitors/create-defaults
POST   /api/monitors/trigger
GET    /api/monitors/hka-stats
POST   /api/collections/create-default
```

**UI Access:**
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/users` - User management
- `/dashboard/admin/organizaciones` - Organization management
- `/dashboard/admin/folios` - Folio assignments
- `/dashboard/admin/metricas` - System metrics
- `/dashboard/admin/auditoria` - Audit logs
- `/dashboard/admin/api-logs` - API logs

**Navigation:** Admin section visible in sidebar

---

### 2. ORG_ADMIN (Organization Administrator)

**Purpose:** Single organization administration

**Features:**
- ✅ Manage users within own organization
- ✅ View/edit organization settings (name, RUC, address, contact)
- ✅ Configure invoicing settings
- ✅ Configure integrations
- ✅ Configure security settings
- ✅ Test HKA connection
- ✅ Manage organization-wide digital certificates
- ✅ View all organization invoices
- ✅ View organization metrics
- ❌ Cannot create new organizations
- ❌ Cannot manage other organizations
- ❌ Cannot trigger system monitors
- ❌ Cannot access global admin features

**API Endpoints (With Organization Isolation):**
```
PUT    /api/configuration/organization
PUT    /api/configuration/invoice-settings
PUT    /api/configuration/integration
PUT    /api/configuration/security
POST   /api/configuration/test-hka-connection
PUT    /api/configuration/users/[userId]
DELETE /api/configuration/users/[userId]
PUT    /api/configuration/users/[userId]/toggle
GET    /api/configuration/users/[userId]/folio-history
```

**UI Access:**
- `/dashboard/configuracion` - Configuration (restricted tabs):
  - Organización (Organization settings)
  - Usuarios (User management)
  - Facturación (Invoice settings)
  - Integración (Integration)
  - HKA Credentials

**Navigation:** Settings visible in navbar

**Isolation:** Can only manage users and settings within their assigned organization

---

### 3. USER (Standard User / Enterprise Plan)

**Purpose:** Invoice/document creation and management

**Features:**
- ✅ Create invoices/documents
- ✅ View own invoices/documents
- ✅ Download XML/PDF
- ✅ Send invoices via email
- ✅ Track email deliveries
- ✅ View clients (organization-filtered)
- ✅ View organization reports/metrics
- ✅ Manage personal signature preferences
- ✅ Upload personal certificates
- ✅ View folios (read-only)
- ✅ Access `/dashboard` main features
- ❌ Cannot configure organization
- ❌ Cannot manage users
- ❌ Cannot configure integration
- ❌ Cannot synchronize folios
- ❌ Cannot delete other users' invoices

**API Endpoints (Available):**
```
GET    /api/invoices
POST   /api/invoices/create
GET    /api/invoices/[id]
POST   /api/invoices/[id]/process
POST   /api/invoices/[id]/cancel
POST   /api/invoices/[id]/email/send
GET    /api/invoices/[id]/email/track
GET    /api/invoices/[id]/email/history
GET    /api/invoices/[id]/pdf
GET    /api/invoices/[id]/xml
POST   /api/documentos/enviar
GET    /api/folios/available
GET    /api/certificates
POST   /api/certificates (personal scope)
GET    /api/settings/profile
PUT    /api/settings/profile
GET    /api/settings/digital-signature
PUT    /api/settings/digital-signature
```

**UI Access:**
- `/dashboard` - Main dashboard
- `/dashboard/facturas` - Invoices
- `/dashboard/clientes` - Clients
- `/dashboard/reportes` - Reports
- `/dashboard/folios` - Folio view (read-only)
- `/dashboard/certificados` - Personal certificates
- `/dashboard/configuracion` - Personal settings only:
  - Perfil (Profile)
  - Firma Digital (Signature)
  - Notificaciones (Notifications)

**Navigation:** Standard dashboard navigation visible

---

### 4. SIMPLE_USER (Simple Plan User)

**Purpose:** Direct HKA integration without complex features

**Features:**
- ✅ Create invoices (simple interface)
- ✅ Configure HKA credentials
- ✅ Manage digital signature
- ✅ View invoices
- ❌ No folio management
- ❌ No client management
- ❌ No advanced reporting
- ❌ No configuration

**UI Access:**
- `/simple/facturas` - Invoice creation (simplified)
- `/simple/configuracion` - Simple settings (HKA + Signature)

**Navigation:** Simplified navbar with only essential features

---

### 5. API_USER (API-Only User)

**Purpose:** Machine-to-machine API access

**Features:**
- ✅ Programmatic access to invoicing APIs
- ❌ No UI access
- ❌ No dashboard access

---

## Access Control Implementation

### Security Pattern

All protected endpoints follow this pattern:

```typescript
// 1. Authenticate user
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
}

// 2. Check authorization
if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ORG_ADMIN") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
}

// 3. For ORG_ADMIN, enforce organization isolation
if (session.user.role === "ORG_ADMIN") {
  if (requestedOrgId !== session.user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
}

// 4. Proceed with operation
```

### Frontend Protection

1. **Navigation Guards:** Components check `user.role` before rendering
2. **Conditional Rendering:** Admin-only features hidden from regular users
3. **Redirect on Access:** Non-admin users redirected from `/dashboard/admin`
4. **Plan-based Routing:** SIMPLE_USER automatically routed to `/simple` instead of `/dashboard`

---

## Common Workflows

### Workflow 1: New Organization Onboarding

```
SUPER_ADMIN:
1. Create Organization (POST /api/admin/organizations)
2. Create Users (POST /api/admin/users/create)
   - At least 1 ORG_ADMIN user
   - Regular USER users
3. Test credentials

ORG_ADMIN (assigned to organization):
1. Edit Organization settings (PUT /api/configuration/organization)
2. Configure invoicing (PUT /api/configuration/invoice-settings)
3. Upload digital certificates (POST /api/certificates with scope=organization)
4. Configure HKA connection (POST /api/configuration/test-hka-connection)
5. Manage organization users (PUT/DELETE /api/configuration/users/*)

USERS:
1. Login to dashboard
2. Create invoices
3. Send documents
```

### Workflow 2: Folio Synchronization

```
SUPER_ADMIN:
1. Go to /dashboard/admin/folios
2. Click "Sincronizar desde HKA"
3. Selects organization
4. Folios are synced from HKA
5. All users of organization see same folios

ALL USERS (of organization):
1. Go to /dashboard/folios
2. See available folios (read-only)
3. Folios automatically consumed when invoices created
```

### Workflow 3: User Invites

```
ORG_ADMIN (or SUPER_ADMIN):
1. Go to /dashboard/configuracion → Usuarios
2. Click "Agregar Usuario"
3. Enter email, name, role (USER or ORG_ADMIN)
4. User receives invite email
5. User accepts and sets password

NEW USER:
1. Clicks invite link
2. Sets password
3. Logs in to dashboard
4. Can immediately start creating invoices
```

---

## Security Fixes Applied (2025-11-17)

### Critical Fix: Invalid Role Check

**Issue:** 5 endpoints were checking for non-existent "ADMIN" role:
```typescript
// BEFORE (Vulnerable):
if (role !== "SUPER_ADMIN" && role !== "ADMIN") { // ADMIN doesn't exist!
  // This check always passed for any user except SUPER_ADMIN
}
```

**Fix Applied:**
```typescript
// AFTER (Secure):
if (role !== "SUPER_ADMIN" && role !== "ORG_ADMIN") {
  // Now properly restricts to SUPER_ADMIN and ORG_ADMIN
}
```

**Affected Endpoints:** 5
- PUT /api/configuration/organization
- PUT /api/configuration/invoice-settings
- PUT /api/configuration/integration
- PUT /api/configuration/security
- POST /api/configuration/test-hka-connection

**Commit:** 033f098

---

## Testing Checklist

### SUPER_ADMIN Testing
- [ ] Can access /dashboard/admin
- [ ] Can create new users
- [ ] Can create new organizations
- [ ] Can manage all configurations
- [ ] Can synchronize folios
- [ ] Can view all invoices

### ORG_ADMIN Testing
- [ ] Cannot access /dashboard/admin (redirected)
- [ ] Can edit own organization settings
- [ ] Can only manage own organization users
- [ ] Cannot access other organizations' data
- [ ] Can upload certificates for organization
- [ ] Can see all invoices in organization

### USER Testing
- [ ] Cannot access /dashboard/configuracion (except Profile)
- [ ] Cannot edit organization settings
- [ ] Cannot manage users
- [ ] Can create and view own invoices
- [ ] Can see organization folios (read-only)
- [ ] Can manage personal certificates

### SIMPLE_USER Testing
- [ ] Automatically routed to /simple (not /dashboard)
- [ ] Cannot access advanced features
- [ ] Can configure HKA credentials
- [ ] Can create invoices

---

## Migration Guide

If you're upgrading from an older version:

1. **Update role checks:** Replace "ADMIN" with "ORG_ADMIN" everywhere
2. **Test user workflows:** Verify each role has appropriate access
3. **Update custom code:** Any custom role checks must use valid role names
4. **Review API integrations:** Ensure external integrations use correct roles

---

## Environment Variables (None Required)

Access control is entirely database-driven via user `role` field in `users` table.

---

## References

**Files:**
- `/app/api/admin/*` - Admin endpoints (SUPER_ADMIN only)
- `/app/api/configuration/*` - Configuration endpoints (SUPER_ADMIN + ORG_ADMIN)
- `/app/api/invoices/*` - Invoice endpoints (all roles)
- `/app/dashboard/admin/*` - Admin pages (SUPER_ADMIN only)
- `/app/dashboard/configuracion/*` - Settings pages (ORG_ADMIN + USER)
- `/components/configuration/configuration-tabs.tsx` - Role-based tabs
- `/components/dashboard/sidebar.tsx` - Role-based navigation

**Related Docs:**
- [ARCHITECTURE-REFACTORING.md](./ARCHITECTURE-REFACTORING.md) - System redesign overview
- [CERTIFICATE-MANAGEMENT.md](./CERTIFICATE-MANAGEMENT.md) - Digital signature setup
- [HKA-CREDENTIALS-TROUBLESHOOTING.md](./HKA-CREDENTIALS-TROUBLESHOOTING.md) - HKA integration

---

**Last Updated:** 2025-11-17
**Version:** 2.0
**Status:** Production-Ready ✅

Key Improvements (v2.0):
- Fixed 5 critical access control vulnerabilities
- Clarified role hierarchy
- Standardized access patterns
- Added comprehensive testing checklist
