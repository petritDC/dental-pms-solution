# Nanok “Void Service” (Fastify + TypeScript)

Stateless API that receives a dental X-ray image upload, validates + normalizes it, forwards it to Nanok caries inference, and returns Nanok’s JSON response wrapped in a consistent envelope.

## Endpoints

- **GET `/health`**
  - Returns: `{ "ok": true }`

- **POST `/inference/caries`** (multipart/form-data)
  - Fields:
    - **`modelName`** (string, optional; defaults to `"demo"`)
    - **`image`** (file upload; required)
  - Validation/normalization:
    - **15MB** hard cap
    - MIME sniffed from bytes: **image/jpeg, image/png, image/webp**
    - decoded via **sharp** (reject corrupt)
    - minimum resolution **800x800**
    - normalize: rotate by EXIF + convert to **JPEG quality 92**

## Requirements

- Node.js **18+**
- Nanok API key in env: **`NANOOK_API_KEY`**

## Setup

```bash
cd /Users/petrithalabaku/Documents/DCL/DENTAL/AIModule
npm install
```

Create `.env` (or export env vars):

```bash
PORT=3000
NANOOK_API_KEY=YOUR_REAL_KEY
```

## Run

Dev (auto-reload):

```bash
npm run dev
```

Build + start:

```bash
npm run build
npm start
```

## Test with curl

Health:

```bash
curl -s http://localhost:5560/health
```

Inference (modelName optional; defaults to demo):

```bash
curl --location 'http://localhost:5560/inference/caries' \
  --form 'modelName="demo"' \
  --form 'image=@"/path/to/xray.jpg"'
```

## Response shape

On Nanok 2xx:

```json
{
  "ok": true,
  "validated": { "mime": "...", "width": 0, "height": 0, "normalizedBytes": 0 },
  "nanok": {}
}
```

On Nanok non-2xx:

```json
{
  "ok": false,
  "error": "Nanok request failed",
  "status": 0,
  "nanok": {}
}
```

