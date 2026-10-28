/**
 * Supporting-evidence upload rules, shared by the browser (to fail fast and
 * shrink photos) and the server actions (to enforce).
 *
 * The total cap keeps a submission under Netlify's ~6 MB function request
 * limit; next.config.ts sets serverActions.bodySizeLimit to match.
 */

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx'];

export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

export const MAX_FILES = 10;

export const MAX_TOTAL_BYTES = 4.5 * 1024 * 1024;
