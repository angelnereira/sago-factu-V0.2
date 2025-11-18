import { NextResponse } from "next/server"

/**
 * DEPRECATED: POST /api/folios/purchase
 *
 * This endpoint has been deprecated. Folios are now managed exclusively through
 * HKA synchronization (POST /api/folios/sincronizar).
 *
 * Users no longer purchase folios individually. Instead:
 * 1. Admin synchronizes folios from HKA via POST /api/folios/sincronizar
 * 2. All users see the same organization-level folio availability
 * 3. Folios are tracked through GET /api/folios/available
 *
 * Migration:
 * - Replace folio purchase calls with sync call
 * - Remove FolioPurchaseModal and FolioPurchaseButton from UI
 * - Use FolioSyncButton for admin to synchronize with HKA
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Folio purchase endpoint has been deprecated",
      message: "Folios are now managed exclusively through HKA synchronization",
      details: {
        deprecatedSince: "2025-11-17",
        alternative: "POST /api/folios/sincronizar",
        migrationGuide: "/docs/guides/FOLIO-SYNC-GUIDE.md",
      },
    },
    { status: 410 } // 410 Gone
  )
}
