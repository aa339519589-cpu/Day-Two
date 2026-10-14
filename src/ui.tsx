import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImage } from './images'
import { useStore } from './store'

export function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 10.5 12 5l7 5.5V19a1 1 0 0 1-1 1h-4.2v-5.2H10.2V20H6a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  )
}
export function IconDaily() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18" />
    </svg>
  )
}
export function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 16.5 4 19.5V7.2A2.2 2.2 0 0 1 6.2 5h11.6A2.2 2.2 0 0 1 20 7.2v7.1a2.2 2.2 0 0 1-2.2 2.2H6Z" />
    </svg>
  )
}
export function IconMe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="9" r="3.1" />
      <path d="M6.2 19.2c1.2-2.4 3.2-3.5 5.8-3.5s4.6 1.1 5.8 3.5" />
    </svg>
  )
}
export function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14.5 6.5 8.8 12l5.7 5.5" />
    </svg>
  )
}
export function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  )
}
export function IconImage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.3" />
      <path d="m7 16 3.2-3.2 2.2 2.1L16 11l3 3.2" />
    </svg>
  )
}

export function Avatar({ initial, tint, large = false }: { initial: string; tint: string; large?: boolean }) {
  return (
    <span className={large ? 'avatar lg' : 'avatar'} style={{ background: tint }} aria-hidden>
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
  if (onClick) {
    return <button type="button" className={className} onClick={onClick}><img src={src} alt={alt} draggable={false} /></button>
  }
  return <img src={src} alt={alt} className={className} draggable={false} />
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
  body: string
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
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="dialog-title">{title}</h2>
        <p>{body}</p>
        <div className="stack-btns">
          <button ref={ref} type="button" className={danger ? 'btn danger' : 'btn'} onClick={onConfirm}>
            {confirm}
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            再想想
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
      {toast.text}
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
    <div ref={ref} className="stack">
      {children}
    </div>
  )
}
