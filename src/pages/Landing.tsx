import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Mark, Icon } from '../components/Elements'
export function LandingPage() {
  const { data, onboard } = useStore()
  const navigate = useNavigate()
  const [name,setName] = useState('')
  useTitle('第二天 · Day Two')
  if (data.onboarded) return <Navigate to="/home" replace/>
  return <main className="gate"><Photo image="/photos/hero.jpg" alt="窗边的日常"/><span className="gate-shade"/>
    <header className="gate-brand"><Mark/><span>Day Two</span></header>
    <div className="gate-content"><h1>第二天<span>还想见你。</span></h1><form className="gate-form" onSubmit={e => {e.preventDefault(); if (name.trim()) {onboard(name);navigate('/home')}}}><label className="sr-only" htmlFor="welcome-name">你的名字</label><input id="welcome-name" value={name} onChange={e => setName(e.target.value)} maxLength={16} placeholder="你的名字" autoComplete="nickname"/><button type="submit" disabled={!name.trim()} aria-label="开始体验"><Icon name="arrow"/></button></form><span className="demo-label">本地体验</span></div>
  </main>
}
