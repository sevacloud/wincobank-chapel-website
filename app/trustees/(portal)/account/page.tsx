/**
 * Trustee Portal — Change Password
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/account
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { PageHeading } from '../../components/ui';
import { cardClass } from '../../components/styles';
import ChangePasswordForm from '../../components/forms/ChangePasswordForm';

export const metadata = { title: 'Change Password' };

export default async function AccountPage() {
  const trustee = await requireTrustee({ allowTemporaryPassword: true });
  return (
    <>
      <PageHeading title="Change Password">Signed in as {trustee.email}</PageHeading>
      {trustee.mustChangePassword && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6 max-w-md" role="alert">
          You signed in with a temporary password. Please choose your own password to continue.
        </p>
      )}
      <div className={`${cardClass} max-w-md`}>
        <ChangePasswordForm email={trustee.email} />
      </div>
    </>
  );
}
