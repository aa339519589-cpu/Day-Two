import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { splitList } from '../logic'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Icon, Mark, PersonAvatar, Sheet, type IconName } from '../components/Elements'
import type { ThemeMode } from '../types'
type InstallEvent = Event & {prompt: () => Promise<void>}
export function ProfilePage() {
  const { data, theme, setTheme, saveMe, showToast } = useStore()
  const navigate = useNavigate()
  const [editing,setEditing] = useState(false)
  const [draft,setDraft] = useState(data.me)
  const [languages,setLanguages] = useState(data.me.languages.join('、'))
  const [interests,setInterests] = useState(data.me.interests.join('、'))
  const [install,setInstall] = useState<InstallEvent | null>(null)
  const [installHelp,setInstallHelp] = useState(false)
  const isApplePhone = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone)
  useTitle('我的 · Day Two')
  useEffect(() => {const handler = (e: Event) => {e.preventDefault();setInstall(e as InstallEvent)};window.addEventListener('beforeinstallprompt',handler);return () => window.removeEventListener('beforeinstallprompt',handler)},[])
  const open = () => {setDraft(data.me);setLanguages(data.me.languages.join('、'));setInterests(data.me.interests.join('、'));setEditing(true)}
  const save = (e: FormEvent) => {e.preventDefault();if (!draft.name.trim()) return;saveMe({...draft,name:draft.name.trim().slice(0,16),bio:draft.bio.trim().slice(0,80),city:draft.city.trim().slice(0,12),languages:splitList(languages),interests:splitList(interests)});setEditing(false);showToast('已保存')}
  const modes: {id:ThemeMode; label:string; icon:IconName}[] = [{id:'light',label:'浅色',icon:'sun'},{id:'dark',label:'深色',icon:'moon'},{id:'system',label:'自动',icon:'system'}]
  const myMoments = data.moments.filter(m => m.authorId === 'me').sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  const seats = data.relations.filter(r => r.status === 'active').sort((a,b) => (a.slot ?? 0) - (b.slot ?? 0))
  const days = myMoments.length ? new Set(myMoments.map(m => m.createdAt.slice(0,10))).size : 0
  return <section className="screen profile-screen">
    <header className="app-top"><h1 className="eyebrow">我的</h1><button type="button" className="icon-button" aria-label="编辑资料" onClick={open}><Icon name="edit" size={21}/></button></header>
    <div className="profile-identity">
      <PersonAvatar id="me" size="large"/>
      <div className="profile-name"><h2>{data.me.name}</h2>{data.me.city && <span className="profile-city">在{data.me.city}</span>}</div>
      {data.me.bio && <p className="profile-bio">{data.me.bio}</p>}
      {data.me.interests.length > 0 && <div className="profile-interests">{data.me.interests.map(t => <span key={t}>{t}</span>)}</div>}
    </div>
    <div className="profile-stats">
      <button type="button" onClick={() => navigate('/feed/me')}><strong className="num">{myMoments.length}</strong><span>张日常</span></button>
      <button type="button" onClick={() => navigate('/feed/me')}><strong className="num">{days}</strong><span>天留下过</span></button>
      <button type="button" onClick={() => navigate('/home')}><strong className="num">{seats.length}<small>/3</small></strong><span>席位</span></button>
    </div>
    <section className="profile-block">
      <div className="block-head"><h3 className="section-label">我的日常</h3><button type="button" className="text-button" onClick={() => navigate('/compose')}>分享</button></div>
      {myMoments.length ? <div className="mini-grid">{myMoments.slice(0,6).map(m => <button type="button" key={m.id} onClick={() => navigate(`/feed/me?m=${encodeURIComponent(m.id)}`)} aria-label={m.caption || '我的日常'}><Photo image={m.image} alt=""/></button>)}</div>
        : <button type="button" className="mini-empty" onClick={() => navigate('/compose')}><Icon name="camera"/><span>分享第一张日常</span></button>}
    </section>
    <section className="profile-block">
      <h3 className="section-label">席位</h3>
      <div className="seat-strip">{[0,1,2].map(i => { const r = seats[i]; const person = r && data.people.find(p => p.id === r.personId); return person
        ? <button type="button" key={i} onClick={() => navigate(`/friend/${person.id}`)}><PersonAvatar id={person.id}/><span>{person.name}</span></button>
        : <button type="button" key={i} className="vacant" onClick={() => navigate('/home')}><span className="vacant-ring"><Icon name="plus" size={18}/></span><span>空着</span></button> })}</div>
    </section>
    <div className="settings-list">
      <button type="button" className="settings-row" onClick={open}><Icon name="me" size={20}/><span>个人资料</span><Icon name="chevron" size={17}/></button>
      {!isStandalone && (install || isApplePhone) && <button type="button" className="settings-row" onClick={() => {if (install) {void install.prompt();setInstall(null)} else setInstallHelp(true)}}><Icon name="plus" size={20}/><span>添加到主屏幕</span><Icon name="chevron" size={17}/></button>}
    </div>
    <section className="appearance"><h3 className="section-label">外观</h3><div className="theme-picker" role="group" aria-label="外观">{modes.map(m => <button type="button" key={m.id} aria-pressed={theme === m.id} className={theme === m.id ? 'selected' : ''} onClick={() => setTheme(m.id)}><Icon name={m.icon} size={17}/><span>{m.label}</span></button>)}</div></section>
    <p className="profile-version"><Mark size={18}/>Day Two · 本地体验，照片只存在这台设备</p>
    {installHelp && <Sheet title="添加到主屏幕" onClose={() => setInstallHelp(false)}><div className="install-guide"><p>用 Safari 打开这个页面。</p><p>点击浏览器的<strong>分享</strong>，选择<strong>添加到主屏幕</strong>。</p><p className="muted">以后可以像 App 一样从桌面打开。</p></div><button type="button" className="pill solid wide" onClick={() => setInstallHelp(false)}>知道了</button></Sheet>}
    {editing && <Sheet title="编辑资料" onClose={() => setEditing(false)}><form className="edit-form" onSubmit={save}><label>名字<input autoComplete="nickname" required value={draft.name} maxLength={16} onChange={e => setDraft({...draft,name:e.target.value})}/></label><label>简介<textarea aria-label="简介" value={draft.bio} rows={2} maxLength={80} onChange={e => setDraft({...draft,bio:e.target.value})}/></label><label>城市<input value={draft.city} maxLength={12} onChange={e => setDraft({...draft,city:e.target.value})}/></label><label>语言<input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="中文、英语"/></label><label>兴趣<input value={interests} onChange={e => setInterests(e.target.value)} placeholder="摄影、散步"/></label><button className="pill solid wide" type="submit" disabled={!draft.name.trim()}>保存</button></form></Sheet>}
  </section>
}
