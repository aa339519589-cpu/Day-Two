import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, PersonAvatar, SeatMeter, Wordmark, type IconName } from './components/Elements'
import { activePulses } from './pulse'
import { useStore } from './store'

const items: { to: string; label: string; icon: IconName }[] = [
  { to: '/home', label: '朋友', icon: 'friends' }, { to: '/daily', label: '日常', icon: 'photo' },
  { to: '/messages', label: '消息', icon: 'chat' }, { to: '/me', label: '我的', icon: 'me' },
]

/** Right-hand column on wide screens: the three seats and who is waiting. */
function SideRail() {
  const navigate = useNavigate()
  const { data, today } = useStore()
  const pulses = activePulses(data, today)
  const requests = data.relations.filter(r => r.status === 'incoming')
  return <aside className="side-rail" aria-label="席位概览">
    <section className="rail-card">
      <header><h2>你的三个席位</h2><SeatMeter used={pulses.length} pending={0}/></header>
      {pulses.map(p => <button type="button" key={p.person.id} className="rail-row" onClick={() => navigate(`/chat/${p.person.id}`)}>
        <PersonAvatar id={p.person.id} size="small" ring={p.waiting}/>
        <span><strong>{p.person.name}</strong><small className={p.waiting || p.opener ? 'hot' : ''}>{p.line}</small></span>
      </button>)}
      {Array.from({ length: 3 - pulses.length }, (_, i) => <div key={i} className="rail-row empty"><span className="rail-empty"><Icon name="plus" size={16}/></span><span><strong>空席位</strong><small>只留给愿意继续聊下去的人</small></span></div>)}
    </section>
    {requests.length > 0 && <section className="rail-card">
      <header><h2>好友请求</h2></header>
      {requests.map(r => { const person = data.people.find(p => p.id === r.personId); return person && <button type="button" key={r.personId} className="rail-row" onClick={() => navigate(`/friend/${person.id}`)}>
        <PersonAvatar id={person.id} size="small"/><span><strong>{person.name}</strong><small>{person.city} · {person.interests.slice(0, 2).join('、')}</small></span>
      </button> })}
    </section>}
    <p className="rail-foot">Day Two · 不卖社交，卖深度沟通</p>
  </aside>
}

export function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { data, today } = useStore()
  const waiting = activePulses(data, today).filter(p => p.waiting).length
  const dark = pathname === '/daily'
  return <div className={`device shell${dark ? ' shell-darkroom' : ''}`}>
    <nav className="nav" aria-label="主导航">
      <span className="nav-brand"><Wordmark/></span>
      {items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'on' : undefined}>
        <span className="nav-icon"><Icon name={item.icon} size={24} stroke={1.8}/>{item.to === '/messages' && waiting > 0 && <i className="nav-badge" aria-hidden="true">{waiting}</i>}</span>
        <span className="nav-label">{item.label}</span>
      </NavLink>)}
      <button type="button" className="nav-post" onClick={() => navigate('/compose')}><Icon name="plus" size={20} stroke={2.2}/><span>发布日常</span></button>
    </nav>
    <main className="stage"><Outlet/></main>
    <SideRail/>
  </div>
}
