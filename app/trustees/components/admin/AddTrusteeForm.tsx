'use client';

import { useActionState } from 'react';
import { addTrusteeAction, type AdminState } from '../../admin-actions';
import { inputClass, labelClass, primaryButtonClass } from '../styles';
import CredentialsNotice from './CredentialsNotice';

export default function AddTrusteeForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(addTrusteeAction, {});

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
        <div>
          <label htmlFor="trustee-name" className={labelClass}>Full name</label>
          <input id="trustee-name" name="name" required minLength={2} maxLength={100} autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="trustee-email" className={labelClass}>Email</label>
          <input id="trustee-email" name="email" type="email" required maxLength={120} autoComplete="off" className={inputClass} />
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? 'Adding…' : 'Add trustee'}
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      {state.credentials && <CredentialsNotice credentials={state.credentials} />}
    </div>
  );
}
