'use client';

import { useActionState } from 'react';
import { changePassword, type FormState } from '../../actions';
import { inputClass, labelClass, primaryButtonClass } from '../styles';

export default function ChangePasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});

  return (
    <form action={action} className="space-y-4">
      {/* Lets password managers associate the new password with this account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div>
        <label htmlFor="current" className={labelClass}>Current password</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>New password <span className="font-normal text-gray-500">(at least 12 characters)</span></label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
      </div>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700" role="status">{state.success}</p>}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
