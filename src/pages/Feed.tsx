import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { useImage } from '../images'
import { decideDir } from '../logic'
import { useStore } from '../store'
import type { Moment } from '../types'
import { Dialog, IconBack, LockScroll, useTitle } from '../ui'

export function FeedPage() {
  const { personId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data, removeMoment } = useStore()
  const person = data.people.find((item) => item.id === personId)
  const relation = data.relations.find((item) => item.personId === personId)
  const isMe = personId === 'me'
  const blocked = !isMe && relation?.status !== 'active'
  const list = useMemo(
    () => data.moments.filter((moment) => moment.authorId === personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.moments, personId],
  )
  const focus = params.get('m')
  const [index, setIndex] = useState(() => {
    const found = list.findIndex((moment) => moment.id === focus)
    return found < 0 ? 0 : found
  })
  const safeIndex = list.length === 0 ? 0 : Math.min(index, list.length - 1)
  const [confirm, setConfirm] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const reelRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(safeIndex)
  const listRef = useRef(list)
  const anim = useRef(false)
  indexRef.current = safeIndex
  listRef.current = list

  const name = isMe ? data.me.name : person?.name
  useTitle(name ? `${name}的日常 · ${BRAND.name}` : BRAND.name)

  useLayoutEffect(() => {
    const reel = reelRef.current
    if (!reel) return
    reel.style.transition = 'none'
    reel.style.transform = 'translate3d(0,0,0)'
    anim.current = false
  }, [safeIndex])

  useEffect(() => {
    const node = stageRef.current
    const viewport = window.visualViewport
    if (!node || !viewport) return
    const sync = () => {
      node.style.height = `${viewport.height}px`
    }
    sync()
    viewport.addEventListener('resize', sync)
    return () => viewport.removeEventListener('resize', sync)
  }, [])

  const go = (dir: -1 | 1) => {
    const count = listRef.current.length
    const current = indexRef.current
    if (anim.current) return
    const next = current + dir
    const stage = stageRef.current
    const reel = reelRef.current
    if (!stage || !reel) return
    if (next < 0 || next >= count) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      reel.animate(
        [{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(0, ${dir === 1 ? -16 : 16}px, 0)` }, { transform: 'translate3d(0,0,0)' }],
        { duration: 260, easing: 'ease-out' },
      )
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(next)
      return
    }
    anim.current = true
    const height = stage.clientHeight
    reel.style.transition = 'transform 340ms cubic-bezier(.22,.84,.28,1)'
    reel.style.transform = `translate3d(0, ${dir === 1 ? -height : height}px, 0)`
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      reel.removeEventListener('transitionend', finish)
      setIndex(next)
    }
    const timer = window.setTimeout(finish, 420)
    reel.addEventListener('transitionend', finish)
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || blocked) return
    const drag = { startY: 0, lastY: 0, lastT: 0, dy: 0, vy: 0, active: false }
    const onDown = (event: PointerEvent) => {
      if (anim.current) return
      const target = event.target as HTMLElement
      if (target.closest('button, a')) return
      drag.active = true
      drag.startY = drag.lastY = event.clientY
      drag.lastT = performance.now()
      drag.dy = 0
      drag.vy = 0
      stage.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (!drag.active || anim.current) return
      const now = performance.now()
      drag.vy = (event.clientY - drag.lastY) / Math.max(1, now - drag.lastT)
      drag.lastY = event.clientY
      drag.lastT = now
      drag.dy = event.clientY - drag.startY
      const count = listRef.current.length
      const current = indexRef.current
      let offset = drag.dy
      if ((current === 0 && offset > 0) || (current === count - 1 && offset < 0)) offset *= 0.32
      const reel = reelRef.current
      if (!reel) return
      reel.style.transition = 'none'
      reel.style.transform = `translate3d(0, ${offset}px, 0)`
    }
    const onUp = () => {
      if (!drag.active) return
      drag.active = false
      const height = stage.clientHeight
      const dir = decideDir(drag.dy, drag.vy, height, indexRef.current, listRef.current.length)
      if (dir === 0) {
        const reel = reelRef.current
        if (!reel) return
        reel.style.transition = 'transform 280ms cubic-bezier(.22,.84,.28,1)'
        reel.style.transform = 'translate3d(0,0,0)'
        return
      }
      go(dir)
    }
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onUp)
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (Math.abs(event.deltaY) < 8) return
      go(event.deltaY > 0 ? 1 : -1)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        go(1)
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        go(-1)
      }
      if (event.key === 'Escape') navigate(isMe ? '/daily' : `/friend/${personId}`)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      stage.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [blocked, isMe, navigate, personId])

  if (!isMe && !person) {
    return (
      <div className="stack page">
        <h1>没有这个人</h1>
        <button type="button" className="btn" onClick={() => navigate('/home')}>
          回首页
        </button>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="stack page">
        <h1>{person?.name}</h1>
        <button type="button" className="btn" style={{ marginTop: 18 }} onClick={() => navigate(`/chat/${personId}`)}>
          聊天记录
        </button>
      </div>
    )
  }

  const current = list[safeIndex]
  const prev = list[safeIndex - 1]
  const next = list[safeIndex + 1]

  return (
    <div className="theater" ref={stageRef}>
      <LockScroll />
      {list.length === 0 ? (
        <div className="page">
          <button type="button" className="icon-btn solid" aria-label="返回" onClick={() => navigate(isMe ? '/daily' : '/home')}>
            <IconBack />
          </button>
          <h1 style={{ marginTop: 24 }}>{isMe ? '日常' : name}</h1>
          {isMe && (
            <button type="button" className="btn" style={{ marginTop: 18 }} onClick={() => navigate('/compose')}>
              记下今天
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="reel" ref={reelRef}>
            {prev ? <Slide moment={prev} place="prev" /> : <div className="slide prev" />}
            {current && <Slide moment={current} place="current" />}
            {next ? <Slide moment={next} place="next" /> : <div className="slide next" />}
          </div>
          <header className="feed-top">
            <button type="button" className="icon-btn solid" aria-label="返回" onClick={() => navigate(-1)}>
              <IconBack />
            </button>
            <div className="grow">
              <strong>{name}</strong>
            </div>
          </header>
          {current && (
            <footer className="feed-bottom">
              {current.caption && <p className="cap">{current.caption}</p>}
              <div className="feed-meta">
                <span className="feed-count" aria-live="polite">
                  {safeIndex + 1} / {list.length}
                </span>
              </div>
              <div className="row">
                {!isMe && (
                  <button type="button" className="btn" onClick={() => navigate(`/chat/${personId}?moment=${current.id}`)}>
                    回应这张
                  </button>
                )}
                {isMe && current.mine && (
                  <button type="button" className="btn" onClick={() => setConfirm(true)}>
                    移除
                  </button>
                )}
                {isMe && !current.mine && (
                  <button type="button" className="btn" onClick={() => navigate('/compose')}>
                    再记一张
                  </button>
                )}
              </div>
            </footer>
          )}
        </>
      )}
      {confirm && current && (
        <Dialog
          title="移除这张"
          confirm="移除"
          danger
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            void removeMoment(current.id)
            setConfirm(false)
          }}
        />
      )}
    </div>
  )
}

function Slide({ moment, place }: { moment: Moment; place: 'prev' | 'current' | 'next' }) {
  const src = useImage(moment.image)
  return (
    <div className={`slide ${place}`}>
      {src ? (
        <>
          <img className="blur" src={src} alt="" draggable={false} />
          <img className="fit" src={src} alt={place === 'current' ? moment.caption || '日常照片' : ''} draggable={false} />
        </>
      ) : (
        <div className="ph-full" />
      )}
    </div>
  )
}
