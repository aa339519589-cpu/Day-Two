import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Icon, Wordmark } from '../components/Elements'

export function LandingPage() {
  const { data, onboard } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  useTitle('第二天 · Day Two')
  if (data.onboarded) return <Navigate to="/home" replace/>
  return <main className="gate">
    <Photo image="/photos/hero.jpg" alt="窗边的日常"/><span className="gate-shade"/>
    <header className="gate-brand"><Wordmark/></header>
    <div className="gate-content">
      <p className="gate-kicker"><span>昨天聊得很好</span></p>
      <h1>第二天，<br/>还想和你说话。</h1>
      <ul className="gate-points" aria-label="Day Two 怎么用">
        <li><b className="num">3</b><span>个席位，只留给愿意继续的人</span></li>
        <li><b className="num">1</b><span>张照片一天，从它开始聊</span></li>
      </ul>
      <form className="gate-form" onSubmit={e => { e.preventDefault(); if (name.trim()) { onboard(name); navigate('/home') } }}>
        <label className="sr-only" htmlFor="welcome-name">你的名字</label>
        <input id="welcome-name" value={name} onChange={e => setName(e.target.value)} maxLength={16} placeholder="你的名字" autoComplete="nickname" enterKeyHint="go"/>
        <button type="submit" disabled={!name.trim()} aria-label="开始体验"><Icon name="chevron" size={22} stroke={2}/></button>
      </form>
      <span className="demo-label">本地体验 · 数据只保存在这台设备</span>
    </div>
  </main>
}
