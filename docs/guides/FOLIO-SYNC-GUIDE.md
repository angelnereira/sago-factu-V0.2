# 📋 Folio Synchronization Guide

## Overview

As of 2025-11-17, the SAGO-FACTU folio system has been redesigned to synchronize exclusively with The Factory HKA API. Users no longer purchase folios individually through the system.

**Key Change:**
```
BEFORE:  Users → Buy folios in UI → Creates local FolioPool
AFTER:   Admin → Sync with HKA → Fetches real folios → All users see same folios
```

---

## Architecture Overview

### Previous Architecture (Deprecated ❌)

```
User requests folios
        ↓
POST /api/folios/purchase (❌ DEPRECATED)
        ↓
Creates FolioPool locally ← Fake purchase
        ↓
FolioAssignment created ← Only visible to that user
```

**Problems:**
- Users could "purchase" infinite folios
- No connection to actual HKA folios
- Folios were isolated per user
- No audit trail of real transactions

### New Architecture (Active ✅)

```
Admin clicks "Sincronizar desde HKA"
        ↓
POST /api/folios/sincronizar
        ↓
Calls consultarFolios() → SOAP call to HKA
        ↓
HKA returns actual available folios
        ↓
Updates FolioAssignment (organization-level)
        ↓
ALL users see same available folios ✅
        ↓
GET /api/folios/available (read-only for users)
```

**Benefits:**
- ✅ Real folios from HKA (single source of truth)
- ✅ All users see same folios
- ✅ Automatic consumption tracking
- ✅ Better auditing
- ✅ Prevents folio overselling

---

## Folio Lifecycle

### State 1: Available (DISPONIBLE)

```
┌─────────────────────────────────────────┐
│  Folios in HKA marked DISPONIBLE        │
│  Example: 00001, 00002, 00003 ... 10000│
└─────────────────────────────────────────┘
         ↓ (Sync from HKA)
┌─────────────────────────────────────────┐
│  FolioAssignment.totalAvailable = 10000 │
│  FolioAssignment.totalConsumed = 0      │
│  displayedAvailable = 10000 - 0 = 10000│
└─────────────────────────────────────────┘
         ↓ (User creates invoice)
```

### State 2: Assigned/Consumed (UTILIZADO)

```
┌─────────────────────────────────────────┐
│  User creates invoice with folio 00001  │
│  System records consumption             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  FolioAssignment.totalConsumed = 1      │
│  displayedAvailable = 10000 - 1 = 9999 │
│  HKA now sees folio 00001 as UTILIZADO │
└─────────────────────────────────────────┘
```

### State 3: Exhausted / Resync Needed

```
When available folios run low:
1. Admin gets warning (e.g., < 100 folios left)
2. Admin synchronizes with HKA again
3. New folio batches may appear in HKA
4. FolioAssignment updated with new total
```

---

## API Endpoints

### POST /api/folios/sincronizar (Admin Only)

**Purpose:** Synchronize folios from HKA to local database

**Request:**
```bash
curl -X POST http://localhost:3000/api/folios/sincronizar \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "org_123"}'
```

**Request Body:**
```json
{
  "organizationId": "required-uuid"  // Organization to sync for
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✅ Folios sincronizados correctamente",
  "empresa": {
    "id": "org_123",
    "nombre": "Mi Empresa S.A.",
    "ruc": "155738031"
  },
  "timestamp": "2025-11-17T10:30:00Z"
}
```

**Response (Error - Missing Credentials):**
```json
{
  "success": false,
  "error": "Error al sincronizar folios",
  "details": "Las credenciales de HKA no están configuradas para esta organización",
  "code": "CREDENTIALS_NOT_CONFIGURED"
}
```

**Status Codes:**
- 200: Folios synced successfully
- 400: Invalid organizationId or missing required fields
- 401: Not authenticated
- 403: Not authorized (must be SUPER_ADMIN or ORG_ADMIN)
- 500: Server error

**Requirements:**
- ✅ User must be SUPER_ADMIN or ORG_ADMIN
- ✅ Organization must have HKA credentials configured
- ✅ HKA SOAP service must be available
- ✅ RUC and DV must be configured

---

### GET /api/folios/available (All Users)

**Purpose:** Get available folios for current user's organization

**Request:**
```bash
curl http://localhost:3000/api/folios/available
```

**Response:**
```json
{
  "success": true,
  "data": {
    "folios": [
      {
        "id": "assignment_456",
        "poolRange": "00001-10000",
        "assignedAmount": 10000,
        "consumedAmount": 127,
        "available": 9873
      },
      {
        "id": "assignment_789",
        "poolRange": "10001-20000",
        "assignedAmount": 10000,
        "consumedAmount": 0,
        "available": 10000
      }
    ],
    "total": 19873  // Total available across all pools
  }
}
```

