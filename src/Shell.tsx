import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, Mark, type IconName } from './components/Elements'
const items: {to: string; label: string; icon: IconName}[] = [
  {to:'/home', label:'朋友', icon:'friends'}, {to:'/daily', label:'日常', icon:'photo'},
  {to:'/messages', label:'消息', icon:'chat'}, {to:'/me', label:'我的', icon:'me'},
]
export function Shell() {
  const { pathname } = useLocation()
  return <div className={`device shell${pathname === '/daily' ? ' shell-darkroom' : ''}`}>
    <main className="stage"><Outlet/></main>
    <nav className="nav" aria-label="主导航"><span className="nav-brand"><Mark/></span>{items.map(item =>
      <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? 'on' : undefined}><Icon name={item.icon}/><span>{item.label}</span></NavLink>
    )}</nav>
  </div>
}
