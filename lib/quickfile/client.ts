/**
 * QuickFile REST API (v2) HTTP client
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Server-only. The API token lives in QUICKFILE_API_TOKEN and is never sent
 * to the browser — importing this module from a Client Component fails the
 * build thanks to 'server-only'.
 *
 * Design notes:
 * - GET responses are memoised in-process for CACHE_TTL_MS. QuickFile allows
 *   5,000 requests per rolling 24h per token, and the Projects view fans out
 *   two requests per project tag, so caching matters. Errors are never cached.
 * - Any write (POST) clears the cache so freshly submitted purchases and
 *   invoices show up on the dashboard straight away.
 * - Spec: https://api-beta.quickfile.co.uk/api-docs/
 */

import 'server-only';

const DEFAULT_BASE_URL = 'https://api-beta.quickfile.co.uk/';
const HTTP_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 15 * 60 * 1000;

// QuickFile v2 list endpoints cap `limit` at 100.
const PAGE_SIZE = 100;
// Safety cap on pages fetched per list call (PAGE_SIZE × MAX_PAGES records).
const MAX_PAGES = 50;

export class QuickFileError extends Error {
  constructor(message: string, public readonly status: number = 502) {
    super(message);
    this.name = 'QuickFileError';
  }
}

type Query = Record<string, string | number | boolean | undefined>;

const cache = new Map<string, { expires: number; value: unknown }>();

function baseUrl(): string {
  return (process.env.QUICKFILE_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '') + '/';
}

function token(): string {
  const t = process.env.QUICKFILE_API_TOKEN;
  if (!t) throw new QuickFileError('QuickFile API token is not configured (QUICKFILE_API_TOKEN).', 500);
  return t;
}

function buildUrl(path: string, query: Query = {}): string {
  const url = new URL(path.replace(/^\/+/, ''), baseUrl());
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function request<T>(method: 'GET' | 'POST', path: string, init: { query?: Query; body?: BodyInit; json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token()}`,
    Accept: 'application/json',
  };
  let body = init.body;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, init.query), {
      method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[QuickFile] ${method} /${path} network error:`, err);
    throw new QuickFileError(`Could not reach QuickFile (${path}).`);
  }

  const raw = await res.text();
  let decoded: unknown = null;
  try { decoded = raw ? JSON.parse(raw) : null; } catch { /* handled below */ }

  if (!res.ok) {
    // v2 error envelope: { "error": { "type", "code", "message" } }
    const message = (decoded as { error?: { message?: string } } | null)?.error?.message || raw.slice(0, 300);
    console.error(`[QuickFile] ${method} /${path} HTTP ${res.status}: ${message}`);
    throw new QuickFileError(`QuickFile HTTP ${res.status} (${path}): ${message}`, res.status >= 500 ? 502 : 400);
  }
  if (decoded === null || typeof decoded !== 'object') {
    throw new QuickFileError(`Unparseable response from QuickFile (${path}).`);
  }
  return decoded as T;
}

/** Cached GET. */
export async function qfGet<T>(path: string, query: Query = {}): Promise<T> {
  const key = buildUrl(path, query);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const value = await request<T>('GET', path, { query });
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  return value;
}

/** Uncached GET, for short-lived values (e.g. PDF links) and pre-write checks. */
export async function qfGetFresh<T>(path: string, query: Query = {}): Promise<T> {
  return request<T>('GET', path, { query });
}

/** Fetch every page of a paginated list endpoint and return the merged `data` rows. */
export async function qfGetAll<T>(path: string, query: Query = {}): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const raw = await qfGet<{ data?: T[]; paging?: { total?: number } }>(path, { ...query, limit: PAGE_SIZE, offset });
    const rows = raw.data ?? [];
    all.push(...rows);
    offset += rows.length;
    const total = raw.paging?.total ?? 0;
    // Stop on a short page, or once the reported total has been reached.
    if (rows.length < PAGE_SIZE || (total > 0 && offset >= total)) break;
  }
  return all;
}

/** JSON POST. Clears the read cache. */
export async function qfPost<T>(path: string, json: unknown): Promise<T> {
  cache.clear();
  return request<T>('POST', path, { json });
}

/** multipart/form-data POST (document uploads). Clears the read cache. */
export async function qfUpload<T>(path: string, form: FormData): Promise<T> {
  cache.clear();
  return request<T>('POST', path, { body: form });
}

export function clearQuickFileCache(): void {
  cache.clear();
}
