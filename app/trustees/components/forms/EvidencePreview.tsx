'use client';

import { useState } from 'react';
import { secondaryButtonClass } from '../styles';

const isImage = (f: File) => /^image\/(jpeg|png|webp|gif)$/.test(f.type);
const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

/**
 * Collapsed-by-default preview of the evidence the trustee just uploaded — the API can't
 * read receipts back from QuickFile, so these are the browser's own copies.
 * Object URLs aren't revoked: the page is reloaded for the next submission.
 */
export default function EvidencePreview({ files }: { files: File[] }) {
  const [urls] = useState(() => files.map((f) => URL.createObjectURL(f)));
  if (files.length === 0) return null;

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm text-chapel-600 hover:underline">
        Show supporting evidence ({files.length} file{files.length === 1 ? '' : 's'})
      </summary>
      <div className="mt-4 space-y-6">
        {files.map((f, i) => (
          <figure key={i}>
            <figcaption className="flex flex-wrap items-center justify-between gap-3 mb-2 text-sm text-gray-800">
              <span className="break-all">{f.name}</span>
              <a href={urls[i]} download={f.name} className={secondaryButtonClass}>Download</a>
            </figcaption>
            {isImage(f) ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob URL, not optimisable
              <img src={urls[i]} alt={`Preview of ${f.name}`} className="max-h-[48rem] w-auto rounded-md border border-gray-200" />
            ) : isPdf(f) ? (
              <iframe src={urls[i]} title={`Preview of ${f.name}`} className="w-full h-[48rem] rounded-md border border-gray-200" />
            ) : (
              <p className="text-sm text-gray-500">No preview for this file type.</p>
            )}
          </figure>
        ))}
      </div>
    </details>
  );
}
