/**
 * Trustee Portal — Raise an Invoice
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/invoices/new
 *
 * Creates a sales invoice in QuickFile (e.g. room hire you've arranged),
 * creating the client first if needed, and attaches any supporting files.
 * The invoice is not emailed automatically — the treasurer sends it.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getFormOptions, type FormOptions } from '@/lib/quickfile/submissions';
import { ErrorBox, PageHeading, errorMessage } from '../../../components/ui';
import { cardClass, inputClass, labelClass } from '../../../components/styles';
import { submitInvoiceAction } from '../../../submit-actions';
import SubmissionForm from '../../../components/forms/SubmissionForm';
import PartyPicker from '../../../components/forms/PartyPicker';
import LineItems from '../../../components/forms/LineItems';

export const metadata = { title: 'Raise an Invoice' };

export default async function NewInvoicePage() {
  await requireTrustee();

  let options: FormOptions;
  try {
    options = await getFormOptions();
  } catch (e) {
    return (<><PageHeading title="Raise an Invoice" /><ErrorBox message={errorMessage(e)} /></>);
  }
  const today = new Date().toISOString().slice(0, 10);
  // 4000 is QuickFile's default sales code; preselect it when present.
  const defaultCode = options.salesCodes.some((c) => c.code === 4000) ? 4000 : undefined;

  return (
    <>
      <PageHeading title="Raise an Invoice">
        Bill a client for something you&apos;ve arranged (room hire, events, services). It goes straight into QuickFile; the treasurer sends it.
      </PageHeading>

      <div className={cardClass}>
        <SubmissionForm action={submitInvoiceAction} kind="Invoice" filesRequired={false} submitLabel="Create invoice">
          <PartyPicker label="client" contacts={options.clients} />

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-sm font-semibold text-gray-900 mb-2">Details</legend>
            <div className="sm:col-span-2">
              <label htmlFor="description" className={labelClass}>Short description * <span className="font-normal text-gray-500">(max 35 characters)</span></label>
              <input id="description" name="description" required minLength={2} maxLength={35} placeholder="e.g. Hall hire – 14 March" className={inputClass} />
            </div>
            <div>
              <label htmlFor="date" className={labelClass}>Invoice date *</label>
              <input id="date" name="date" type="date" required defaultValue={today} className={inputClass} />
            </div>
            <div>
              <label htmlFor="term_days" className={labelClass}>Payment due within (days) *</label>
              <input id="term_days" name="term_days" type="number" min={0} max={365} required defaultValue={30} className={inputClass} />
            </div>
            <div>
              <label htmlFor="reference" className={labelClass}>Client&apos;s reference / PO number</label>
              <input id="reference" name="reference" maxLength={50} className={inputClass} />
            </div>
            <div>
              <label htmlFor="project_tag" className={labelClass}>Project (optional)</label>
              <select id="project_tag" name="project_tag" defaultValue="" className={inputClass}>
                <option value="">None</option>
                {options.projectTags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className={labelClass}>Notes to show on the invoice</label>
              <textarea id="notes" name="notes" rows={3} maxLength={1000} className={`${inputClass} resize-y`} />
            </div>
          </fieldset>

          <LineItems codes={options.salesCodes} withQuantity defaultCode={defaultCode} />
        </SubmissionForm>
      </div>
    </>
  );
}
