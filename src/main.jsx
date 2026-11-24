import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const photosUrl = '/api/photos'
const photoUrl = (key) => `${photosUrl}?key=${encodeURIComponent(key)}`

function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    upload: <><path d="M12 16V3m0 0L7 8m5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    trash: <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 15H6L5 6" /><path d="M10 10v7m4-7v7" /></>,
    download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5" /><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.8 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12.2-3" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" /></>,
    spark: <><path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2ZM19 17l.7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17Z" /></>,
  }
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatSize(bytes) {
  if (!Number.isFinite(Number(bytes))) return 'Tamanho indisponível'
  const value = Number(bytes)
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function photoType(photo) {
  const type = photo.contentType || ''
  if (type.startsWith('image/')) return type.split('/')[1]?.toUpperCase() || 'IMAGEM'
  return photo.key.split('.').pop()?.toUpperCase() || 'ARQUIVO'
}

function isImage(photo) {
  return photo.contentType?.startsWith('image/') || /\.(avif|gif|jpe?g|png|webp|bmp|svg)$/i.test(photo.key)
}

async function getErrorMessage(response, fallback) {
  try {
    const body = await response.text()
    if (!body) return fallback
    try {
      const json = JSON.parse(body)
      return json.message || json.error || fallback
    } catch {
      return body.length < 180 ? body : fallback
    }
  } catch {
    return fallback
  }
}

function App() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const toastTimer = useRef(null)

  const showNotice = useCallback((message, kind = 'success') => {
    setNotice({ message, kind })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setNotice(null), 5000)
  }, [])

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(photosUrl)
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Não foi possível carregar suas fotos.'))
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error('A API retornou uma lista de fotos inválida.')
      setPhotos(data.filter((item) => item && typeof item.key === 'string'))
    } catch (err) {
      setError(err instanceof TypeError ? 'Não foi possível conectar à API. Verifique se o servidor está rodando.' : err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
    return () => window.clearTimeout(toastTimer.current)
  }, [loadPhotos])

  useEffect(() => {
    if (!selected && !deleteTarget) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelected(null)
        setDeleteTarget(null)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [selected, deleteTarget])

  const filtered = useMemo(() => {
    const results = photos.filter((photo) => photo.key.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()))
    if (sort === 'size-desc') results.sort((a, b) => Number(b.size || 0) - Number(a.size || 0))
    else if (sort === 'size-asc') results.sort((a, b) => Number(a.size || 0) - Number(b.size || 0))
    else if (sort === 'name-desc') results.sort((a, b) => b.key.localeCompare(a.key, 'pt-BR'))
    else results.sort((a, b) => a.key.localeCompare(b.key, 'pt-BR'))
    return results
  }, [photos, query, sort])

  const totalSize = useMemo(() => photos.reduce((sum, photo) => sum + (Number(photo.size) || 0), 0), [photos])

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length || uploading) return
    const valid = files.filter((file) => file.type.startsWith('image/'))
    if (!valid.length) {
      showNotice('Selecione arquivos de imagem para enviar.', 'error')
      return
    }
    if (valid.length !== files.length) showNotice('Arquivos que não são imagens foram ignorados.', 'error')
    let uploaded = 0
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i]
      setUploading({ current: i + 1, total: valid.length, name: file.name, progress: 0 })
      try {
        await new Promise((resolve, reject) => {
          const request = new XMLHttpRequest()
          request.open('POST', photosUrl)
          request.upload.onprogress = (event) => {
            if (event.lengthComputable) setUploading({ current: i + 1, total: valid.length, name: file.name, progress: Math.round((event.loaded / event.total) * 100) })
          }
          request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Falha ao enviar ${file.name} (HTTP ${request.status}).`))
          request.onerror = () => reject(new Error(`Falha de conexão ao enviar ${file.name}.`))
          const form = new FormData()
          form.append('file', file)
          request.send(form)
        })
        uploaded++
      } catch (err) {
        showNotice(err.message, 'error')
      }
    }
    setUploading(null)
    if (inputRef.current) inputRef.current.value = ''
    if (uploaded) {
      await loadPhotos()
      showNotice(uploaded === 1 ? 'Foto enviada com sucesso!' : `${uploaded} fotos enviadas com sucesso!`)
    }
  }

  async function downloadPhoto(photo) {
    try {
      const response = await fetch(photoUrl(photo.key))
      if (!response.ok) throw new Error('Não foi possível baixar esta foto.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = photo.key
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      showNotice(err.message, 'error')
    }
  }

  async function deletePhoto() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const response = await fetch(photoUrl(deleteTarget.key), { method: 'DELETE' })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Não foi possível excluir esta foto.'))
      setPhotos((current) => current.filter((photo) => photo.key !== deleteTarget.key))
      setSelected(null)
      setDeleteTarget(null)
      showNotice('Foto excluída com sucesso.')
    } catch (err) {
      showNotice(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function onDrop(event) {
    event.preventDefault()
    setDragging(false)
    uploadFiles(event.dataTransfer.files)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#inicio" aria-label="revela, ir para início"><span className="brand-mark"><Icon name="spark" size={23} strokeWidth={2} /></span><span>revela<span className="brand-dot">.</span></span></a>
      <div className="sidebar-section-label">ESPAÇO DE TRABALHO</div>
      <nav aria-label="Navegação principal"><a href="#galeria" className="nav-item active"><Icon name="grid" size={19} /> Minha galeria <span className="nav-count">{photos.length}</span></a></nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-tip"><div className="tip-icon"><Icon name="spark" size={19} /></div><strong>Seus momentos merecem um lugar especial.</strong><p>Guarde, encontre e reviva cada lembrança.</p></div>
      <div className="sidebar-footer"><span className="footer-avatar">G</span><div><strong>Minha galeria</strong><small>Espaço pessoal</small></div><span className="footer-status" title="Galeria pessoal" /></div>
    </aside>

    <main id="inicio" className="main-content" onDragEnter={(event) => { if (event.dataTransfer.types.includes('Files')) setDragging(true) }}>
      <header className="topbar"><div className="breadcrumb">Meu espaço <span>/</span> <strong>Galeria</strong></div><div className="topbar-right"><span className="topbar-label">SEU ACERVO PESSOAL</span><span className="topbar-avatar">G</span></div></header>
      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> SUA GALERIA, DO SEU JEITO</div><h1>Suas fotos, <em>suas histórias.</em></h1><p>Todos os seus momentos favoritos, reunidos em um só lugar.</p></div><button className="button button-primary heading-upload" onClick={() => inputRef.current?.click()} disabled={!!uploading}><Icon name="plus" size={20} /> Adicionar fotos</button></div>

        <section className="hero" aria-label="Enviar fotos"><div className="hero-copy"><div className="hero-kicker"><Icon name="spark" size={16} /> UM LUGAR PARA CADA MOMENTO</div><h2>Memórias que vivem <span>com você.</span></h2><p>Comece sua coleção. Envie suas fotos e tenha suas lembranças sempre por perto.</p><button className="button button-hero" onClick={() => inputRef.current?.click()} disabled={!!uploading}>Enviar minhas fotos <Icon name="arrow" size={18} /></button></div><div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="art-card art-back"><div className="art-scene sunset"><span className="scene-sun" /><span className="scene-mountain one" /><span className="scene-mountain two" /></div></div><div className="art-card art-front"><div className="art-scene flower"><span className="flower-stem" /><span className="flower-leaf leaf-a" /><span className="flower-leaf leaf-b" /><span className="flower-petal petal-1" /><span className="flower-petal petal-2" /><span className="flower-petal petal-3" /><span className="flower-petal petal-4" /><span className="flower-center" /></div><div className="art-caption"><span className="caption-lines"><i /><i /></span><span className="caption-heart">♡</span></div></div><span className="hero-star star-one">✦</span><span className="hero-star star-two">✧</span></div></section>

        <section className="stats" aria-label="Resumo da galeria"><div className="stat"><span className="stat-icon stat-purple"><Icon name="image" size={21} /></span><div><small>TOTAL DE FOTOS</small><strong>{loading ? '—' : photos.length}</strong></div></div><div className="stat-divider" /><div className="stat"><span className="stat-icon stat-orange"><Icon name="grid" size={21} /></span><div><small>ARMAZENAMENTO USADO</small><strong>{loading ? '—' : formatSize(totalSize)}</strong></div></div><div className="stat-note"><span className="note-dot" /> Tudo organizado para você</div></section>

        <section id="galeria" className="gallery-section"><div className="section-head"><div><div className="section-eyebrow">SEU ACERVO</div><h2>Minha galeria <span>{photos.length}</span></h2></div><button className="refresh-button" onClick={loadPhotos} disabled={loading} title="Atualizar galeria" aria-label="Atualizar galeria"><Icon name="refresh" size={18} /></button></div>
          <div className="toolbar"><label className="search-box"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome..." aria-label="Buscar fotos por nome" /></label><label className="sort-box"><span>Ordenar por:</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar fotos"><option value="name">Nome A–Z</option><option value="name-desc">Nome Z–A</option><option value="size-desc">Maior tamanho</option><option value="size-asc">Menor tamanho</option></select><Icon name="chevron" size={16} /></label></div>

          {loading ? <div className="gallery-grid" aria-label="Carregando fotos">{Array.from({ length: 6 }, (_, i) => <div className="skeleton-card" key={i}><div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div> : error ? <div className="state-card error-state"><div className="state-icon error-icon"><Icon name="alert" size={27} /></div><h3>Não conseguimos carregar sua galeria</h3><p>{error}</p><button className="button button-outline" onClick={loadPhotos}>Tentar novamente <Icon name="refresh" size={17} /></button></div> : photos.length === 0 ? <div className="state-card empty-state"><div className="empty-art"><div className="empty-frame frame-one" /><div className="empty-frame frame-two"><Icon name="image" size={44} strokeWidth={1.3} /></div><span className="empty-spark">✦</span></div><h3>Sua galeria começa aqui</h3><p>Adicione sua primeira foto e comece a guardar os momentos que importam.</p><button className="button button-primary" onClick={() => inputRef.current?.click()}><Icon name="plus" size={19} /> Adicionar primeira foto</button><span className="empty-hint">ou arraste imagens para esta página</span></div> : filtered.length === 0 ? <div className="state-card no-results"><div className="state-icon"><Icon name="search" size={27} /></div><h3>Nenhuma foto encontrada</h3><p>Tente buscar por outro nome.</p><button className="text-button" onClick={() => setQuery('')}>Limpar busca</button></div> : <div className="gallery-grid">{filtered.map((photo) => <article className="photo-card" key={photo.key}><button className="photo-preview" onClick={() => setSelected(photo)} aria-label={`Visualizar ${photo.key}`}><div className="photo-image-wrap">{isImage(photo) ? <img src={photoUrl(photo.key)} alt={photo.key} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'flex' }} /> : null}<span className="image-fallback" style={{ display: isImage(photo) ? 'none' : 'flex' }}><Icon name="image" size={36} /></span></div><span className="photo-open">Visualizar foto <Icon name="arrow" size={16} /></span></button><div className="photo-meta"><div className="photo-info"><h3 title={photo.key}>{photo.key}</h3><p>{photoType(photo)} <span>·</span> {formatSize(photo.size)}</p></div><button className="card-menu" onClick={() => setSelected(photo)} aria-label={`Abrir opções de ${photo.key}`}><span>•••</span></button></div></article>)}</div>}
        </section>

        <footer className="page-footer"><span>Feito para guardar o que importa.</span><span>revela<span className="brand-dot">.</span></span></footer>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(event) => uploadFiles(event.target.files)} />
      {dragging && <div className="drop-overlay" onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={onDrop}><div className="drop-content"><Icon name="upload" size={42} /><strong>Solte suas fotos aqui</strong><span>Elas vão direto para sua galeria</span></div></div>}
      {uploading && <div className="upload-progress" role="status"><div className="upload-progress-icon"><Icon name="upload" size={20} /></div><div className="upload-progress-text"><strong>Enviando {uploading.current} de {uploading.total}</strong><span title={uploading.name}>{uploading.name}</span><div className="progress-track"><div style={{ width: `${uploading.progress}%` }} /></div></div><b>{uploading.progress}%</b></div>}
      {notice && <div className={`toast ${notice.kind}`} role="status"><Icon name={notice.kind === 'error' ? 'alert' : 'check'} size={19} /><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Fechar aviso"><Icon name="close" size={16} /></button></div>}
    </main>

    {selected && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><div className="viewer-modal" role="dialog" aria-modal="true" aria-label={`Foto ${selected.key}`}><div className="viewer-top"><div><span className="viewer-label">VISUALIZANDO FOTO</span><h2 title={selected.key}>{selected.key}</h2></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Fechar"><Icon name="close" size={21} /></button></div><div className="viewer-image">{isImage(selected) ? <img src={photoUrl(selected.key)} alt={selected.key} /> : <div className="viewer-fallback"><Icon name="image" size={56} /><span>Prévia indisponível</span></div>}</div><div className="viewer-bottom"><div className="viewer-details"><span>{photoType(selected)}</span><span>·</span><span>{formatSize(selected.size)}</span></div><div className="viewer-actions"><button className="button button-danger-ghost" onClick={() => setDeleteTarget(selected)}><Icon name="trash" size={18} /> Excluir</button><button className="button button-primary" onClick={() => downloadPhoto(selected)}><Icon name="download" size={18} /> Baixar foto</button></div></div></div></div>}
    {deleteTarget && <div className="modal-backdrop confirm-layer"><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><div className="confirm-icon"><Icon name="trash" size={25} /></div><h2 id="delete-title">Excluir esta foto?</h2><p id="delete-description">“{deleteTarget.key}” será removida permanentemente da sua galeria.</p><div className="confirm-actions"><button className="button button-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</button><button className="button button-danger" onClick={deletePhoto} disabled={deleting}>{deleting ? 'Excluindo...' : 'Sim, excluir'}</button></div></div></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
