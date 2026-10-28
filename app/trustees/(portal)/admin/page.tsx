/**
 * Trustee Portal — Manage Trustees
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/admin
 *
 * Add trustees, issue temporary passwords and revoke access — no need to
 * open the Supabase dashboard.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { listTrustees, type TrusteeRecord } from '@/lib/trustees/admin';
import { formatDate } from '@/lib/quickfile/format';
import { Card, ErrorBox, PageHeading, errorMessage } from '../../components/ui';
import { tableClass, tdClass, thClass } from '../../components/styles';
import AddTrusteeForm from '../../components/admin/AddTrusteeForm';
import TrusteeRowActions from '../../components/admin/TrusteeRowActions';

export const metadata = { title: 'Manage Trustees' };

export default async function ManageTrusteesPage() {
  const me = await requireTrustee();

  let trustees: TrusteeRecord[];
  try {
    trustees = await listTrustees();
  } catch (e) {
    return (<><PageHeading title="Manage Trustees" /><ErrorBox message={errorMessage(e)} /></>);
  }

  return (
    <>
      <PageHeading title="Manage Trustees">
        Everyone listed here can see the chapel&apos;s finances, submit expenses and invoices, and manage trustees.
      </PageHeading>

      <Card title="Add a trustee">
        <AddTrusteeForm />
      </Card>

      <Card title={`Trustees (${trustees.length})`}>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Added</th>
                <th className={thClass}>Last signed in</th>
                <th className={thClass}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {trustees.map((t) => (
                <tr key={t.id}>
                  <td className={`${tdClass} font-medium`}>
                    {t.name}
                    {t.id === me.id && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                  </td>
                  <td className={tdClass}>{t.email}</td>
                  <td className={`${tdClass} text-gray-600`}>
                    {t.addedAt ? formatDate(t.addedAt) : '—'}
                    {t.addedBy && <span className="block text-xs text-gray-500">by {t.addedBy}</span>}
                  </td>
                  <td className={`${tdClass} text-gray-600`}>
                    {t.lastSignIn ? formatDate(t.lastSignIn) : 'Never'}
                    {t.mustChangePassword && <span className="block text-xs text-amber-800">▲ Temporary password not yet changed</span>}
                  </td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>
                    {t.id !== me.id && <TrusteeRowActions id={t.id} name={t.name} canRemove={trustees.length > 1} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
