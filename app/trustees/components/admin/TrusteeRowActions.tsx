'use client';

import { useActionState, useRef } from 'react';
import { removeTrusteeAction, resetPasswordAction, type AdminState } from '../../admin-actions';
import { primaryButtonClass, secondaryButtonClass } from '../styles';
import CredentialsNotice from './CredentialsNotice';

/** Reset-password and remove buttons, each behind a confirmation dialog. */
export default function TrusteeRowActions({ id, name, canRemove }: { id: string; name: string; canRemove: boolean }) {
  const [resetState, resetAction, resetting] = useActionState<AdminState, FormData>(resetPasswordAction, {});
  const [removeState, removeAction, removing] = useActionState<AdminState, FormData>(removeTrusteeAction, {});
  const resetDialog = useRef<HTMLDialogElement>(null);
  const removeDialog = useRef<HTMLDialogElement>(null);
  const error = resetState.error ?? removeState.error;

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button type="button" className={secondaryButtonClass} onClick={() => resetDialog.current?.showModal()} disabled={resetting}>
          {resetting ? 'Resetting…' : 'Reset password'}
        </button>
        {canRemove && (
          <button type="button" className={`${secondaryButtonClass} text-red-700`} onClick={() => removeDialog.current?.showModal()} disabled={removing}>
            {removing ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>

      <dialog ref={resetDialog} className="rounded-lg p-6 max-w-sm backdrop:bg-black/30 text-left whitespace-normal">
        <h2 className="text-lg font-semibold text-gray-900">Reset {name}&apos;s password?</h2>
        <p className="text-sm text-gray-600 mt-2">Their current password stops working immediately and you&apos;ll be shown a new temporary password to give them.</p>
        <form action={resetAction} onSubmit={() => resetDialog.current?.close()} className="flex justify-end gap-2 mt-5">
          <input type="hidden" name="id" value={id} />
          <button type="button" className={secondaryButtonClass} onClick={() => resetDialog.current?.close()}>Cancel</button>
          <button type="submit" className={primaryButtonClass}>Reset password</button>
        </form>
      </dialog>

      <dialog ref={removeDialog} className="rounded-lg p-6 max-w-sm backdrop:bg-black/30 text-left whitespace-normal">
        <h2 className="text-lg font-semibold text-gray-900">Remove {name} as a trustee?</h2>
        <p className="text-sm text-gray-600 mt-2">They lose access to the portal straight away. Anything they submitted stays in QuickFile. You can add them again later.</p>
        <form action={removeAction} onSubmit={() => removeDialog.current?.close()} className="flex justify-end gap-2 mt-5">
          <input type="hidden" name="id" value={id} />
          <button type="button" className={secondaryButtonClass} onClick={() => removeDialog.current?.close()}>Cancel</button>
          <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-red-700">Remove access</button>
        </form>
      </dialog>

      {error && <p className="text-xs text-red-600 whitespace-normal" role="alert">{error}</p>}
      {resetState.credentials && <div className="whitespace-normal text-left w-80"><CredentialsNotice credentials={resetState.credentials} /></div>}
    </div>
  );
}
