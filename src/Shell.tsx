import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, Mark, type IconName } from './components/Elements'
import { activePulses } from './pulse'
import { useStore } from './store'

const items: { to: string; label: string; icon: IconName }[] = [
  { to: '/home', label: '朋友', icon: 'friends' }, { to: '/daily', label: '日常', icon: 'photo' },
  { to: '/messages', label: '消息', icon: 'chat' }, { to: '/me', label: '我的', icon: 'me' },
]

export function Shell() {
  const { pathname } = useLocation()
  const { data, today } = useStore()
  const waiting = activePulses(data, today).filter(p => p.waiting).length
  const dark = pathname === '/daily'
  return <div className={`device shell${dark ? ' shell-darkroom' : ''}`}>
    <main className="stage"><Outlet/></main>
    <nav className="nav" aria-label="主导航">
      <span className="nav-brand"><Mark/></span>
      {items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'on' : undefined}>
        <span className="nav-icon"><Icon name={item.icon} size={23} stroke={1.6}/>{item.to === '/messages' && waiting > 0 && <i className="nav-badge" aria-hidden="true">{waiting}</i>}</span>
        <span className="nav-label">{item.label}</span>
      </NavLink>)}
    </nav>
  </div>
}
