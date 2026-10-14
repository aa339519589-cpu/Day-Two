import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { useImage } from '../images'
import { decideDir, formatWhen } from '../logic'
import { useStore } from '../store'
import type { Moment } from '../types'
import { Avatar, Dialog, IconBack, IconPlus, LockScroll, fallbackPhoto, useTitle } from '../ui'

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
    () =>
      data.moments
        .filter((moment) => moment.authorId === personId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.moments, personId],
  )
  const focus = params.get('m')
  const [index, setIndex] = useState(() => {
    const found = list.findIndex((moment) => moment.id === focus)
    return found < 0 ? 0 : found
  })
  const safeIndex = list.length === 0 ? 0 : Math.min(index, list.length - 1)
  const [confirm, setConfirm] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const reelRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(safeIndex)
  const listRef = useRef(list)
  const anim = useRef(false)
  indexRef.current = safeIndex
  listRef.current = list

  const name = isMe ? data.me.name : person?.name
  const city = isMe ? data.me.city : person?.city
  const initial = isMe ? data.me.name?.[0] || '我' : person?.initial || '·'
  const tint = isMe ? data.me.tint : person?.tint
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
        [
          { transform: 'translate3d(0,0,0)' },
          { transform: `translate3d(0, ${dir === 1 ? -16 : 16}px, 0)` },
          { transform: 'translate3d(0,0,0)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(next)
      return
    }
    anim.current = true
    const height = stage.clientHeight
    reel.style.transition = 'transform 360ms cubic-bezier(.22,.84,.28,1)'
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
    const drag = { startY: 0, lastY: 0, lastT: 0, dy: 0, vy: 0, active: false, moved: false }
    const onDown = (event: PointerEvent) => {
      if (anim.current) return
      const target = event.target as HTMLElement
      if (target.closest('button, a')) return
      drag.active = true
      drag.moved = false
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
      if (Math.abs(drag.dy) > 8) drag.moved = true
      const count = listRef.current.length
      const current = indexRef.current
      let offset = drag.dy
      if ((current === 0 && offset > 0) || (current === count - 1 && offset < 0)) offset *= 0.28
      const reel = reelRef.current
      if (!reel) return
      reel.style.transition = 'none'
      reel.style.transform = `translate3d(0, ${offset}px, 0)`
    }
    const onUp = () => {
      if (!drag.active) return
      drag.active = false
      if (!drag.moved && Math.abs(drag.dy) < 6) {
        setImmersive((prev) => !prev)
        return
      }
      const height = stage.clientHeight
      const dir = decideDir(drag.dy, drag.vy, height, indexRef.current, listRef.current.length)
      if (dir === 0) {
        const reel = reelRef.current
        if (!reel) return
        reel.style.transition = 'transform 260ms cubic-bezier(.22,.84,.28,1)'
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
        <button type="button" className="btn" style={{ marginTop: 20 }} onClick={() => navigate('/home')}>
          回席位
        </button>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="stack page">
        <h1>{person?.name}</h1>
        <p className="lede">你们目前不在彼此的席位中，不过过往说过的话，仍然留着。</p>
        <button type="button" className="btn" style={{ marginTop: 24 }} onClick={() => navigate(`/chat/${personId}`)}>
          查看聊天记录
        </button>
      </div>
    )
  }

  const current = list[safeIndex]
  const prev = list[safeIndex - 1]
  const next = list[safeIndex + 1]

  return (
    <div className={`theater${immersive ? ' is-immersive' : ''}`} ref={stageRef}>
      <LockScroll />
      {list.length === 0 ? (
        <div className="reel-empty">
          <button
            type="button"
            className="icon-btn solid"
            aria-label="返回"
            style={{ position: 'absolute', top: 'calc(14px + var(--safe-t))', left: 16 }}
            onClick={() => navigate(isMe ? '/daily' : '/home')}
          >
            <IconBack />
          </button>
          <p className="eyebrow">{isMe ? '你的日常' : `${name} 的日常`}</p>
          <h2>{isMe ? '还没有记下日常' : `${name}还没有日常`}</h2>
          {isMe && (
            <button type="button" className="btn light-ink" style={{ marginTop: 18 }} onClick={() => navigate('/compose')}>
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
            <button
              type="button"
              className="icon-btn solid"
              aria-label="返回"
              onClick={() => {
                if (window.history.length > 1) navigate(-1)
                else navigate(isMe ? '/daily' : `/friend/${personId}`)
              }}
            >
              <IconBack />
            </button>
            <button
              type="button"
              className="feed-top-identity"
              onClick={() => navigate(isMe ? '/me' : `/friend/${personId}`)}
            >
              <Avatar initial={initial} tint={tint} />
              <div className="feed-top-copy">
                <strong>{name}</strong>
                <span>{city ? `${city} · 日常胶片` : '日常胶片'}</span>
              </div>
            </button>
            {isMe && (
              <button
                type="button"
                className="compose-trigger"
                aria-label="记下今天"
                onClick={() => navigate('/compose')}
              >
                <IconPlus />
                <span>记下</span>
              </button>
            )}
          </header>
          {current && (
            <footer className="feed-bottom">
              <div className="feed-editorial">
                <div className="feed-meta-line">
                  <time>{formatWhen(current.createdAt)}</time>
                  <span className="feed-counter" aria-live="polite">
                    {String(safeIndex + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
                  </span>
                </div>
                {current.caption && <p className="cap">{current.caption}</p>}
                <div className="feed-actions-bar">
                  {!isMe && (
                    <button
                      type="button"
                      className="reel-action primary"
                      onClick={() => navigate(`/chat/${personId}?moment=${current.id}`)}
                    >
                      回应这张照片
                    </button>
                  )}
                  {isMe && (
                    <button type="button" className="reel-action primary" onClick={() => navigate('/compose')}>
                      再记一张
                    </button>
                  )}
                  {isMe && current.mine && (
                    <button type="button" className="reel-action subtle" onClick={() => setConfirm(true)}>
                      移除
                    </button>
                  )}
                  <span className="swipe-cue">↑ 上滑下一张</span>
                </div>
              </div>
            </footer>
          )}
        </>
      )}
      {confirm && current && (
        <Dialog
          title="移除这张照片"
          body="移除后将不再出现在你的日常中。"
          confirm="确认移除"
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
        <div className="slide-frame">
          <img
            className="fit"
            src={src}
            alt={place === 'current' ? moment.caption || '日常照片' : ''}
            draggable={false}
            onError={(e) => {
              const fb = fallbackPhoto(moment.image)
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb
            }}
          />
        </div>
      ) : (
        <div className="ph-full" />
      )}
    </div>
  )
}
