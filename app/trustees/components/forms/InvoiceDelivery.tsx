'use client';

import { useRef, useState, useTransition } from 'react';
import { emailInvoiceAction, loadInvoiceContactsAction, type InvoiceContactsState } from '../../submit-actions';
import { cardTitleClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../styles';

export const invoicePdfUrl = (id: number, download = false) =>
  `/api/trustees/invoices/${id}/pdf${download ? '?download=1' : ''}`;

/** The invoice PDF as QuickFile renders it. */
export function InvoicePdf({ id, number }: { id: number; number: string }) {
  return (
    <section className="mt-6" aria-labelledby="invoice-pdf-title">
      <div className={`${cardTitleClass} flex flex-wrap items-baseline justify-between gap-3`}>
        <h3 id="invoice-pdf-title">Invoice PDF</h3>
        <a href={invoicePdfUrl(id, true)} className={`${secondaryButtonClass} font-normal`}>Download PDF</a>
      </div>
      <iframe src={invoicePdfUrl(id)} title={`Invoice ${number} PDF`} className="w-full h-[56rem] rounded-md border border-gray-200" />
    </section>
  );
}

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <input type="checkbox" checked={done} readOnly tabIndex={-1} aria-hidden className="mt-1 h-4 w-4 accent-chapel-500" />
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {n}. {title}<span className="sr-only">{done ? ' (done)' : ' (to do)'}</span>
        </p>
        <div className="mt-1 text-sm text-gray-700 space-y-2">{children}</div>
      </div>
    </li>
  );
}

/**
 * "Send to client" workflow: download the PDF, email it via QuickFile, and
 * — as a result of emailing — QuickFile marks it as sent. The API has no
 * other way to mark an invoice as sent.
 */
export function SendInvoiceButton({ id, number }: { id: number; number: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [details, setDetails] = useState<InvoiceContactsState | null>(null);
  const [contactId, setContactId] = useState(0);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [sending, startSending] = useTransition();

  function open() {
    dialog.current?.showModal();
    if (details && !('error' in details)) return;
    startLoading(async () => {
      const d = await loadInvoiceContactsAction(id);
      setDetails(d);
      if (!('error' in d)) {
        const withEmail = d.contacts.filter((c) => c.email);
        setContactId((withEmail.find((c) => c.isDefault) ?? withEmail[0])?.id ?? 0);
      }
    });
  }

  function send() {
    setError(null);
    startSending(async () => {
      const r = await emailInvoiceAction(id, contactId);
      if ('error' in r) setError(r.error);
      else setSentTo(r.sentTo);
    });
  }

  const ready = details && !('error' in details) ? details : null;
  const alreadySent = ready?.status.toLowerCase() === 'sent';
  const emailable = ready?.contacts.filter((c) => c.email) ?? [];

  return (
    <>
      <button type="button" onClick={open} className={`${secondaryButtonClass} bg-white`}>
        Send to client…
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="send-invoice-title"
        className="m-auto w-full max-w-lg rounded-lg p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="p-6">
          <h2 id="send-invoice-title" className="text-lg font-semibold text-gray-900">Send invoice {number} to the client</h2>
          {ready?.clientName && <p className="text-sm text-gray-600 mt-1">{ready.clientName}</p>}

          <ol className="mt-5 space-y-5">
            <Step n={1} done={downloaded} title="Download the invoice">
              <p>Keep a copy, or send it yourself if the client prefers.</p>
              <a href={invoicePdfUrl(id, true)} onClick={() => setDownloaded(true)} className={`${secondaryButtonClass} inline-block`}>
                Download PDF
              </a>
            </Step>

            <Step n={2} done={!!sentTo} title="Email to client">
              {loading && <p className="text-gray-500">Loading the client&apos;s contacts…</p>}
              {details && 'error' in details && <p className="text-red-700" role="alert">{details.error}</p>}
              {sentTo ? (
                <p className="text-green-800" role="status">✓ Emailed to {sentTo} by QuickFile.</p>
              ) : ready && emailable.length === 0 ? (
                <p>None of this client&apos;s contacts has an email address. Ask the treasurer to add one in QuickFile, or send the PDF yourself.</p>
              ) : ready && (
                <>
                  {alreadySent && <p className="text-amber-800">QuickFile shows this invoice as already sent — emailing again sends another copy.</p>}
                  <div>
                    <label htmlFor="send-contact" className={labelClass}>Send to</label>
                    <select id="send-contact" value={contactId} onChange={(e) => setContactId(Number(e.target.value))} className={inputClass}>
                      {emailable.map((c) => (
                        <option key={c.id} value={c.id}>{c.name ? `${c.name} <${c.email}>` : c.email}</option>
                      ))}
                    </select>
                  </div>
                  {error && <p className="text-red-700" role="alert">{error}</p>}
                  <button type="button" onClick={send} disabled={sending || !contactId} className={primaryButtonClass}>
                    {sending ? 'Sending…' : 'Email invoice via QuickFile'}
                  </button>
                </>
              )}
            </Step>

            <Step n={3} done={!!sentTo || alreadySent} title="Mark invoice as sent">
              <p>
                {sentTo || alreadySent
                  ? 'QuickFile has marked the invoice as sent.'
                  : 'QuickFile marks the invoice as sent when it is emailed above. If you deliver it yourself instead, ask the treasurer to mark it as sent.'}
              </p>
            </Step>
          </ol>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => dialog.current?.close()} className={secondaryButtonClass}>Close</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
