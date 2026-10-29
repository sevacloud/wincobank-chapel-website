This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Trustee Portal (QuickFile)

`/trustees` is a login-gated financial dashboard for selected trustees, reading
live figures from the [QuickFile REST API (v2)](https://support.quickfile.co.uk/t/rest-api-overview/64912).
Trustees can also submit **expenses** (QuickFile purchases) and raise **sales
invoices**, adding new suppliers/clients and attaching receipts and supporting
documents. Submissions go straight into QuickFile — there is no approval queue.

Pages: Overview · Monthly Summary · Projects · Utilities · Annual Statement ·
3-Year Comparison · Expenses (list + add) · Invoices (list + add) · Manage Trustees ·
Change Password.

### Environment variables (Netlify → Site configuration → Environment variables)

| Variable | Required | Purpose |
|---|---|---|
| `QUICKFILE_API_TOKEN` | ✔ | Personal API token (QuickFile → Account Settings → Third Party Integration → API). Grant: bank, reports, projects, invoices, purchases, clients, suppliers, ledgers, documents. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✔ | Already used by bookings; also needed at runtime to manage trustee accounts. |
| `QUICKFILE_FY_START_MONTH` | | Financial year start month, 1–12 (default `4`, April). |
| `QUICKFILE_BANK_ACCOUNT_IDS` | | Comma list of QuickFile bank IDs to show (default: all visible accounts). |
| `QUICKFILE_UTILITY_TAGS` | | Project tags used on utility bills (default `Gas,Electricity,Water,Broadband,Insurance,Alarm`). |
| `QUICKFILE_PROJECT_BUDGETS` | | JSON map of project tag → budget in £, e.g. `{"Roof Repair":12000}`. |
| `QUICKFILE_WEB_PURCHASE_URL` | | Link for "View in QuickFile" after an expense is submitted, with `{id}` for the purchase ID — copy it from a purchase's address bar in QuickFile. Button hidden if unset. |
| `QUICKFILE_WEB_INVOICE_URL` | | As above for sales invoices (`{id}` = invoice ID). |
| `QUICKFILE_API_URL` | | Override the API base URL (default `https://api-beta.quickfile.co.uk/`). |

These are read at runtime, so they belong on Netlify, not in the GitHub build step.

### Managing trustees

Everything is done in the portal at **Manage Trustees** (`/trustees/admin`) —
any trustee can:

- **Add a trustee** (name + email). A temporary password is shown once; pass it
  on privately. They must choose their own password at first sign-in. If the
  email already has an account (e.g. a bookings admin) it is simply granted access.
- **Reset a password** — issues a new temporary password.
- **Remove** — revokes access immediately (the account itself is kept).

You can't remove or reset yourself, and the last trustee can't be removed.
Trustee status lives in each Supabase user's `app_metadata.trustee`, which only
the server (service-role key) can write.

**First trustee / lockout recovery** — from a machine with `.env.local`:

```bash
node --env-file=.env.local scripts/add-trustee.mjs someone@example.org "Full Name"
```

One-off Supabase setting: Authentication → Sign In / Providers → disable
*Allow new users to sign up* (the portal never needs public sign-up).

### Notes

- QuickFile allows 5,000 API requests per day; responses are cached in memory
  for 15 minutes and the cache is cleared after every submission.
- All lines are posted at 0% VAT (the chapel is not VAT registered).
- Expenses are always recorded unpaid; the chapel account the trustee picks is
  noted on the purchase as where the treasurer should pay it from.
- Files QuickFile won't attach to a purchase/invoice directly (e.g. `.txt`) are
  saved to QuickFile Documents › *Trustee Submissions*, prefixed with the record number.
- Attachments are limited to 10 files / 4.5 MB per submission (Netlify request
  limit); large photos are shrunk in the browser automatically.
