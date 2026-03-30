import { NextResponse } from 'next/server';

export async function GET() {
  // This is a proxy to the Supabase Storage asset to ensure public visibility
  // and bypass any referer/cors issues in email clients
  const imageUrl = "https://hueirgbgitrhqoopfxcu.supabase.co/storage/v1/object/public/assets/welcome_header_v2.jpg";
  
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying welcome header:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
