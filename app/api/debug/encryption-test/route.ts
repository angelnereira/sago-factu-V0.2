import { NextResponse } from 'next/server';
import { encryptToken, decryptToken } from '@/lib/utils/encryption';

export async function GET() {
  try {
    console.log('[DEBUG] Testing encryption...');

    const testString = 'test_password_123';
    console.log('[DEBUG] Original:', testString);

    const encrypted = encryptToken(testString);
    console.log('[DEBUG] Encrypted successfully');
    console.log('[DEBUG] Encrypted length:', encrypted.length);

    const decrypted = decryptToken(encrypted);
    console.log('[DEBUG] Decrypted successfully:', decrypted);

    const isMatch = decrypted === testString;
    console.log('[DEBUG] Match:', isMatch);

    return NextResponse.json({
      success: true,
      original: testString,
      encrypted: encrypted.substring(0, 50) + '...',
      decrypted,
      match: isMatch,
      message: 'Encryption test passed',
    });
  } catch (error) {
    console.error('[DEBUG] Encryption test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
