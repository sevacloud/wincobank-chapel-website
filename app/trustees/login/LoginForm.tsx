'use client';

import { useActionState } from 'react';
import { signIn, type FormState } from '../actions';
import { inputClass, labelClass, primaryButtonClass } from '../components/styles';

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full py-3`}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
