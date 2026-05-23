import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { subscription, departureTime, venueName, matchName } = await req.json();

  if (!subscription || !departureTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const now = Date.now();
  const depart = new Date(departureTime).getTime();
  const delayMs = depart - now;

  if (delayMs > 0) {
    setTimeout(async () => {
      try {
        const webpush = await import('web-push');
        const vapidKeys = {
          publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
          privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
        };

        if (vapidKeys.publicKey && vapidKeys.privateKey) {
          webpush.default.setVapidDetails(
            `mailto:${process.env.VAPID_EMAIL ?? 'demo@fifa360.app'}`,
            vapidKeys.publicKey,
            vapidKeys.privateKey
          );

          const payload = JSON.stringify({
            title: `Time to leave for ${venueName}!`,
            body: `${matchName} kicks off soon. Head out now!`,
            url: '/route',
          });

          await webpush.default.sendNotification(subscription, payload);
        }
      } catch {
        // Notification failed silently in demo
      }
    }, delayMs);
  }

  return NextResponse.json({ scheduled: true, delayMs: Math.max(0, delayMs) });
}
