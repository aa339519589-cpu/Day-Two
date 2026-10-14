import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { formatWhen } from '../logic'
import { LockScroll, Photo, useTitle } from '../ui'
import { BackButton, Icon, PersonAvatar, Sheet } from './Elements'

export function PhotoStream({ personId, inShell = false }: { personId?: string; inShell?: boolean }) {
  const { data, removeMoment, showToast } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const focus = params.get('m')
  const [filter, setFilter] = useState('all')
  const [index, setIndex] = useState(0)
  const [clean, setClean] = useState(false)
  const [full, setFull] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const position = useRef(0)
  const pointer = useRef({x: 0, y: 0, moved: false})
  const friends = useMemo(() => data.people.filter(p => data.relations.some(r => r.personId === p.id && r.status === 'active')), [data.people, data.relations])
  const blocked = !!personId && personId !== 'me' && !friends.some(p => p.id === personId)
  const chosen = personId || filter
  const list = useMemo(() => data.moments.filter(m =>
    !blocked && (m.authorId === 'me' || friends.some(p => p.id === m.authorId)) && (chosen === 'all' || m.authorId === chosen)
  ).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [data.moments, friends, chosen, blocked])
  const ids = list.map(m => m.id).join(',')
  const count = useRef(list.length)
  count.current = list.length
  const safe = Math.min(index, Math.max(0, list.length-1))
  const current = list[safe]
  const author = current?.authorId === 'me' ? data.me : data.people.find(p => p.id === current?.authorId)
  const name = personId === 'me' ? '我的日常' : data.people.find(p => p.id === personId)?.name || '日常'
  useTitle(`${name} · Day Two`)

  useLayoutEffect(() => {
    const node = rail.current
    const found = focus ? list.findIndex(m => m.id === focus) : -1
    const next = found < 0 ? 0 : found
    position.current = next
    setIndex(next)
    if (node) node.scrollTop = next * node.clientHeight
    setFull(false)
    // The list is represented by IDs so unrelated chat/profile changes do not reset a photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, focus, ids])
  useEffect(() => {
    document.documentElement.classList.toggle('immersive-reel', inShell && clean)
    return () => document.documentElement.classList.remove('immersive-reel')
  }, [clean, inShell])
  useEffect(() => {
    const node = rail.current
    if (!node) return
    let frame = 0
    let wheelSum = 0
    let wheelLock = false
    let wheelTimer = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = Math.max(0, Math.min(count.current - 1, Math.round(node.scrollTop / Math.max(1, node.clientHeight))))
        position.current = next
        setIndex(next)
      })
    }
    const go = (dir: number) => {
      const next = Math.max(0, Math.min(count.current - 1, position.current + dir))
      node.scrollTo({top: next * node.clientHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'})
    }
    const onWheel = (e: WheelEvent) => {
      if (document.querySelector('dialog[open]') || e.ctrlKey) return
      e.preventDefault()
      clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => {wheelLock = false;wheelSum = 0}, 180)
      if (wheelLock) return
      wheelSum += e.deltaY
      if (Math.abs(wheelSum) < 18) return
      wheelLock = true
      go(wheelSum > 0 ? 1 : -1)
    }
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || (e.target as HTMLElement).closest('input,textarea,button,a,select')) return
      if (['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)) {
        e.preventDefault()
        go(e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1)
      }
      if (e.key === 'Escape') setClean(false)
    }
    const observer = new ResizeObserver(() => {node.scrollTop = position.current * node.clientHeight})
    observer.observe(node)
    node.addEventListener('scroll', sync, {passive:true})
    node.addEventListener('wheel', onWheel, {passive:false})
    window.addEventListener('keydown', onKey)
    return () => {observer.disconnect();cancelAnimationFrame(frame);clearTimeout(wheelTimer);node.removeEventListener('scroll',sync);node.removeEventListener('wheel',onWheel);window.removeEventListener('keydown',onKey)}
  }, [blocked, list.length > 0])
  useEffect(() => {
    const viewport = window.visualViewport
    const node = stage.current
    if (!viewport || !node || inShell) return
    const sync = () => {node.style.height = `${viewport.height}px`;node.style.top = `${viewport.offsetTop}px`}
    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {viewport.removeEventListener('resize',sync);viewport.removeEventListener('scroll',sync)}
  }, [inShell])

  return <section className={`photo-stage${inShell ? ' in-shell' : ' standalone'}${clean ? ' chrome-hidden' : ''}${full ? ' show-full' : ''}`} ref={stage} data-current-id={current?.id}>
    <LockScroll/>
    {list.length > 0 ? <div ref={rail} className="photo-rail" tabIndex={0} aria-label="日常照片" onPointerDown={e => {pointer.current={x:e.clientX,y:e.clientY,moved:false}}} onPointerMove={e => {if (Math.abs(e.clientY-pointer.current.y)>8 || Math.abs(e.clientX-pointer.current.x)>8) pointer.current.moved=true}} onClick={() => {if (!pointer.current.moved) setClean(v => !v)}}>
      {list.map((moment, i) => <article key={moment.id} className="photo-slide" aria-hidden={i !== safe}><Photo image={moment.image} alt={i === safe ? moment.caption || '日常照片' : ''}/></article>)}
    </div> : <div className="photo-empty"><Icon name="photo" size={40}/><h2>{blocked ? '还不是好友' : '还没有照片'}</h2><button type="button" className="small-button" onClick={() => navigate(blocked ? `/friend/${personId}` : '/compose')}>{blocked ? '查看资料' : '分享照片'}</button></div>}
    <header className="photo-top photo-chrome">
      {inShell ? <div className="photo-filters" aria-label="按好友筛选"><button type="button" className={filter === 'all' ? 'selected' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>全部</button>{friends.map(p => <button type="button" key={p.id} className={filter === p.id ? 'selected' : ''} aria-pressed={filter === p.id} onClick={() => setFilter(p.id)}>{p.name}</button>)}<button type="button" className={filter === 'me' ? 'selected' : ''} aria-pressed={filter === 'me'} onClick={() => setFilter('me')}>我</button></div> : <><BackButton to="/daily"/><span className="photo-page-name">{name}</span></>}
      <button type="button" className="icon-button" aria-label="分享日常" onClick={() => navigate('/compose')}><Icon name="plus"/></button>
    </header>
    {current && author && <footer className="photo-bottom photo-chrome">
      <div className="photo-byline"><button type="button" className="photo-author" onClick={() => navigate(current.authorId === 'me' ? '/me' : `/friend/${current.authorId}`)}><PersonAvatar id={current.authorId} size="small"/><span><strong>{current.authorId === 'me' ? '我' : author.name}</strong><time>{formatWhen(current.createdAt)}</time></span></button><span className="photo-counter" aria-live="polite">{safe+1} / {list.length}</span></div>
      {current.caption && <p className="photo-caption">{current.caption}</p>}
      <div className="photo-tools">{current.authorId === 'me' ? <button type="button" className="photo-reply" onClick={() => navigate('/compose')}><span>再分享一张</span><Icon name="plus" size={19}/></button> : <button type="button" className="photo-reply" onClick={() => navigate(`/chat/${current.authorId}?moment=${encodeURIComponent(current.id)}`)}><span>说点什么…</span><Icon name="arrow" size={18}/></button>}<button className="icon-button" type="button" aria-label={full ? '填满屏幕' : '查看完整照片'} aria-pressed={full} onClick={() => setFull(v => !v)}><Icon name="expand"/></button>{current.mine && <button className="icon-button" type="button" aria-label="照片选项" onClick={() => setDeleting(true)}><Icon name="more"/></button>}</div>
    </footer>}
    {deleting && current && <Sheet title="照片" onClose={() => {if (!busy) setDeleting(false)}}><button className="settings-row danger-text" type="button" disabled={busy} onClick={async () => {setBusy(true);try {await removeMoment(current.id);setDeleting(false)} catch {showToast('删除失败，请重试')} finally {setBusy(false)}}}>{busy ? '删除中…' : '删除这张照片'}</button></Sheet>}
  </section>
}
