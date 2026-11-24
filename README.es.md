# revela — Interfaz de la galería de fotos

**Resumen:** Todas tus fotos en un solo lugar.

Leer en [English](README.md) o [Português (Brasil)](README.pt-BR.md).

## Descripción

revela es una interfaz de React y Vite para una galería de fotos conectada a una API de Spring Boot y al almacenamiento S3. Permite subir imágenes, buscar y ordenar la galería, ver fotos, descargarlas y eliminarlas.

## Instalación

Requiere Node.js 20.19+. Copia `.env.example` a `.env.local` y configura `API_BASE_URL` con la URL base del backend.

```bash
git clone <repository-url>
cd photo-gallery-front
npm install
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`. El navegador accede a `/api/photos`; el servidor reenvía las solicitudes al backend.

## Uso

Usa el botón para subir fotos o arrastra imágenes a la página. Busca por nombre de archivo, ordena por nombre o tamaño y selecciona una foto para verla, descargarla o eliminarla.

Compila con `npm run build`. Publica el proyecto completo en Vercel, incluyendo `api/`, en lugar de solo `dist/`. En Settings → Environment Variables, agrega `API_BASE_URL` para Production y Preview y vuelve a desplegar. No uses el prefijo `VITE_`: esas variables son públicas. `npm run preview` solo sirve archivos estáticos y no ejecuta la API.

El proxy no agrega autenticación. Los límites de tamaño de Vercel Functions se aplican a las subidas y descargas. Los despliegues antiguos y el historial Git pueden conservar la URL anterior.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
