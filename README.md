# Jewelry Storefront (white-label)

A reusable storefront for gold and jewelry clients, in Arabic and English. The data comes from each client's ERP/dashboard.

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /ar or /en
npm run build
npm run typecheck
```

- Pick the client: `NEXT_PUBLIC_CLIENT_ID` in `.env.local` (see `config/clients/`)
- Pick the data source: `NEXT_PUBLIC_DATA_SOURCE=mock` (local JSON) or `api` (dashboard)
- Full explanation of the structure: see `CHANGES.md`
