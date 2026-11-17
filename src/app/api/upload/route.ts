import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/cloudflare/r2';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as 'hotels' | 'rooms' | 'receipts') || 'hotels';

    if (!file) {
      return NextResponse.json({ error: 'هیچ فایلی ارسال نشده است' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Direct Upload to Cloudflare R2 dedicated tehranroom-hotels bucket!
    const { url, key } = await uploadToR2(
      buffer,
      file.name,
      folder,
      file.type || 'image/jpeg'
    );

    return NextResponse.json({
      success: true,
      url,
      key,
    });
  } catch (err: any) {
    console.error('Cloudflare R2 Upload handler error:', err);
    return NextResponse.json({ error: err.message || 'خطا در آپلود به کلودفلر' }, { status: 500 });
  }
}
