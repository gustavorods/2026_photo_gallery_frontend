# revela — Interface da galeria de fotos

**Resumo:** Suas fotos reunidas em um só lugar.

Leia em [English](README.md) ou [Español](README.es.md).

## Descrição

revela é uma interface React e Vite para uma galeria de fotos conectada a uma API Spring Boot e ao armazenamento S3. Permite enviar imagens, pesquisar e ordenar a galeria, visualizar fotos, baixá-las e excluí-las.

## Instalação

Requer Node.js 20.19+. Copie `.env.example` para `.env.local` e preencha `API_BASE_URL` com a URL base do backend.

```bash
git clone <repository-url>
cd photo-gallery-front
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. O navegador acessa `/api/photos`; o servidor encaminha as requisições ao backend.

## Uso

Use **Adicionar fotos** ou arraste imagens para a página para enviá-las. Pesquise pelo nome do arquivo, ordene por nome ou tamanho e selecione uma foto para visualizar, baixar ou excluir.

Gere a versão de produção com `npm run build`. Publique o projeto completo na Vercel, incluindo `api/`, em vez de apenas `dist/`. Em Settings → Environment Variables, adicione `API_BASE_URL` para Production e Preview e faça um novo deploy. Não use o prefixo `VITE_`: essas variáveis são públicas. `npm run preview` serve apenas os arquivos estáticos e não executa a API.

O proxy não adiciona autenticação. Os limites de tamanho das Vercel Functions se aplicam aos uploads e downloads. Deploys antigos e o histórico Git ainda podem conter a URL anterior.

## Licença

MIT. Consulte [LICENSE](LICENSE).