**Status Codes:**
- 200: Success
- 400: User without organization
- 401: Not authenticated
- 500: Server error

**Available to:** All authenticated users

---

### ❌ POST /api/folios/purchase (DEPRECATED)

**Status:** 410 Gone - No longer available

**Response:**
```json
{
  "success": false,
  "error": "Folio purchase endpoint has been deprecated",
  "message": "Folios are now managed exclusively through HKA synchronization",
  "details": {
    "deprecatedSince": "2025-11-17",
    "alternative": "POST /api/folios/sincronizar",
    "migrationGuide": "/docs/guides/FOLIO-SYNC-GUIDE.md"
  }
}
```

**Status Code:** 410 Gone

---

## UI Components

### FolioSyncButton (Admin-only)

**Location:** `/dashboard/folios` page, header section

**Features:**
- Shows last sync timestamp
- "Sincronizar desde HKA" button
- Loading state during sync
- Success/error feedback

**Access:**
- Only visible to SUPER_ADMIN and ORG_ADMIN
- Regular users see read-only stats instead

**Example Usage:**
```tsx
<FolioSyncButton organizationId={organizationId} />
```

### FolioList (All Users)

**Location:** `/dashboard/folios` page, main content

**Features:**
- Displays folio pools and availability
- Shows consumption percentage
- Read-only view for regular users

**Access:** All authenticated users

### FolioStats (All Users)

**Location:** `/dashboard/folios` page, top section

**Features:**
- Total folios
- Available folios
- Used folios
- Warning when running low

**Access:** All authenticated users

### FolioPurchaseButton ❌ (REMOVED)

**Removed:** 2025-11-17
**Alternative:** Use FolioSyncButton for admin sync functionality

---

## Step-by-Step: Admin Workflow

### 1. Configure HKA Credentials

```
Path: /dashboard/configuracion → HKA Credentials

Steps:
1. Go to Settings
2. Click HKA Credentials tab
3. Enter:
   - Token Usuario (from HKA)
   - Token Contraseña (from HKA)
   - Select Environment (Demo/Prod)
4. Click "Guardar Credenciales"
5. Click "Probar Conexión" to verify
```

### 2. Synchronize Folios (First Time)

```
Path: /dashboard/folios

Steps:
1. Click "Sincronizar desde HKA" button
2. Wait for sync to complete
3. See folios appear in FolioStats
4. See folio pools listed in FolioList
5. Green "Última sincronización" timestamp appears
```

### 3. Monitor Folio Usage

```
On /dashboard/folios:
1. Watch FolioStats for available count
2. Set alerts (optional) for when < 100 left
3. When running low, sync again to get new batches
```

### 4. Resync When Needed

```
When available folios run low:
1. Contact HKA to purchase more folios
2. Return to /dashboard/folios
3. Click "Sincronizar desde HKA"
4. New folio pools will appear
```

---

## User Workflow (Regular User)

### Before Upgrade (Deprecated)

```
User:
1. Go to /dashboard/folios
2. Click "Comprar Folios" button ← NO LONGER EXISTS
3. Enter quantity
4. Complete "purchase"
5. Folios appear for that user only
```

**Problems:**
- Confusing (not real purchase)
- Only visible to that user
- No connection to HKA

### After Upgrade (New)

```
User:
1. Go to /dashboard/folios
2. See folio availability in FolioStats
3. Create invoice
4. System automatically consumes folio
5. FolioStats updates in real-time
6. All users see same folios
```

**Benefits:**
- ✅ No user action needed
- ✅ Automatic consumption
- ✅ Shared across all users
- ✅ Real folios from HKA

---

## Troubleshooting

### Problem: "Folios no sincronizados"

**Possible Causes:**
1. HKA credentials not configured
2. HKA service unreachable
3. Invalid RUC/DV in organization

**Solution:**
```
1. Check /dashboard/configuracion → HKA Credentials
2. Verify credentials are saved
3. Click "Probar Conexión"
4. If error, see HKA-CREDENTIALS-TROUBLESHOOTING.md
5. Verify organization RUC matches HKA
6. Try sync again
```

### Problem: "Deprecated endpoint" error

**Cause:** Old code trying to call POST /api/folios/purchase

**Solution:**
```typescript
// BEFORE (broken):
const response = await fetch('/api/folios/purchase', {
  method: 'POST',
  body: JSON.stringify({ quantity: 100 })
})

// AFTER (correct):
const response = await fetch('/api/folios/sincronizar', {
  method: 'POST',
  body: JSON.stringify({ organizationId: session.user.organizationId })
})
```

