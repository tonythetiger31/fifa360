'use client';

import { useEffect, useState } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const handleKeyMoment = (e: Event) => {
      const event = (e as CustomEvent).detail;
      if (permission !== 'granted') return;
      new Notification(`⚽ ${event.type === 'goal' ? 'GOAL!' : event.type.replace('_', ' ').toUpperCase()}`, {
        body: event.description,
        icon: '/icon-192.png',
      });
    };

    const handleRsvpConfirmed = (e: Event) => {
      const rsvp = (e as CustomEvent).detail;
      if (permission !== 'granted') return;
      new Notification('✅ RSVP Confirmed!', {
        body: `Table booked! Party of ${rsvp.partySize} · ${rsvp.arrivalTime}`,
        icon: '/icon-192.png',
      });
    };

    window.addEventListener('key-moment', handleKeyMoment);
    window.addEventListener('rsvp-confirmed', handleRsvpConfirmed);

    return () => {
      window.removeEventListener('key-moment', handleKeyMoment);
      window.removeEventListener('rsvp-confirmed', handleRsvpConfirmed);
    };
  }, [permission]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'denied' as NotificationPermission;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  };

  return { permission, requestPermission };
}
