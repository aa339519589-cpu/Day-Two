import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useStore } from '../store'
import { useTitle } from '../ui'

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
      <img src="/photos/hero.jpg" alt="" />
      <div className="gate-veil" />
      <div className="gate-copy">
        <p className="eyebrow">{BRAND.name}</p>
        <h1>
          第二天，
          <br />
          还想说话。
        </h1>
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
              aria-label="你的名字"
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <button className="btn" type="submit" disabled={!name.trim()}>
              好
            </button>
          </form>
        ) : (
          <button type="button" className="btn" onClick={enter}>
            {data.onboarded ? '进去' : '进来'}
          </button>
        )}
      </div>
    </div>
  )
}
