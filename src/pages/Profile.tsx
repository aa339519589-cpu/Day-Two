import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { initialOf, splitList } from '../logic'
import { useStore } from '../store'
import type { ThemeMode } from '../types'
import { Avatar, Dialog, useTitle } from '../ui'

export function ProfilePage() {
  const { data, theme, setTheme, saveMe, resetDemo, showToast } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState(data.me.name)
  const [bio, setBio] = useState(data.me.bio)
  const [city, setCity] = useState(data.me.city)
  const [languages, setLanguages] = useState(data.me.languages.join('、'))
  const [interests, setInterests] = useState(data.me.interests.join('、'))
  const [error, setError] = useState('')
  const [askReset, setAskReset] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  useTitle(`我的 · ${BRAND.name}`)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  return (
    <div className="screen">
      <div className="profile-head">
        <Avatar initial={initialOf(name)} tint={data.me.tint} large />
        <h1>{name || '未命名'}</h1>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim()
          if (!trimmed) {
            setError('先写一个称呼。')
            return
          }
          saveMe({
            ...data.me,
            name: trimmed.slice(0, 16),
            bio: bio.trim().slice(0, 80),
            city: city.trim().slice(0, 12) || '这里',
            languages: splitList(languages).length ? splitList(languages) : ['中文'],
            interests: splitList(interests),
          })
          setError('')
          showToast('已保存')
        }}
      >
        <label className="field">
          <span>称呼</span>
          <input value={name} maxLength={16} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>简介</span>
          <textarea value={bio} maxLength={80} onChange={(event) => setBio(event.target.value)} />
        </label>
        <label className="field">
          <span>城市</span>
          <input value={city} maxLength={12} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="field">
          <span>语言</span>
          <input value={languages} placeholder="中文、英语" onChange={(event) => setLanguages(event.target.value)} />
        </label>
        <label className="field">
          <span>兴趣</span>
          <input value={interests} placeholder="走路、胶片" onChange={(event) => setInterests(event.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">
          保存
        </button>
      </form>
      <div className="choice">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <button key={mode} type="button" className={theme === mode ? 'on' : undefined} onClick={() => setTheme(mode)}>
              {mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}
            </button>
          ))}
      </div>
      <div className="links">
        <button type="button" onClick={() => navigate('/feed/me')}>
          我的日常
        </button>
        <button type="button" onClick={() => navigate('/compose')}>
          记下今天
        </button>
      </div>
      {installEvent && (
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            void installEvent.prompt()
            setInstallEvent(null)
          }}
        >
          添加到主屏幕
        </button>
      )}
      <button type="button" className="btn text reset" onClick={() => setAskReset(true)}>
        重置
      </button>
      {askReset && (
        <Dialog
          title="重置"
          body="名字、聊天和上传的照片会清掉。"
          confirm="重置"
          danger
          onClose={() => setAskReset(false)}
          onConfirm={() => {
            void resetDemo()
          }}
        />
      )}
    </div>
  )
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> }
