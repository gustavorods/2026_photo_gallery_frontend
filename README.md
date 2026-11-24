# revela — Photo Gallery Front

**Tagline:** Keep your photos together in one place.

Read this in [Português (Brasil)](README.pt-BR.md) or [Español](README.es.md).

## Description

revela is a React and Vite front end for a photo gallery backed by a Spring Boot API and S3 storage. You can upload images, search and sort the gallery, preview photos, download them, and delete them.

## Installation

Requires Node.js 20.19+. Copy `.env.example` to `.env.local` and set `API_BASE_URL` to your backend base URL.

```bash
git clone <repository-url>
cd photo-gallery-front
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`. The browser accesses `/api/photos`; the server forwards requests to the backend.

## Usage

Use the upload button or drag images onto the page to upload them. Search by file name, sort by name or size, and select a photo to preview, download, or delete it.

Build with `npm run build`. Deploy the whole project to Vercel, including `api/`, rather than only `dist/`. In Settings → Environment Variables, add `API_BASE_URL` for Production and Preview, then redeploy. Do not use a `VITE_` prefix: those variables are public. `npm run preview` only serves static files and does not run the API.

The proxy does not add authentication. Vercel Function payload limits apply to uploads and downloads. Old deployments and Git history may still contain the previous URL.

## License

MIT. See [LICENSE](LICENSE).
