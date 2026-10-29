/**
 * Links into the QuickFile web app
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * The API returns no web-app URLs, so they are built from
 * QUICKFILE_WEB_PURCHASE_URL / QUICKFILE_WEB_INVOICE_URL templates, where
 * {id} is the QuickFile record ID. Unset → null, and callers hide the link.
 */

export function quickFileUrl(kind: 'purchase' | 'invoice', id: number): string | null {
  const template = process.env[`QUICKFILE_WEB_${kind.toUpperCase()}_URL`];
  return template ? template.replaceAll('{id}', String(id)) : null;
}
