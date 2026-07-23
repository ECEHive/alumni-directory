# Hive Alumni Directory

A static, encrypted alumni directory for Georgia Tech's [Hive Makerspace](https://hive.ece.gatech.edu).

Alumni data is pulled from Airtable at build time, transformed, AES-GCM encrypted, and stored as a single `.enc` file. The decryption key is never sent to the server — it lives only in the URL fragment (`#your-key`).

---

## How the Data Pipeline Works

Airtable is the single source of truth. At build time (`src/build/`):

1. **Fetch** — every record is pulled from the alumni table via the Airtable REST API, addressed by field ID so column renames never break the build.
2. **Consent gating** — only records with **Internally Visible Contact** checked are included at all; the LinkedIn handle is included only when **LinkedIn Consent** is checked.
3. **Transform** — LinkedIn URLs are normalized to bare handles, free-text graduation info is reduced to a class year, and the free-text location column (ZIPs, "City, ST", "City, Country", region names) is geocoded into structured parts — city, region, country — plus coordinates, so both US and international locations display cleanly. ZIPs resolve offline via a bundled dataset; everything else goes through OpenStreetMap Nominatim, with results cached in `data/geocode-cache.json` so repeat builds don't re-geocode. The cache file is gitignored — locally it just accumulates on disk, and in CI it's persisted between runs via `actions/cache`.
4. **Encrypt** — the compact encoded blob is AES-GCM encrypted with `ALUMNI_SECRET_KEY` and written to `dist/data/alumni.enc`.

To update the site's data, just edit Airtable — the next build picks it up. The deploy workflow runs on every push to `main`, **daily on a schedule**, or manually from the Actions tab.

---

## GitHub Actions Setup

Required repository secrets (`Settings → Secrets and variables → Actions`):

| Secret | Description |
|---|---|
| `ALUMNI_SECRET_KEY` | Encryption passphrase — also the URL fragment users append to access the site |
| `AIRTABLE_TOKEN` | Airtable personal access token with `data.records:read` scope on the alumni base |

---

## Local Development

```sh
bun install   # install dependencies
bun dev       # dev server at localhost:4321
bun build     # production build → dist/
bun preview   # preview the production build locally
```

Copy `.env.example` to `.env` and fill in both values before running locally.
