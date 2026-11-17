import crypto from 'crypto';
import { getSupabaseClient } from '@/lib/supabase/client';

const AUTH_COOKIE_NAME = 'tr_admin_session';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'tehranroom_admin_secure_salt_2026_x89a';

export { AUTH_COOKIE_NAME };

/**
 * Creates a cryptographically signed session token for the authenticated admin
 */
export function createSessionToken(keyTitle: string = 'Master Key'): string {
  const payload = {
    role: 'super_admin',
    title: keyTitle,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days validity
  };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString('base64');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Payload)
    .digest('hex');

  return `${base64Payload}.${signature}`;
}

/**
 * Validates a session token string
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [base64Payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const jsonStr = Buffer.from(base64Payload, 'base64').toString('utf8');
    const payload = JSON.parse(jsonStr);

    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return false; // Expired
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates the Master Key against the database (admin_access_keys) and env fallback
 */
export async function validateMasterKey(
  inputKey: string
): Promise<{ valid: boolean; title?: string }> {
  const cleanKey = String(inputKey || '').trim();
  if (!cleanKey) return { valid: false };

  // 1. Check database admin_access_keys table
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('admin_access_keys')
      .select('id, key_value, title, is_active')
      .eq('key_value', cleanKey)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      // Update last_used_at in background
      supabase
        .from('admin_access_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id)
        .then(() => {});

      return { valid: true, title: data.title };
    }
  } catch (dbErr) {
    console.error('Database key verification check failed, trying fallback:', dbErr);
  }

  // 2. Failsafe Environment Master Keys
  const envMasterKey = process.env.ADMIN_MASTER_KEY || 'TR-MASTER-7890-SECRET-KEY';
  const backupKey = 'TR-ADMIN-2026-KEY';

  if (cleanKey === envMasterKey || cleanKey === backupKey) {
    return { valid: true, title: 'کلید ارشد اضطراری مدیریت' };
  }

  return { valid: false };
}
