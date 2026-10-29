'use client';

import { useMemo, useState } from 'react';
import type { Contact } from '@/lib/quickfile/submissions';
import { inputClass, labelClass } from '../styles';
import Combobox from './Combobox';

/**
 * Choose an existing QuickFile supplier/client or enter a new one.
 * Posts party_mode=existing|new, party_id, and new_* fields.
 */
export default function PartyPicker({ label, contacts }: { label: 'supplier' | 'client'; contacts: Contact[] }) {
  const [mode, setMode] = useState<'existing' | 'new'>(contacts.length ? 'existing' : 'new');
  // Name carried over when "Add … as a new supplier" is picked from the search.
  const [newName, setNewName] = useState('');
  const options = useMemo(() => contacts.map((c) => ({ value: String(c.id), label: c.name })), [contacts]);
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
        <div className="sm:max-w-md">
          <label htmlFor="party_search" className={labelClass}>{Label} *</label>
          <Combobox
            id="party_search"
            name="party_id"
            options={options}
            required
            requiredMessage={`Choose a ${label} from the list, or add a new one.`}
            placeholder={`Start typing to search ${contacts.length} ${label}s…`}
            onNoMatch={(name) => { setNewName(name); setMode('new'); }}
            noMatchLabel={(name) => `+ Add “${name}” as a new ${label}`}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="sm:col-span-2">
            <label htmlFor="new_company" className={labelClass}>{label === 'supplier' ? 'Business or person name' : 'Client / organisation name'} *</label>
            <input id="new_company" name="new_company" required minLength={2} maxLength={100} defaultValue={newName} autoFocus={!!newName} className={inputClass} />
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
            <input id="new_email" name="new_email" type="email" maxLength={100} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_phone" className={labelClass}>Phone</label>
            <input id="new_phone" name="new_phone" type="tel" maxLength={20} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_address1" className={labelClass}>Address line 1</label>
            <input id="new_address1" name="new_address1" maxLength={75} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="new_address2" className={labelClass}>Address line 2</label>
            <input id="new_address2" name="new_address2" maxLength={75} autoComplete="off" className={inputClass} />
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
