import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dayCount, dayLabel, dayLine, recentDays, streakInfo, todayLine } from '../logic'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { BackButton, Icon, PersonAvatar, Sheet } from '../components/Elements'
export function FriendPage() {
  const {personId = ''} = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const person = store.data.people.find(p => p.id === personId)
  const relation = store.data.relations.find(r => r.personId === personId)
  const [confirm,setConfirm] = useState<'leave' | 'contract' | null>(null)
  useTitle(`${person?.name || '朋友'} · Day Two`)
  if (!person) return <div className="stack"><header className="topbar"><BackButton/><h1>朋友</h1></header><div className="empty-state">没有找到这位朋友</div></div>
  const moments = store.data.moments.filter(m => m.authorId === person.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  const active = relation?.status === 'active'
  const contract = relation?.contract
  const rows = contract ? recentDays(contract,store.today,7).reverse() : []
  const streak = contract ? streakInfo(contract,store.today) : null
  return <main className="stack friend-page"><div className="friend-cover"><Photo image={moments[0]?.image} alt=""/><div className="cover-shade"/><header className="friend-cover-nav"><BackButton/>{active && <button type="button" className="icon-button" aria-label="好友选项" onClick={() => setConfirm('leave')}><Icon name="more"/></button>}</header></div>
    <div className="friend-detail"><PersonAvatar id={personId} size="large"/><div className="friend-detail-title"><h1>{person.name}</h1>{active && <span>认识 {dayCount(relation.since)} 天</span>}</div><p className="profile-city">{person.city}{person.languages.length ? ` · ${person.languages.join(' / ')}` : ''}</p><p className="friend-bio">{person.bio}</p><div className="profile-interests">{person.interests.map(t => <span key={t}>{t}</span>)}</div>
    {active ? <div className="friend-buttons"><button className="primary-button" type="button" onClick={() => navigate(`/chat/${personId}`)}><Icon name="chat" size={19}/>发消息</button><button className="secondary-button" type="button" onClick={() => navigate(`/feed/${personId}`)}><Icon name="photo" size={19}/>看日常</button></div> : <div className="friend-buttons">{relation?.status === 'incoming' ? <><button className="primary-button" type="button" onClick={() => store.acceptIncoming(personId)}>接受邀请</button><button className="secondary-button" type="button" onClick={() => {store.declineIncoming(personId);navigate('/home')}}>婉拒</button></> : relation?.status === 'outgoing' ? <><button className="primary-button" type="button" onClick={() => store.simulateAccept(personId)}>模拟对方同意</button><button className="secondary-button" type="button" onClick={() => store.cancelInvite(personId)}>撤回</button></> : <><button className="primary-button" type="button" onClick={() => store.invite(personId)}>邀请</button>{relation?.status === 'ended' && <button className="secondary-button" type="button" onClick={() => navigate(`/chat/${personId}`)}>聊天记录</button>}</>}</div>}
    {active && contract && <section className="daily-contract"><div className="section-heading"><h2>每日约定</h2><span>{contract.status === 'paused' ? '已暂停' : contract.status === 'active' ? todayLine(contract,person.pronoun,store.today) : contract.status === 'pending' ? '等待同意' : '未开启'}</span></div>
      {contract.status === 'active' || contract.status === 'paused' ? <><div className="contract-progress"><strong>{streak?.days}<small> 天</small></strong><span>连续交流</span></div><div className="contract-week">{rows.map(row => <span key={row.day} className={row.self && row.peer ? 'complete' : row.self || row.peer ? 'partial' : ''} title={dayLine(row.self,row.peer,person.pronoun)}><i>{row.self && row.peer ? <Icon name="check" size={16}/> : <span/>}</i><small>{dayLabel(row.day,store.today).replace(/^\d+月/,'')}</small></span>)}</div><div className="contract-actions"><button className="text-button" type="button" onClick={() => contract.status === 'active' ? store.pauseContract(personId) : store.resumeContract(personId)}>{contract.status === 'active' ? '暂停约定' : '恢复约定'}</button><button className="text-button muted" type="button" onClick={() => setConfirm('contract')}>结束约定</button></div></> : contract.status === 'pending' ? <div className="friend-buttons"><button className="small-button" type="button" onClick={() => store.simulateContract(personId)}>模拟对方同意</button><button className="text-button" type="button" onClick={() => store.cancelContract(personId)}>撤回</button></div> : <button className="settings-row" type="button" onClick={() => store.inviteContract(personId)}><span>邀请每天交流</span><Icon name="plus" size={20}/></button>}
    </section>}
    </div>
    {confirm && <Sheet title={confirm === 'leave' ? '结束好友关系？' : '结束每日约定？'} onClose={() => setConfirm(null)}><p className="sheet-note">{confirm === 'leave' ? '聊天记录保留，每日约定同时结束。' : '好友关系和聊天记录保留。'}</p><button className="settings-row danger-text" type="button" onClick={() => {if(confirm === 'leave') {store.endRelation(personId);navigate('/home')} else store.endContract(personId);setConfirm(null)}}>确认结束</button></Sheet>}
  </main>
}
