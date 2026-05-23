import { NextRequest, NextResponse } from 'next/server';
import { DEMO_PROFILE } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ profile: DEMO_PROFILE });
}

export async function POST(req: NextRequest) {
  const profile = await req.json();
  return NextResponse.json({ profile, saved: true });
}
