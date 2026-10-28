'use client';

import { useState } from 'react';
import type { AdminState } from '../../admin-actions';
import { secondaryButtonClass } from '../styles';

/** One-time display of a new trustee's sign-in details. */
export default function CredentialsNotice({ credentials }: { credentials: NonNullable<AdminState['credentials']> }) {
  const [copied, setCopied] = useState(false);
  const { name, email, temporaryPassword } = credentials;

  if (!temporaryPassword) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">
        {name} ({email}) already had an account and is now a trustee. They can sign in with their existing password.
      </div>
    );
  }

  // Guarded: without JavaScript the action result is rendered on the server.
  const loginUrl = `${typeof window === 'undefined' ? '' : window.location.origin}/trustees/login`;
  const message = `You've been given access to the Wincobank Chapel trustee portal.\n\nSign in at: ${loginUrl}\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nYou'll be asked to choose your own password when you first sign in.`;

  return (
    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900" role="status">
      <p className="font-semibold">Sign-in details for {name}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt>Email</dt><dd className="font-mono">{email}</dd>
        <dt>Temporary password</dt><dd className="font-mono select-all">{temporaryPassword}</dd>
      </dl>
      <p className="mt-3 text-green-800">
        This password is shown <strong>only once</strong>. Pass it on privately (in person, by phone or a direct message). They&apos;ll choose their own password at first sign-in.
      </p>
      <button
        type="button"
        className={`${secondaryButtonClass} mt-3 bg-white`}
        onClick={() => navigator.clipboard.writeText(message).then(() => setCopied(true))}
      >
        {copied ? '✓ Copied' : 'Copy message with sign-in details'}
      </button>
    </div>
  );
}
