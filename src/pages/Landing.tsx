import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useStore } from '../store'
import { fallbackPhoto, useTitle } from '../ui'

export function LandingPage() {
  const { data, onboard } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(data.me.name || '阿南')
  useTitle(BRAND.name)

  const enter = () => {
    if (data.onboarded) {
      navigate('/home')
      return
    }
    setOpen(true)
  }

  return (
    <div className="device gate">
      <img
        src="/photos/hero.jpg"
        alt=""
        onError={(e) => {
          const fb = fallbackPhoto('hero')
          if (e.currentTarget.src !== fb) e.currentTarget.src = fb
        }}
      />
      <div className="gate-veil" />

      <header className="gate-top">
        <span className="gate-brand">{BRAND.name}</span>
        <span className="gate-issue">给三个想继续说话的人</span>
      </header>

      <div className="gate-copy">
        <p className="gate-kicker">{BRAND.tagline}</p>
        <h1>
          第二天，
          <br />
          还想说话。
        </h1>
        <p className="gate-desc">
          只留三个席位。没有信息流广场，没有点赞计数，只把今天发生的一点小事留给真正在意的人。
        </p>

        {open && !data.onboarded ? (
          <form
            className="gate-form"
            onSubmit={(event) => {
              event.preventDefault()
              const trimmed = name.trim()
              if (!trimmed) return
              onboard(trimmed)
              navigate('/home')
            }}
          >
            <input
              value={name}
              maxLength={16}
              placeholder="朋友怎么称呼你？"
              aria-label="你的名字"
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <button className="btn gate-submit" type="submit" disabled={!name.trim()}>
              进入
            </button>
          </form>
        ) : (
          <button type="button" className="btn gate-enter" onClick={enter}>
            {data.onboarded ? '进入席位' : '开始使用'}
          </button>
        )}
      </div>
    </div>
  )
}
