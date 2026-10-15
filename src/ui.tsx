import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImage } from './images'
import { useStore } from './store'

export function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <line x1="9.2" y1="4.5" x2="9.2" y2="19.5" />
      <line x1="14.8" y1="4.5" x2="14.8" y2="19.5" />
    </svg>
  )
}

export function IconDaily() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <circle cx="12" cy="11" r="2.6" />
      <line x1="8.5" y1="16.5" x2="15.5" y2="16.5" />
    </svg>
  )
}

export function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 18 16.5H8.5L4.5 19.5V6.5Z" />
      <line x1="8.5" y1="9.5" x2="15.5" y2="9.5" />
      <line x1="8.5" y1="12.5" x2="13" y2="12.5" />
    </svg>
  )
}

export function IconMe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 19c1.4-2.8 3.6-4.2 6.5-4.2s5.1 1.4 6.5 4.2" />
    </svg>
  )
}

export function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 6 8.5 12l6 6" />
    </svg>
  )
}

export function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </svg>
  )
}

export function IconImage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="8.8" cy="9.5" r="1.3" />
      <path d="m5.5 17 4.2-4.2 2.8 2.6 3.5-3.6 2.5 2.7" />
    </svg>
  )
}

export function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />
    </svg>
  )
}

const TINT_PALETTE = ['#6b4a32', '#8d3d22', '#23423d', '#3c3a52', '#8a6232']

export function fallbackPhoto(seedKey = 'default'): string {
  const palettes: Record<string, [string, string, string]> = {
    'lin-morning': ['#2c221b', '#8c6244', '#d8c2a8'],
    'lin-dusk': ['#1c1d29', '#6e4538', '#c99372'],
    'lin-desk': ['#211f1c', '#574e44', '#b8afa2'],
    'lin-cat': ['#191715', '#4a3b31', '#9e8876'],
    'lin-rain': ['#161c20', '#35454d', '#7b8d94'],
    'noah-river': ['#142220', '#2e524b', '#8ca89f'],
    'noah-lunch': ['#1f261c', '#4b5e41', '#a5b596'],
    'noah-plant': ['#18211b', '#384f3e', '#869c89'],
    'noah-bus': ['#14161c', '#2f3747', '#7b8496'],
    'me-noodles': ['#261b14', '#6e472b', '#c7a27e'],
    'me-path': ['#241e15', '#6b5735', '#bfa97e'],
    'zhou-books': ['#181621', '#3b3652', '#8f88a8'],
    'zhou-coffee': ['#1a1512', '#47362b', '#967e6e'],
    'zhou-lane': ['#17191c', '#383e47', '#838b96'],
    'mina-citrus': ['#261c12', '#8a5a28', '#deb478'],
    'mina-curtain': ['#211f1b', '#665e50', '#cfc6b6'],
    hero: ['#171412', '#4f3829', '#b5967d'],
  }
  const match = Object.keys(palettes).find((k) => seedKey.includes(k))
  const [c1, c2, c3] = match ? palettes[match] : ['#1a1816', '#4a433b', '#9e9488']
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="58%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#g)"/>
    <circle cx="580" cy="280" r="190" fill="${c3}" fill-opacity="0.18"/>
    <rect x="72" y="120" width="656" height="760" fill="none" stroke="${c3}" stroke-opacity="0.2" stroke-width="1"/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function Avatar({
  initial,
  tint,
  large = false,
}: {
  initial: string
  tint?: string
  large?: boolean
}) {
  const code = initial.codePointAt(0) ?? 0
  const resolvedTint = tint || TINT_PALETTE[code % TINT_PALETTE.length]
  return (
    <span
      className={large ? 'avatar lg' : 'avatar'}
      style={{ backgroundColor: resolvedTint }}
      aria-hidden
    >
      {initial}
    </span>
  )
}

export function Photo({
  image,
  alt,
  className,
  onClick,
}: {
  image?: string
  alt: string
  className?: string
  onClick?: () => void
}) {
  const src = useImage(image)
  if (!src) return <span className={`ph ${className ?? ''}`} />
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const fallback = fallbackPhoto(image || alt)
    if (event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback
    }
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <img src={src} alt={alt} draggable={false} onError={handleError} onLoad={markLoaded} ref={markIfComplete} />
      </button>
    )
  }
  return <img src={src} alt={alt} className={className} draggable={false} onError={handleError} onLoad={markLoaded} ref={markIfComplete} />
}

/** Flags a photo once its pixels are ready so motion.css can fade it in. */
function markLoaded(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = ''
}
function markIfComplete(el: HTMLImageElement | null) {
  if (el && el.complete && el.naturalWidth > 0) el.dataset.loaded = ''
}

export function Back({ fallback = '/home', light = false }: { fallback?: string; light?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={light ? 'icon-btn solid' : 'icon-btn'}
      aria-label="返回"
      onClick={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate(fallback)
      }}
    >
      <IconBack />
    </button>
  )
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}

export function Dialog({
  title,
  body,
  confirm,
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string
  body?: string
  confirm: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="dialog-back" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id="dialog-title">{title}</h2>
          {body ? <p>{body}</p> : null}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            再想想
          </button>
          <button
            ref={ref}
            type="button"
            className={danger ? 'btn danger-fill' : 'btn'}
            onClick={onConfirm}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toaster() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <span className="toast-dot" aria-hidden />
      <span>{toast.text}</span>
    </div>
  )
}

export function LockScroll() {
  useEffect(() => {
    document.documentElement.classList.add('lock')
    window.scrollTo(0, 0)
    return () => document.documentElement.classList.remove('lock')
  }, [])
  return null
}

export function FitViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    const viewport = window.visualViewport
    if (!node || !viewport) return
    const sync = () => {
      node.style.height = `${viewport.height}px`
      node.style.transform = viewport.offsetTop ? `translateY(${viewport.offsetTop}px)` : ''
    }
    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
    }
  }, [])
  return (
    <div ref={ref} className="stack fit-viewport">
      {children}
    </div>
  )
}
