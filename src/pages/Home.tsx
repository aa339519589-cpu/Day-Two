import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayKeyFromIso } from '../logic'
import { activePulses, latestMoment, type Pulse } from '../pulse'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Icon, PersonAvatar, SeatMeter, SeatNo, Wordmark } from '../components/Elements'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function SeatCard({ pulse, today }: { pulse: Pulse; today: string }) {
  const navigate = useNavigate()
  const { person, relation, latest, opener, tone, line, days, streak } = pulse
  const fresh = latest && dayKeyFromIso(latest.createdAt) === today
  const toChat = () => navigate(opener && !pulse.waiting ? `/chat/${person.id}?moment=${encodeURIComponent(opener.id)}` : `/chat/${person.id}`)
  const action = pulse.waiting ? '回复' : opener ? '回应这张' : '聊聊'
  return <article className={`friend-window tone-${tone}`}>
    <button type="button" className="seat-photo" aria-label={`看${person.name}的日常`} onClick={() => navigate(`/feed/${person.id}`)}>
      <Photo image={latest?.image} alt={latest?.caption || person.name}/>
      <span className="seat-photo-shade" aria-hidden="true"/>
      <span className="seat-photo-top"><SeatNo slot={relation.slot}/>{fresh && <span className="stamp">今日</span>}</span>
      {latest?.caption && <q className="seat-quote">{latest.caption}</q>}
    </button>
    <div className="seat-body">
      <button type="button" className="seat-id" onClick={() => navigate(`/friend/${person.id}`)}>
        <strong>{person.name}</strong>
        <span className="seat-meta"><span className="num">{days}</span> 天{streak ? <> · 连续 <span className="num">{streak}</span></> : null}</span>
      </button>
      <p className="seat-line"><i aria-hidden="true"/>{line}</p>
      <div className="seat-actions">
        <button type="button" className={`pill${pulse.waiting || opener ? ' ember' : ''}`} aria-label={`${action}：${person.name}`} onClick={toChat}>
          <Icon name={opener && !pulse.waiting ? 'reply' : 'chat'} size={17}/>{action}
        </button>
      </div>
    </div>
  </article>
}

export function HomePage() {
  const { data, today, acceptIncoming, declineIncoming, invite, cancelInvite, simulateAccept } = useStore()
  const navigate = useNavigate()
  useTitle(BRAND.name)
  const pulses = activePulses(data, today)
  const active = pulses.length
  const candidates = data.people.filter(p => !data.relations.some(r => r.personId === p.id && r.status === 'active')).slice(0, 3 - active)
  const empty = Array.from({ length: 3 - active }, (_, i) => candidates[i] ?? null)
  const pending = data.relations.filter(r => r.status === 'incoming' || r.status === 'outgoing').length
  const mine = latestMoment(data, 'me')
  const sharedToday = !!mine && dayKeyFromIso(mine.createdAt) === today
  const now = new Date()
  const urgent = pulses.find(p => p.waiting) ?? pulses.find(p => p.opener)
  const lede = urgent ? (urgent.waiting ? <><b>{urgent.person.name}</b>在等你回</> : <><b>{urgent.person.name}</b>有新的日常</>) : active ? '今天都聊过了' : '三个席位都空着'

  return <section className="home screen">
    <header className="app-top"><Wordmark/><button type="button" className="icon-button" aria-label="分享日常" onClick={() => navigate('/compose')}><Icon name="camera"/></button></header>
    <div className="page-hero">
      <p className="eyebrow">{now.getMonth() + 1}月{now.getDate()}日 · 星期{WEEK[now.getDay()]}</p>
      <div className="hero-row"><h1>朋友</h1><SeatMeter used={active} pending={Math.min(pending, 3 - active)}/></div>
      <p className="lede">{lede}</p>
    </div>

    <div className={`friend-gallery count-${active}`}>
      {pulses.map(p => <SeatCard key={p.person.id} pulse={p} today={today}/>)}
      {empty.map((person, i) => {
        const slot = active + i
        if (!person) return <div className="empty-seat" key={`empty-${slot}`}><SeatNo slot={slot}/><span>空着的席位</span></div>
        const rel = data.relations.find(r => r.personId === person.id)
        const incoming = rel?.status === 'incoming'
        const outgoing = rel?.status === 'outgoing'
        return <div className={`empty-seat invitation${incoming ? ' is-incoming' : ''}`} key={person.id}>
          <div className="invitation-head"><SeatNo slot={slot}/><span>{incoming ? `想坐进你的第${['一', '二', '三'][slot]}席` : outgoing ? '邀请已发出' : '可以邀请'}</span></div>
          <button type="button" className="invitation-person" onClick={() => navigate(`/friend/${person.id}`)}>
            <PersonAvatar id={person.id}/>
            <span><strong>{person.name}</strong><small>{person.bio}</small></span>
          </button>
          <div className="invitation-actions">{incoming ? <>
            <button type="button" className="pill ghost" aria-label={`婉拒${person.name}`} onClick={() => declineIncoming(person.id)}>婉拒</button>
            <button type="button" className="pill solid" onClick={() => acceptIncoming(person.id)}>接受</button>
          </> : outgoing ? <>
            <button type="button" className="pill ghost" onClick={() => cancelInvite(person.id)}>撤回</button>
            <button type="button" className="pill solid" onClick={() => simulateAccept(person.id)}>模拟同意</button>
          </> : <button type="button" className="pill solid" onClick={() => invite(person.id)}>邀请</button>}</div>
        </div>
      })}
    </div>

    <div className={`my-today${sharedToday ? ' done' : ''}`}>
      <button type="button" className="my-today-preview" onClick={() => navigate('/feed/me')}>
        <span className="today-mini"><Photo image={mine?.image} alt=""/></span>
        <span><strong>我的日常</strong><small>{sharedToday ? '今天已分享' : '今天还没有分享'}</small></span>
      </button>
      <button className="pill solid" type="button" aria-label="添加日常照片" onClick={() => navigate('/compose')}><Icon name="plus" size={17}/>拍一张</button>
    </div>
  </section>
}
