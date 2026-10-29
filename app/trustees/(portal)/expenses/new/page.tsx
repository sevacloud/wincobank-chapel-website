/**
 * Trustee Portal — Submit an Expense
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/expenses/new
 *
 * Creates a purchase in QuickFile, creating the supplier first if needed,
 * and attaches the receipts. Every purchase is left unpaid for the
 * treasurer; the chosen account is noted on it as where payment should
 * come from.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getFormOptions, type FormOptions } from '@/lib/quickfile/submissions';
import { ErrorBox, PageHeading, errorMessage } from '../../../components/ui';
import { cardClass, inputClass, labelClass } from '../../../components/styles';
import { submitExpenseAction } from '../../../submit-actions';
import SubmissionForm from '../../../components/forms/SubmissionForm';
import PartyPicker from '../../../components/forms/PartyPicker';
import LineItems from '../../../components/forms/LineItems';

export const metadata = { title: 'Submit an Expense' };

export default async function NewExpensePage() {
  await requireTrustee();

  let options: FormOptions;
  try {
    options = await getFormOptions();
  } catch (e) {
    return (<><PageHeading title="Submit an Expense" /><ErrorBox message={errorMessage(e)} /></>);
  }
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeading title="Submit an Expense">
        Something you&apos;ve bought or paid for on behalf of the chapel. It goes straight into QuickFile as a purchase.
      </PageHeading>

      <div className={cardClass}>
        <SubmissionForm action={submitExpenseAction} kind="Purchase" submitLabel="Submit expense">
          <PartyPicker label="supplier" contacts={options.suppliers} />

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-sm font-semibold text-gray-900 mb-2">Details</legend>
            <div className="sm:col-span-2">
              <label htmlFor="description" className={labelClass}>What was it for? * <span className="font-normal text-gray-500">(max 35 characters — add detail in the lines below)</span></label>
              <input id="description" name="description" required minLength={2} maxLength={35} placeholder="e.g. Hall cleaning supplies" className={inputClass} />
            </div>
            <div>
              <label htmlFor="date" className={labelClass}>Receipt date *</label>
              <input id="date" name="date" type="date" required max={today} defaultValue={today} className={inputClass} />
            </div>
            <div>
              <label htmlFor="reference" className={labelClass}>Receipt / invoice number</label>
              <input id="reference" name="reference" maxLength={30} className={inputClass} />
            </div>
            <div>
              <label htmlFor="paid_from" className={labelClass}>Pay from which account? *</label>
              <select id="paid_from" name="paid_from" required defaultValue="" className={inputClass}>
                <option value="" disabled>Choose an account…</option>
                {options.bankAccounts.map((a) => (
                  <option key={a.nominalCode} value={a.nominalCode}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="project_tag" className={labelClass}>Project (optional)</label>
              <select id="project_tag" name="project_tag" defaultValue="" className={inputClass}>
                <option value="">None</option>
                {options.projectTags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </fieldset>

          <LineItems codes={options.purchaseCodes} withQuantity={false} />
        </SubmissionForm>
      </div>
    </>
  );
}
