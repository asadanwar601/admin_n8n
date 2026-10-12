# admin_n8n

Standalone, zero-dependency embeddable **Admin Knowledge Base & Hybrid RAG Console** designed for the `n8n_saas_api` FastAPI gateway (`/v1/admin/rag`) and n8n `Admin RAG Flow` (`/webhook/admin-rag-ingest`).

100% isolated from `chat_n8n` so storefront visitors never download Admin UI code.

## Features
- **Zero-Dependency Core**: Lightweight standalone bundle (`admin-widget.bundle.js` + `style.css`).
- **Inline or Floating Embed**: Mounts directly inside any existing Admin Portal page container (`target: '#admin-rag-portal'`, `mode: 'inline'`) or as a floating drawer (`mode: 'floating'`).
- **Built-in `Admin Cred` Authentication**: Prompts for your n8n `Admin Cred` username & password (or accepts them via config / `window.postMessage` SSO) and sends `Authorization: Basic ...` on every upload or URL scrape.
- **Dual Ingestion Modes**:
  1. **Upload Document (`source_type: 'file'`)**: Drag & drop `.pdf`, `.doc`, `.docx`, `.csv`, `.xlsx`, `.txt`, `.md`.
  2. **Add Website URL (`source_type: 'url'`)**: Scrapes and cleans any live URL into contextual chunks.
- **Role-Scoped Metadata**: Tag every document or URL with `visibility` (`public` | `customer` | `admin`) and `category` for PostgreSQL Hybrid Search (`PGVector` + `BM25 FTS`).

## Installation

```bash
npm install admin_n8n
```

Or via 1-line CDN script inside any Admin Portal:

```html
<div id="admin-rag-portal"></div>
<link rel="stylesheet" href="https://your-admin-domain.pages.dev/style.css" />
<script
  src="https://your-admin-domain.pages.dev/admin-widget.bundle.js"
  data-api-url="https://n8n-saas-host.onrender.com/v1/admin/rag"
  data-target="#admin-rag-portal"
  data-title="VELOUR Knowledge Base Admin"
  data-primary-color="#201c18"
  defer>
</script>
```
