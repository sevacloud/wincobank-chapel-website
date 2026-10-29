'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const REPORTS = [
  { href: '/trustees', label: 'Overview' },
  { href: '/trustees/monthly', label: 'Monthly Summary' },
  { href: '/trustees/projects', label: 'Projects' },
  { href: '/trustees/utilities', label: 'Utilities' },
  { href: '/trustees/annual-statement', label: 'Annual Statement' },
  { href: '/trustees/year-comparison', label: '3-Year Comparison' },
];

// Also active on sub-pages, e.g. /trustees/expenses/new.
const RECORDS = [
  { href: '/trustees/expenses', label: 'View Expenses', prefix: true },
  { href: '/trustees/invoices', label: 'View Invoices', prefix: true },
];

type NavItem = { href: string; label: string; prefix?: boolean };

function NavGroup({ title, items, query }: { title: string; items: NavItem[]; query: string }) {
  const pathname = usePathname();
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {items.map((item) => {
          const active = pathname === item.href || (item.prefix && pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href + query}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? 'bg-chapel-400 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PortalNav() {
  const fy = useSearchParams().get('fy');
  const query = fy ? `?fy=${encodeURIComponent(fy)}` : '';
  return (
    <nav aria-label="Trustee portal">
      <NavGroup title="Reports" items={REPORTS} query={query} />
      <NavGroup title="Expenses & Invoices" items={RECORDS} query={query} />
      <NavGroup
        title="Admin"
        items={[
          { href: '/trustees/admin', label: 'Manage Trustees' },
          { href: '/trustees/account', label: 'Change Password' },
        ]}
        query=""
      />
    </nav>
  );
}
