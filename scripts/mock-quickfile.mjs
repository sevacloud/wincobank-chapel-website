/**
 * Local mock of the QuickFile v2 REST API, for testing the trustee portal
 * without touching the chapel's real books.
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 *   node scripts/mock-quickfile.mjs            # listens on :4010
 *
 * then in .env.local:
 *   QUICKFILE_API_URL=http://localhost:4010/
 *   QUICKFILE_API_TOKEN=mock
 *
 * Serves sample data for the last few financial years and keeps anything
 * the portal creates (suppliers, clients, purchases, invoices, documents)
 * in memory, so submissions show up in the reports. Record-level uploads of
 * .txt files are rejected on purpose, to exercise the Document Management
 * fallback. Every write is logged to the console.
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 4010);

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const banks = [
  { id: 101, nominal_code: 1200, name: 'Current Account', bank_type: 'current' },
  { id: 102, nominal_code: 1210, name: 'Building Fund Reserve', bank_type: 'reserve' },
];

const nominals = [
  [4000, 'Room Hire Income', false, true], [4100, 'Donations', false, true], [4200, 'Grants', false, true],
  [5000, 'Building Repairs', true, false], [7200, 'Gas', true, false], [7201, 'Electricity', true, false],
  [7300, 'Water', true, false], [7500, 'Cleaning', true, false], [7600, 'Insurance', true, false],
  [8200, 'Sundry Expenses', true, false],
].map(([nominal_code, name, is_purchase_code, is_sales_code]) => ({ nominal_code, name, is_purchase_code, is_sales_code }));

const suppliers = [
  { id: 1, company_name: 'British Gas' }, { id: 2, company_name: 'Yorkshire Water' },
  { id: 3, company_name: 'Sheffield Roofing Ltd' }, { id: 4, company_name: 'Ecclesiastical Insurance' },
];
const clients = [{ id: 1, company_name: 'Wincobank Toddler Group' }, { id: 2, company_name: 'Sheffield Choir Society' }];
// Client contacts, keyed by client ID. The choir has no email, to exercise that path.
const contacts = {
  1: [{ id: 501, first_name: 'Sarah', surname: 'Hughes', email: 'sarah@example.org', is_default: true }],
  2: [{ id: 502, first_name: 'Tom', surname: 'Reed', email: '', is_default: true }],
};
const tags = ['Roof Repair', 'Gas', 'Electricity', 'Water', 'Insurance', 'Community Lunch'];

const pad = (n) => String(n).padStart(2, '0');
const months = [];
for (let y = 2022; y <= 2026; y++) for (let m = 1; m <= 12; m++) months.push(`${y}-${pad(m)}`);

// Deterministic pseudo-random so figures are stable between restarts.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const money = (lo, hi) => Math.round((lo + rand() * (hi - lo)) * 100) / 100;

let nextId = 1000;
const transactions = { 101: [], 102: [] };
const purchases = [];
const invoices = [];
const documents = [];

for (const ym of months) {
  if (`${ym}-01` > new Date().toISOString().slice(0, 10)) break;
  const supplierFor = { Gas: 1, Water: 2, Insurance: 4, Electricity: 1 };
  for (const [tag, code, lo, hi] of [['Gas', 7200, 60, 220], ['Electricity', 7201, 40, 120], ['Water', 7300, 15, 40]]) {
    const gross = money(lo, hi);
    purchases.push({ id: nextId++, receipt_number: `P${nextId}`, receipt_date: `${ym}-05`, supplier_id: supplierFor[tag], supplier_name: suppliers.find((s) => s.id === supplierFor[tag]).company_name, description: `${tag} bill`, status: 'PAIDFULL', net_total: gross, gross_total: gross, tags: [tag], code });
    transactions[101].push({ id: nextId++, date: `${ym}-06`, reference: `${tag} DD`, notes: '', amount: -gross });
  }
  const hire = money(150, 600);
  invoices.push({ id: nextId++, invoice_number: `INV${nextId}`, issue_date: `${ym}-10`, client_id: 1, client_company_name: 'Wincobank Toddler Group', description: 'Hall hire', status: 'PAIDFULL', net_total: hire, gross_total: hire, tags: ['Community Lunch'], code: 4000 });
  transactions[101].push({ id: nextId++, date: `${ym}-12`, reference: 'Hall hire', notes: '', amount: hire });
  transactions[101].push({ id: nextId++, date: `${ym}-20`, reference: 'Sunday collection', notes: '', amount: money(200, 450) });
  transactions[102].push({ id: nextId++, date: `${ym}-28`, reference: 'Standing order to reserve', notes: '', amount: 100 });
}
// One-off roof job with a project tag.
purchases.push({ id: nextId++, receipt_number: 'P-ROOF', receipt_date: '2025-09-15', supplier_id: 3, supplier_name: 'Sheffield Roofing Ltd', description: 'Slate repairs', status: 'UNPAID', net_total: 4250, gross_total: 4250, tags: ['Roof Repair'], code: 5000 });

const OPENING = { 101: 3500, 102: 12000 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inRange = (d, q) => (!q.date_from || d >= q.date_from) && (!q.date_to || d <= q.date_to);

function page(rows, q) {
  const offset = Number(q.offset ?? 0);
  const limit = Number(q.limit ?? 100);
  return { data: rows.slice(offset, offset + limit), paging: { total: rows.length, offset, limit } };
}

function balanceAt(bankId, to) {
  const txns = transactions[bankId].filter((t) => !to || t.date <= to);
  return Math.round((OPENING[bankId] + txns.reduce((s, t) => s + t.amount, 0)) * 100) / 100;
}

function withRunningBalance(bankId) {
  let bal = OPENING[bankId];
  return [...transactions[bankId]].sort((a, b) => a.date.localeCompare(b.date)).map((t) => ({ ...t, balance: Math.round((bal += t.amount) * 100) / 100 }));
}

function profitAndLoss(q) {
  const sum = (rows, dateKey) => {
    const byCode = new Map();
    for (const r of rows) if (inRange(r[dateKey], q)) byCode.set(r.code, (byCode.get(r.code) ?? 0) + r.gross_total);
    return [...byCode].map(([code, amount]) => ({ nominal_code: code, nominal_code_name: nominals.find((n) => n.nominal_code === code)?.name ?? String(code), amount: Math.round(amount * 100) / 100 }));
  };
  return { turnovers: sum(invoices, 'issue_date'), less_cost_of_sales: [], less_expenses: sum(purchases, 'receipt_date'), totals: {} };
}

const error = (res, status, message) => send(res, status, { error: { type: 'mock', code: status, message } });

/** Minimal one-page PDF saying which invoice it is. */
function invoicePdf(inv) {
  const text = `Invoice ${inv.invoice_number} - ${inv.client_company_name} - GBP ${inv.gross_total.toFixed(2)} (mock)`.replace(/[()\\]/g, '');
  const stream = `BT /F1 16 Tf 60 760 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((o, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '4999' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

/** Minimal multipart parse — enough to read field values and file names. */
function parseMultipart(buf, contentType) {
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  const fields = {};
  const files = [];
  for (const part of buf.toString('latin1').split(`--${boundary}`)) {
    const name = part.match(/name="([^"]+)"/)?.[1];
    if (!name) continue;
    const filename = part.match(/filename="([^"]*)"/)?.[1];
    const value = part.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, '');
    if (filename !== undefined) files.push({ field: name, filename, bytes: Buffer.byteLength(value, 'latin1') });
    else fields[name] = value;
  }
  return { fields, files };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const q = Object.fromEntries(url.searchParams);
  const path = url.pathname.replace(/^\/+|\/+$/g, '');
  const m = (re) => path.match(re);

  // Stands in for QuickFile's PDF link, which needs no API token.
  let pdfMatch;
  if (req.method === 'GET' && (pdfMatch = path.match(/^pdf\/(\d+)$/))) {
    const inv = invoices.find((x) => x.id === Number(pdfMatch[1]));
    if (!inv) return error(res, 404, 'Invoice not found');
    res.writeHead(200, { 'Content-Type': 'application/pdf' });
    return res.end(invoicePdf(inv));
  }

  if (!req.headers.authorization?.startsWith('Bearer ')) return error(res, 401, 'Missing bearer token');

  try {
    if (req.method === 'GET') {
      if (path === 'bank_accounts') return send(res, 200, { data: banks });
      let r;
      if ((r = m(/^bank_accounts\/(\d+)\/balance$/))) return send(res, 200, { balance: balanceAt(Number(r[1])) });
      if ((r = m(/^bank_accounts\/(\d+)\/transactions$/))) {
        const rows = withRunningBalance(Number(r[1])).filter((t) => inRange(t.date, q)).reverse();
        return send(res, 200, page(rows, q));
      }
      if (path === 'reports/profit-and-loss') return send(res, 200, profitAndLoss(q));
      if (path === 'reports/balance-sheet') {
        return send(res, 200, { current_assets: banks.map((b) => ({ nominal_code: b.nominal_code, amount: balanceAt(b.id, q.date_to) })) });
      }
      if (path === 'projects') return send(res, 200, tags);
      if (path === 'invoices') {
        return send(res, 200, page(invoices.filter((i) => inRange(i.issue_date, q) && (!q.tag_name || i.tags.includes(q.tag_name))), q));
      }
      if (path === 'purchases') {
        return send(res, 200, page(purchases.filter((p) => inRange(p.receipt_date, q) && (!q.tag_name || p.tags.includes(q.tag_name))), q));
      }
      if ((r = m(/^purchases\/(\d+)$/))) {
        const p = purchases.find((x) => x.id === Number(r[1]));
        return p ? send(res, 200, p) : error(res, 404, 'Purchase not found');
      }
      if ((r = m(/^invoices\/(\d+)\/get-pdf$/))) {
        if (!invoices.some((x) => x.id === Number(r[1]))) return error(res, 404, 'Invoice not found');
        return send(res, 200, { id: Number(r[1]), uri: `http://localhost:${PORT}/pdf/${r[1]}` });
      }
      if ((r = m(/^clients\/(\d+)\/contacts$/))) return send(res, 200, contacts[r[1]] ?? []);
      if ((r = m(/^invoices\/(\d+)$/))) {
        const i = invoices.find((x) => x.id === Number(r[1]));
        return i ? send(res, 200, i) : error(res, 404, 'Invoice not found');
      }
      if (path === 'ledgers/nominals') return send(res, 200, nominals);
      if (path === 'suppliers') return send(res, 200, page(suppliers, q));
      if (path === 'clients') return send(res, 200, page(clients, q));
    }

    if (req.method === 'POST') {
      const raw = await readBody(req);
      const ct = req.headers['content-type'] ?? '';

      if (ct.startsWith('multipart/form-data')) {
        const { fields, files } = parseMultipart(raw, ct);
        const file = files[0];
        console.log(`POST /${path}`, fields, file && `${file.filename} (${file.bytes} bytes)`);
        if (!file) return error(res, 400, 'file is required');
        if (path !== 'documents/general' && /\.txt$/i.test(file.filename)) {
          return error(res, 400, 'Unsupported file type for attachment');
        }
        const doc = { id: nextId++, path, ...fields, filename: file.filename };
        documents.push(doc);
        return send(res, 200, { id: doc.id, path: `/docs/${doc.id}` });
      }

      const body = JSON.parse(raw.toString('utf8') || '{}');
      console.log(`POST /${path}`, JSON.stringify(body, null, 2));

      if (path === 'suppliers') {
        const s = { id: nextId++, company_name: body.company_name };
        suppliers.push(s);
        return send(res, 200, s);
      }
      if (path === 'clients') {
        const c = { id: nextId++, company_name: body.company_name };
        clients.push(c);
        return send(res, 200, c);
      }
      let r;
      if ((r = m(/^clients\/(\d+)\/contacts$/))) {
        if (!body.first_name || !body.surname || !body.email) return error(res, 400, 'first_name, surname and email are required');
        const c = { id: nextId++, first_name: body.first_name, surname: body.surname, email: body.email, is_default: !contacts[r[1]]?.length };
        (contacts[r[1]] ??= []).push(c);
        return send(res, 200, { id: c.id });
      }
      if ((r = m(/^invoices\/(\d+)\/send$/))) {
        const inv = invoices.find((x) => x.id === Number(r[1]));
        if (!inv) return error(res, 404, 'Invoice not found');
        const contact = (contacts[inv.client_id] ?? []).find((c) => c.id === body.client_contact_id);
        if (!body.by_email || !contact?.email) return error(res, 400, 'A client contact with an email address is required');
        inv.status = 'SENT';
        console.log(`  (mock) emailed invoice ${inv.invoice_number} to ${contact.email}`);
        return send(res, 200, { success: true });
      }
      if (path === 'purchases') {
        const supplier = suppliers.find((s) => s.id === body.supplier_id);
        if (!supplier) return error(res, 400, 'Unknown supplier_id');
        // Mirror QuickFile's field limits so local tests catch overruns.
        if ((body.description ?? '').length > 35) return error(res, 400, 'The description must be less than 35 characters long.');
        if ((body.supplier_reference ?? '').length > 30) return error(res, 400, 'The supplier_reference must be less than 30 characters long.');
        const gross = body.item_lines.reduce((s, l) => s + l.sub_total, 0);
        const p = { id: nextId++, receipt_number: `P${nextId}`, receipt_date: body.receipt_date, supplier_id: supplier.id, supplier_name: supplier.company_name, description: body.description, status: body.payment ? 'PAIDFULL' : 'UNPAID', net_total: gross, gross_total: gross, tags: body.tags ?? [], code: body.item_lines[0].nominal_code,
          supplier_reference: body.supplier_reference ?? '', due_date: body.receipt_date,
          item_lines: body.item_lines.map((l) => ({ id: nextId++, ...l, vat_amount: 0, line_total: l.sub_total })) };
        purchases.push(p);
        if (body.payment) {
          const bank = banks.find((b) => b.nominal_code === body.payment.nominal_code);
          transactions[bank.id].push({ id: nextId++, date: body.payment.date, reference: `Purchase ${p.receipt_number}`, notes: '', amount: -body.payment.amount });
        }
        return send(res, 200, p);
      }
      if (path === 'invoices') {
        const client = clients.find((c) => c.id === body.client_id);
        if (!client) return error(res, 400, 'Unknown client_id');
        if (body.description && (body.description.length < 2 || body.description.length > 35)) return error(res, 400, 'description must be 2-35 characters');
        const gross = body.item_lines.reduce((s, l) => s + l.unit_cost * l.qty, 0);
        const i = { id: nextId++, invoice_number: `INV${nextId}`, issue_date: body.issue_date, client_id: client.id, client_company_name: client.company_name, description: body.description, status: 'DRAFT', net_total: gross, gross_total: gross, tags: body.tags ?? [], code: body.item_lines[0].nominal_code,
          purchase_reference: body.purchase_reference ?? '', term_days: body.term_days, notes: body.notes,
          item_lines: body.item_lines.map((l) => ({ id: nextId++, ...l, vat_amount: 0, line_total: l.unit_cost * l.qty })) };
        invoices.push(i);
        return send(res, 200, i);
      }
    }

    return error(res, 404, `Mock has no handler for ${req.method} /${path}`);
  } catch (e) {
    console.error(e);
    return error(res, 500, String(e));
  }
}).listen(PORT, () => console.log(`Mock QuickFile API on http://localhost:${PORT}/`));