### Problem: "Usuario sin organización asignada"

**Cause:** User doesn't have organizationId in their account

**Solution:**
```
1. SUPER_ADMIN checks if user has organization assigned
2. If not, edit user and assign organization
3. User logs out and back in
4. Try sync again
```

### Problem: Folios not updating

**Possible Causes:**
1. Sync hasn't been run yet
2. HKA hasn't issued new folios
3. Cache issue

**Solution:**
```
1. Click "Sincronizar desde HKA" again (force sync)
2. Check timestamp updated in FolioStats
3. Wait 2-3 minutes for cache to clear
4. Refresh page (Ctrl+R)
```

---

## Database Schema

### FolioAssignment (Organization-level)

```sql
CREATE TABLE folio_assignments (
  id UUID PRIMARY KEY,
  folio_pool_id UUID NOT NULL,      -- Links to FolioPool
  organization_id UUID NOT NULL,     -- Organization these folios belong to
  assigned_amount INT,               -- Total folios assigned
  consumed_amount INT DEFAULT 0,     -- Folios already used
  alert_threshold INT DEFAULT 20,    -- Alert when < this %
  alert_sent BOOLEAN DEFAULT false,  -- Has alert been sent?
  synced_at TIMESTAMP,               -- Last sync time

  UNIQUE(organization_id)            -- One sync per organization
);
```

### FolioPool

```sql
CREATE TABLE folio_pools (
  id UUID PRIMARY KEY,
  batch_number STRING UNIQUE,
  total_folios INT,
  available_folios INT,
  folio_start STRING,                -- E.g., "00001"
  folio_end STRING,                  -- E.g., "10000"
  provider STRING DEFAULT "HKA",     -- Source (always HKA now)
  purchase_date TIMESTAMP,           -- When purchased from HKA
  purchase_amount DECIMAL,           -- Cost
  hka_invoice_number STRING          -- HKA invoice reference
);
```

### FolioConsumption

```sql
CREATE TABLE folio_consumptions (
  id UUID PRIMARY KEY,
  assignment_id UUID,
  invoice_id UUID UNIQUE,            -- Which invoice used this folio
  consumed_at TIMESTAMP,
  folio_number STRING                -- The actual folio (e.g., "00001")
);
```

---

## Migration from Old System

If upgrading from old folio system:

### Step 1: Backup
```bash
# Backup existing folio data
pg_dump sago_db > folio_backup.sql
```

### Step 2: Consolidate Data
```sql
-- Consolidate multiple FolioAssignments per org into one
-- Keep most recent sync, sum the consumed amounts
SELECT
  organization_id,
  SUM(consumed_amount) as total_consumed,
  SUM(assigned_amount) as total_assigned,
  MAX(synced_at) as last_sync
FROM folio_assignments
GROUP BY organization_id;
```

### Step 3: Run Migration

Migration TBD (depends on specific old data state)

### Step 4: Sync All Organizations

```bash
# For each organization, run full sync
POST /api/folios/sincronizar
{
  "organizationId": "org_123"
}
```

---

## References

**Related Documentation:**
- [ARCHITECTURE-REFACTORING.md](./ARCHITECTURE-REFACTORING.md) - System redesign details
- [HKA-CREDENTIALS-TROUBLESHOOTING.md](./HKA-CREDENTIALS-TROUBLESHOOTING.md) - HKA connection issues
- [ROLE-BASED-ACCESS-CONTROL.md](./ROLE-BASED-ACCESS-CONTROL.md) - Who can do what

**Code References:**
- `/app/api/folios/sincronizar/route.ts` - Sync endpoint
- `/app/api/folios/available/route.ts` - Query folios
- `/app/api/folios/purchase/route.ts` - Deprecated endpoint
- `/lib/hka/methods/consultar-folios.ts` - HKA integration
- `/components/folios/folio-sync-button.tsx` - Sync UI component
- `/components/folios/folio-list.tsx` - Folio display component
- `/components/folios/folio-stats.tsx` - Folio statistics

**Commits:**
- 031ab53 - Remove folio purchase endpoint
- 87fc6a7 - Add architecture refactoring plan
- a18ca17 - Synchronize certificate deletion

---

**Last Updated:** 2025-11-17
**Version:** 2.0
**Status:** Production-Ready ✅

**Major Changes (v2.0):**
- ✅ Removed folio purchase functionality
- ✅ Enabled HKA synchronization
- ✅ Standardized folio access (organization-level, not user-level)
- ✅ Automatic consumption tracking
- ✅ Real-time folio status
