import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint was used for testing HKA token encryption.
 * Token encryption has been removed - tokens are now stored in plaintext.
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'HKA token encryption has been disabled. This endpoint is deprecated.',
    note: 'Tokens are now stored in plaintext in the database.',
  }, { status: 410 }); // 410 Gone
}
