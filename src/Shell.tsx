import { NavLink, Outlet } from 'react-router-dom'
import { IconChat, IconDaily, IconHome, IconMe } from './ui'

const items = [
  { to: '/home', label: '首页', icon: IconHome },
  { to: '/daily', label: '日常', icon: IconDaily },
  { to: '/messages', label: '消息', icon: IconChat },
  { to: '/me', label: '我的', icon: IconMe },
]

export function Shell() {
  return (
    <div className="device shell">
      <div className="stage">
        <Outlet />
      </div>
      <nav className="nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'on' : undefined)}>
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
