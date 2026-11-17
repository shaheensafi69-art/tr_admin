import { NextRequest, NextResponse } from 'next/server';
import { validateMasterKey, createSessionToken } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessKey = typeof body.accessKey === 'string' ? body.accessKey.trim() : '';

    if (!accessKey) {
      return NextResponse.json(
        { success: false, message: 'لطفاً کلید امنیتی مدیریت را وارد نمایید.' },
        { status: 400 }
      );
    }

    // Validate key against PostgreSQL/Supabase public.admin_access_keys
    const keyInfo = await validateMasterKey(accessKey);

    if (!keyInfo || !keyInfo.valid) {
      // Artificial delay to deter brute-force attempts
      await new Promise((resolve) => setTimeout(resolve, 600));
      return NextResponse.json(
        {
          success: false,
          message: 'کلید امنیتی وارد شده معتبر نمی‌باشد یا غیرفعال گردیده است.',
        },
        { status: 401 }
      );
    }

    // Generate tamper-proof HMAC-SHA256 session token (7-day validity)
    const sessionToken = createSessionToken();

    const response = NextResponse.json({
      success: true,
      message: `ورود با موفقیت انجام شد (${keyInfo.title}).`,
      title: keyInfo.title,
    });

    // Set secure HttpOnly cookie
    response.cookies.set('tr_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سیستمی در اعتبارسنجی کلید امنیتی.' },
      { status: 500 }
    );
  }
}
