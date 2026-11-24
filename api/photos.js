export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const fail = (status, message) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ message }))
  }
  const key = new URL(req.url, 'http://localhost').searchParams.get('key')
  const allowed = key === null ? ['GET', 'POST'] : ['GET', 'DELETE']
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '))
    return fail(405, 'Método não permitido.')
  }
  if (key === '' || key === '.' || key === '..') return fail(400, 'Nome de arquivo inválido.')
  try {
    const base = new URL(process.env.API_BASE_URL)
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
      throw new Error('Invalid configuration')
    }
    const target = `${base.href.replace(/\/$/, '')}/photos${key === null ? '' : `/${encodeURIComponent(key)}`}`
    const headers = {}
    let body
    if (req.method === 'POST') {
      if (!req.headers['content-type']?.startsWith('multipart/form-data;')) {
        return fail(415, 'Envie a imagem como multipart/form-data.')
      }
      headers['content-type'] = req.headers['content-type']
      if (Buffer.isBuffer(req.body)) body = req.body
      else {
        const chunks = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))
        body = Buffer.concat(chunks)
      }
    }
    const upstream = await fetch(target, {
      method: req.method, headers, body, redirect: 'follow', signal: AbortSignal.timeout(25000),
    })
    if (!upstream.ok) return fail(upstream.status, 'Não foi possível concluir a operação na galeria.')
    // Only expose gallery metadata; backend response bodies and headers can reveal its URL.
    if (req.method === 'GET' && key === null) {
      const photos = await upstream.json()
      if (!Array.isArray(photos)) throw new Error('Invalid photo list')
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify(photos.filter((p) => p && typeof p.key === 'string').map(({ key, size, contentType }) => ({ key, size, contentType }))))
    }
    if (req.method !== 'GET') {
      await upstream.body?.cancel()
      res.statusCode = 204
      return res.end()
    }
    const data = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.end(data)
  } catch {
    return fail(502, 'Não foi possível conectar à galeria.')
  }
}
