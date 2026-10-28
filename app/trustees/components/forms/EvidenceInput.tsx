'use client';

import { useId, useState } from 'react';
import { ACCEPT_ATTR, ALLOWED_EXTENSIONS, MAX_FILES, MAX_TOTAL_BYTES } from '../../evidence-rules';
import { secondaryButtonClass } from '../styles';

/** Photos larger than this are downscaled in the browser before upload. */
const SHRINK_OVER_BYTES = 800 * 1024;
const MAX_DIMENSION = 2000;

const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

/** Downscale a large JPEG/PNG/WebP photo to a ~2000px JPEG. Other files pass through untouched. */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= SHRINK_OVER_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Multi-file picker for receipts and supporting evidence. Files are held in
 * the parent's state and appended to the FormData on submit.
 */
export default function EvidenceInput({ files, onChange, required }: {
  files: File[];
  onChange: (files: File[]) => void;
  required: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = files.reduce((s, f) => s + f.size, 0);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const picked = Array.from(list);
    const bad = picked.find((f) => !ALLOWED_EXTENSIONS.includes(f.name.split('.').pop()?.toLowerCase() ?? ''));
    if (bad) { setError(`"${bad.name}" isn't an accepted file type.`); return; }

    setBusy(true);
    const processed = await Promise.all(picked.map(shrink));
    setBusy(false);

    const next = [...files, ...processed];
    if (next.length > MAX_FILES) { setError(`No more than ${MAX_FILES} files.`); return; }
    const size = next.reduce((s, f) => s + f.size, 0);
    if (size > MAX_TOTAL_BYTES) { setError(`That would total ${mb(size)} — the limit is ${mb(MAX_TOTAL_BYTES)}. Try a smaller scan or fewer pages.`); return; }
    onChange(next);
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-900 mb-1">
        {required ? 'Receipts & supporting evidence *' : 'Supporting evidence'}
      </legend>
      <p className="text-xs text-gray-500 mb-2">
        PDF, photos (JPG, PNG, HEIC), text, Word or Excel files · up to {MAX_FILES} files, {mb(MAX_TOTAL_BYTES)} in total. Large photos are shrunk automatically.
      </p>
      <label htmlFor={id} className={`${secondaryButtonClass} inline-block cursor-pointer`}>
        {busy ? 'Preparing…' : '+ Add files'}
      </label>
      <input
        id={id}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => { add(e.target.files); e.target.value = ''; }}
      />

      {files.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white text-sm">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between px-3 py-2">
              <span className="truncate">{f.name} <span className="text-gray-500">· {mb(f.size)}</span></span>
              <button type="button" onClick={() => onChange(files.filter((_, n) => n !== i))} className="text-gray-500 hover:text-red-700 ml-3" aria-label={`Remove ${f.name}`}>✕</button>
            </li>
          ))}
          <li className="px-3 py-2 text-xs text-gray-500">{files.length} file(s) · {mb(total)} of {mb(MAX_TOTAL_BYTES)}</li>
        </ul>
      )}
      {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
    </fieldset>
  );
}
