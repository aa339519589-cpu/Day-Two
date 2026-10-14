import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconChat, IconDaily, IconHome, IconMe } from './ui'

const items = [
  { to: '/home', label: '席位', icon: IconHome },
  { to: '/daily', label: '日常', icon: IconDaily },
  { to: '/messages', label: '来往', icon: IconChat },
  { to: '/me', label: '档案', icon: IconMe },
]

export function Shell() {
  const { pathname } = useLocation()
  const isDaily = pathname.startsWith('/daily')

  return (
    <div className={`device shell${isDaily ? ' shell-darkroom' : ''}`}>
      <div className="stage">
        <Outlet />
      </div>
      <nav className="nav" aria-label="主导航">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'on' : undefined)}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
