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

const SUBMIT = [
  { href: '/trustees/expenses/new', label: 'Submit an Expense' },
  { href: '/trustees/invoices/new', label: 'Raise an Invoice' },
];

function NavGroup({ title, items, query }: { title: string; items: typeof REPORTS; query: string }) {
  const pathname = usePathname();
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {items.map((item) => {
          const active = pathname === item.href;
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
      <NavGroup title="Submit" items={SUBMIT} query="" />
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
