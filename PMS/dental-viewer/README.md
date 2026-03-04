# Dental AI Viewer (Next.js)

Frontend for `AIModule` that:

- Uploads an X-ray image and calls `POST /inference/caries` (via `POST /api/analyze`)
- Displays the uploaded/selected image
- Overlays detection rectangles using `coordinates: [x1,y1,x2,y2]`
- Filters detections with a **confidence threshold slider**
- Includes a **Gallery** tab that lists/serves local images from `PMS/data/images`

## Prerequisites

- Node.js 18+
- `AIModule` running locally

## Setup

Create `.env.local` (optional):

```bash
# Where AIModule is running
AI_MODULE_URL=http://localhost:5560

# Where the local dataset images live (server-side only; defaults to ../data/images)
# IMAGES_DIR=/absolute/path/to/PMS/data/images
```

Notes:

- **Client components cannot read `process.env.*` at runtime**. Only variables prefixed with `NEXT_PUBLIC_` are embedded into the browser bundle, and even those require a dev-server restart after changes.
- This app **does not need** `NEXT_PUBLIC_IMAGES_DIR` because it serves images via `GET /api/images` and `GET /api/images/:name`.

## Run

Start the viewer:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API routes

- `GET /api/images` → lists images in `IMAGES_DIR` (default: `src/app/api/images`)
- `GET /api/images/:name` → returns raw image bytes
- `POST /api/analyze` → proxies multipart upload to `${AI_MODULE_URL}/inference/caries`

