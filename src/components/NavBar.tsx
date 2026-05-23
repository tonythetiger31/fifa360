'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/',        label: 'Home',   icon: '🏠' },
  { href: '/venue',   label: 'Venues', icon: '🏟️' },
  { href: '/live',    label: 'Live',   icon: '⚽' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-gray-900 border-t border-gray-800 safe-bottom z-50">
      <div className="flex">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center pt-3 pb-2 text-xs transition-colors ${
                active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className={active ? 'font-semibold' : ''}>{tab.label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
