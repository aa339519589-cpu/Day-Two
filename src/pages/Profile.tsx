import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { splitList } from '../logic'
import { useStore } from '../store'
import { useTitle } from '../ui'
import { Icon, PersonAvatar, Sheet, type IconName } from '../components/Elements'
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
  return <section className="screen profile-screen"><header className="page-header"><h1>我的</h1><button type="button" className="icon-button" aria-label="编辑资料" onClick={open}><Icon name="edit"/></button></header>
    <div className="profile-identity"><PersonAvatar id="me" size="large"/><h2>{data.me.name}</h2>{data.me.city && <span className="profile-city">{data.me.city}</span>}{data.me.bio && <p className="profile-bio">{data.me.bio}</p>}{data.me.interests.length > 0 && <div className="profile-interests">{data.me.interests.map(t => <span key={t}>{t}</span>)}</div>}</div>
    <div className="profile-stats"><button type="button" onClick={() => navigate('/feed/me')}><strong>{data.moments.filter(m => m.authorId === 'me').length}</strong><span>日常</span></button><span className="stats-divider"/><button type="button" onClick={() => navigate('/home')}><strong>{data.relations.filter(r => r.status === 'active').length}</strong><span>朋友</span></button></div>
    <div className="settings-list"><button type="button" className="settings-row" onClick={() => navigate('/feed/me')}><Icon name="photo"/><span>我的日常</span><Icon name="chevron" size={17}/></button><button type="button" className="settings-row" onClick={open}><Icon name="me"/><span>个人资料</span><Icon name="chevron" size={17}/></button>{!isStandalone && (install || isApplePhone) && <button type="button" className="settings-row" onClick={() => {if (install) {void install.prompt();setInstall(null)} else setInstallHelp(true)}}><Icon name="plus"/><span>添加到主屏幕</span><Icon name="chevron" size={17}/></button>}</div>
    <section className="appearance"><h3>外观</h3><div className="theme-picker" aria-label="外观">{modes.map(m => <button type="button" key={m.id} aria-pressed={theme === m.id} className={theme === m.id ? 'selected' : ''} onClick={() => setTheme(m.id)}><Icon name={m.icon} size={18}/><span>{m.label}</span></button>)}</div></section>
    <p className="profile-version">Day Two <span>· 本地体验</span></p>
    {installHelp && <Sheet title="添加到主屏幕" onClose={() => setInstallHelp(false)}><div className="install-guide"><p>用 Safari 打开这个页面。</p><p>点击浏览器的<strong>分享</strong>，选择<strong>添加到主屏幕</strong>。</p><p className="muted">以后可以像 App 一样从桌面打开。</p></div><button type="button" className="primary-button" onClick={() => setInstallHelp(false)}>知道了</button></Sheet>}
    {editing && <Sheet title="编辑资料" onClose={() => setEditing(false)}><form className="edit-form" onSubmit={save}><label>名字<input autoComplete="nickname" required value={draft.name} maxLength={16} onChange={e => setDraft({...draft,name:e.target.value})}/></label><label>简介<textarea aria-label="简介" value={draft.bio} rows={2} maxLength={80} onChange={e => setDraft({...draft,bio:e.target.value})}/></label><label>城市<input value={draft.city} maxLength={12} onChange={e => setDraft({...draft,city:e.target.value})}/></label><label>语言<input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="中文、英语"/></label><label>兴趣<input value={interests} onChange={e => setInterests(e.target.value)} placeholder="摄影、散步"/></label><button className="primary-button" type="submit" disabled={!draft.name.trim()}>保存</button></form></Sheet>}
  </section>
}
