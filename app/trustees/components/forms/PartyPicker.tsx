'use client';

import { useMemo, useState } from 'react';
import type { Contact } from '@/lib/quickfile/submissions';
import { inputClass, labelClass } from '../styles';

/**
 * Choose an existing QuickFile supplier/client or enter a new one.
 * Posts party_mode=existing|new, party_id, and new_* fields.
 */
export default function PartyPicker({ label, contacts }: { label: 'supplier' | 'client'; contacts: Contact[] }) {
  const [mode, setMode] = useState<'existing' | 'new'>(contacts.length ? 'existing' : 'new');
  const [filter, setFilter] = useState('');
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? contacts.filter((c) => c.name.toLowerCase().includes(q)) : contacts;
  }, [contacts, filter]);
  const Label = label[0].toUpperCase() + label.slice(1);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-gray-900 mb-2">{Label}</legend>
      <input type="hidden" name="party_mode" value={mode} />
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} disabled={!contacts.length} />
          Existing {label}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} />
          New {label}
        </label>
      </div>

      {mode === 'existing' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="party_filter" className={labelClass}>Search</label>
            <input id="party_filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Filter ${contacts.length} ${label}s…`} className={inputClass} />
          </div>
          <div>
            <label htmlFor="party_id" className={labelClass}>{Label}</label>
            <select id="party_id" name="party_id" required className={inputClass} defaultValue="">
              <option value="" disabled>Choose…</option>
              {shown.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="sm:col-span-2">
            <label htmlFor="new_company" className={labelClass}>{label === 'supplier' ? 'Business or person name' : 'Client / organisation name'} *</label>
            <input id="new_company" name="new_company" required minLength={2} maxLength={100} className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_first" className={labelClass}>Contact first name</label>
            <input id="new_first" name="new_first" maxLength={50} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_surname" className={labelClass}>Contact surname</label>
            <input id="new_surname" name="new_surname" maxLength={50} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_email" className={labelClass}>Email</label>
            <input id="new_email" name="new_email" type="email" maxLength={120} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_phone" className={labelClass}>Phone</label>
            <input id="new_phone" name="new_phone" type="tel" maxLength={30} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_address1" className={labelClass}>Address line 1</label>
            <input id="new_address1" name="new_address1" maxLength={100} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_address2" className={labelClass}>Address line 2</label>
            <input id="new_address2" name="new_address2" maxLength={100} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_town" className={labelClass}>Town / city</label>
            <input id="new_town" name="new_town" maxLength={60} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_postcode" className={labelClass}>Postcode</label>
            <input id="new_postcode" name="new_postcode" maxLength={10} autoComplete="off" className={inputClass} />
          </div>
          {label === 'client' && (
            <p className="sm:col-span-2 text-xs text-gray-500">
              Add a contact name and email so the treasurer can send the invoice from QuickFile.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
