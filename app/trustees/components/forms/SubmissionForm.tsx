'use client';

import { startTransition, useActionState, useState } from 'react';
import type { SubmitState } from '../../submit-actions';
import { formatGBP } from '@/lib/quickfile/format';
import { primaryButtonClass, secondaryButtonClass } from '../styles';
import EvidenceInput from './EvidenceInput';
import SubmittedRecord from './SubmittedRecord';
import EvidencePreview from './EvidencePreview';
import { InvoicePdf, SendInvoiceButton, invoicePdfUrl } from './InvoiceDelivery';

const STATUS_TEXT = {
  attached: 'attached in QuickFile',
  filed: 'saved to QuickFile Documents › Trustee Submissions',
  failed: 'NOT uploaded',
};

/**
 * Shared shell for the expense and invoice forms: submits via a server
 * action without React's automatic form reset (so a validation error keeps
 * everything the trustee typed), appends evidence files, and shows the
 * QuickFile outcome — the record, the invoice PDF and send workflow, and a
 * preview of the evidence.
 */
export default function SubmissionForm({ action, kind, submitLabel, children }: {
  action: (prev: SubmitState, fd: FormData) => Promise<SubmitState>;
  kind: 'Purchase' | 'Invoice';
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const [files, setFiles] = useState<File[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);

  if (state.result) {
    const r = state.result;
    const failed = r.files.filter((f) => f.status === 'failed');
    return (
      <>
        <div
          className="rounded-lg border border-green-200 bg-green-50 p-6 scroll-mt-24 focus:outline-none"
          role="status"
          tabIndex={-1}
          // The form is replaced in place while the page is scrolled to its submit
          // button, so bring the outcome into view (clear of the sticky header).
          ref={(el) => {
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el?.focus({ preventScroll: true });
          }}
        >
          <h2 className="text-lg font-semibold text-green-900">{kind} {r.number} created in QuickFile</h2>
          <p className="text-sm text-green-900 mt-1">{r.partyName} · {formatGBP(r.total)}</p>
          {r.files.length > 0 && (
            <ul className="mt-4 text-sm space-y-1">
              {r.files.map((f, i) => (
                <li key={i} className={f.status === 'failed' ? 'text-red-800' : 'text-gray-800'}>
                  {f.status === 'failed' ? '✕' : '✓'} {f.name} — {STATUS_TEXT[f.status]}{f.error ? ` (${f.error})` : ''}
                </li>
              ))}
            </ul>
          )}
          {failed.length > 0 && (
            <p className="mt-3 text-sm text-red-800">
              The {kind.toLowerCase()} was saved, so <strong>don&apos;t submit it again</strong>. Please email the files that failed to the treasurer, quoting {kind.toLowerCase()} {r.number}.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {r.viewUrl && (
              <a href={r.viewUrl} target="_blank" rel="noopener noreferrer" className={primaryButtonClass}>
                View in QuickFile
              </a>
            )}
            {kind === 'Invoice' && (
              <>
                <a href={invoicePdfUrl(r.id, true)} className={`${secondaryButtonClass} bg-white`}>Download PDF</a>
                <SendInvoiceButton id={r.id} number={r.number} />
              </>
            )}
            <button
              type="button"
              className={`${secondaryButtonClass} bg-white`}
              // A fresh load re-fetches suppliers/clients, which may now include a new one.
              onClick={() => window.location.reload()}
            >
              Submit another
            </button>
          </div>
        </div>
        {r.record && <SubmittedRecord kind={kind} number={r.number} partyName={r.partyName} record={r.record} />}
        {kind === 'Invoice' && <InvoicePdf id={r.id} number={r.number} />}
        <EvidencePreview files={files} />
      </>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setClientError(null);
        if (files.length === 0) {
          setClientError('Attach at least one receipt or supporting document.');
          return;
        }
        const fd = new FormData(e.currentTarget);
        fd.delete('files');
        files.forEach((f) => fd.append('files', f, f.name));
        startTransition(() => dispatch(fd));
      }}
    >
      {children}
      <EvidenceInput files={files} onChange={setFiles} label={kind === 'Purchase' ? 'Receipts & supporting evidence' : 'Supporting evidence'} />

      <p className="text-sm text-blue-900 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
        Not sure which category to use{kind === 'Purchase' ? ', or which account it should be paid from' : ''}? Please check with the treasurer before submitting.
      </p>

      {(clientError || state.error) && (
        <p className="text-sm text-red-700 rounded-md border border-red-200 bg-red-50 px-4 py-3" role="alert">{clientError ?? state.error}</p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={`${primaryButtonClass} px-6 py-3`}>
          {pending ? 'Sending to QuickFile…' : submitLabel}
        </button>
        {pending && <span className="text-sm text-gray-500">Please wait — don&apos;t close this page.</span>}
      </div>
    </form>
  );
}
