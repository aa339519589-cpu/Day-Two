import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { initialOf } from '../logic'
import { Photo } from '../ui'

export type IconName = 'friends' | 'photo' | 'chat' | 'me' | 'plus' | 'back' | 'close' | 'arrow' | 'more' | 'expand' | 'check' | 'sun' | 'moon' | 'system' | 'edit' | 'camera' | 'chevron'
const paths: Record<IconName, ReactNode> = {
  friends: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></>,
  photo: <><rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="9" cy="8" r="1.5"/><path d="m4 16 5-5 4 4 3-3 4 4"/></>,
  chat: <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2 1.6-5A8 8 0 1 1 20 11.5Z"/>,
  me: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, back: <path d="m14.5 5-7 7 7 7"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>, arrow: <path d="M12 19V5m-6 6 6-6 6 6"/>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>,
  system: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></>,
  edit: <><path d="m14 5 5 5M4 20l5-1L20 8a2.1 2.1 0 0 0-5-5L4 14v6Z"/></>,
  camera: <><path d="M8 5 10 3h4l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="4"/></>,
  chevron: <path d="m9 6 6 6-6 6"/>,
}
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
export function Mark() {
  return <svg className="brand-mark" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 5.5h7a9.5 9.5 0 0 1 0 19H6Z" fill="currentColor"/><path d="M15 5.5h2a9.5 9.5 0 0 1 0 19h-2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
export function PersonAvatar({ id, size = 'normal' }: { id: string; size?: 'small' | 'normal' | 'large' }) {
  const { data } = useStore()
  const person = id === 'me' ? data.me : data.people.find(p => p.id === id)
  const image = data.moments.filter(m => m.authorId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]?.image
  return <span className={`person-avatar ${size}`} aria-hidden="true">{image ? <Photo image={image} alt=""/> : initialOf(person?.name || '')}</span>
}
export function BackButton({ to = '/home' }: { to?: string }) {
  const navigate = useNavigate()
  return <button className="icon-button" type="button" aria-label="返回" onClick={() => { if (window.history.state?.idx > 0) navigate(-1); else navigate(to) }}><Icon name="back"/></button>
}
export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => { dialog?.close(); previous?.focus() }
  }, [])
  return createPortal(<dialog className="sheet" ref={ref} aria-label={title} onCancel={e => { e.preventDefault(); close.current() }} onClick={e => {
    if (e.target !== e.currentTarget) return
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) close.current()
  }}>
    <header className="sheet-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="关闭" onClick={onClose}><Icon name="close"/></button></header>
    <div className="sheet-content">{children}</div>
  </dialog>, document.body)
}
export function Empty({ text, children }: { text: string; children?: ReactNode }) {
  return <div className="empty-state"><Icon name="photo" size={32}/><p>{text}</p>{children}</div>
}
