import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { initialOf, splitList } from '../logic'
import { useStore } from '../store'
import type { ThemeMode } from '../types'
import { Avatar, Dialog, IconChevronRight, useTitle } from '../ui'

export function ProfilePage() {
  const { data, theme, setTheme, saveMe, resetDemo, showToast } = useStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(data.me.name)
  const [bio, setBio] = useState(data.me.bio)
  const [city, setCity] = useState(data.me.city)
  const [languages, setLanguages] = useState(data.me.languages.join('、'))
  const [interests, setInterests] = useState(data.me.interests.join('、'))
  const [error, setError] = useState('')
  const [askReset, setAskReset] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  useTitle(`档案 · ${BRAND.name}`)

  const myMomentsCount = data.moments.filter((m) => m.authorId === 'me').length
  const activeCount = data.relations.filter((r) => r.status === 'active').length

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请填写你的称呼。')
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
    setEditing(false)
    showToast('已保存')
  }

  return (
    <div className="screen profile-screen">
      <header className="page-masthead">
        <div className="masthead-row">
          <h1>我的</h1>
          <button
            type="button"
            className="masthead-btn"
            onClick={() => {
              if (editing) {
                setName(data.me.name)
                setBio(data.me.bio)
                setCity(data.me.city)
                setLanguages(data.me.languages.join('、'))
                setInterests(data.me.interests.join('、'))
                setError('')
              }
              setEditing((prev) => !prev)
            }}
          >
            {editing ? '取消' : '编辑资料'}
          </button>
        </div>
      </header>

      <section className="profile-card">
        <div className="profile-identity">
          <Avatar initial={initialOf(data.me.name)} tint={data.me.tint} large />
          <div className="profile-identity-text">
            <h2>{data.me.name || '未命名'}</h2>
            <p className="profile-location">
              {data.me.city || '这里'} · {data.me.languages.join(' / ')}
            </p>
          </div>
        </div>
        <p className="profile-bio">{data.me.bio || '还没有写下简介。'}</p>
        {data.me.interests.length > 0 && (
          <div className="interest-inline">
            {data.me.interests.map((item) => (
              <span key={item} className="tag-chip">
                {item}
              </span>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <form className="ios-form-group" onSubmit={handleSave}>
          <div className="group-caption">编辑档案信息</div>
          <div className="ios-table">
            <label className="ios-cell">
              <span className="cell-label">称呼</span>
              <input
                value={name}
                maxLength={16}
                placeholder="你的名字"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="ios-cell">
              <span className="cell-label">城市</span>
              <input
                value={city}
                maxLength={12}
                placeholder="所在城市"
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <label className="ios-cell">
              <span className="cell-label">语言</span>
              <input
                value={languages}
                placeholder="用顿号分隔，如：中文、英语"
                onChange={(event) => setLanguages(event.target.value)}
              />
            </label>
            <label className="ios-cell">
              <span className="cell-label">兴趣</span>
              <input
                value={interests}
                placeholder="用顿号分隔，如：胶片、散步"
                onChange={(event) => setInterests(event.target.value)}
              />
            </label>
            <label className="ios-cell stacked">
              <span className="cell-label">简介</span>
              <textarea
                value={bio}
                maxLength={80}
                rows={2}
                placeholder="写一句关于你自己的话"
                onChange={(event) => setBio(event.target.value)}
              />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" style={{ marginTop: 12 }}>
            保存修改
          </button>
        </form>
      )}

      <section className="settings-section">
        <div className="group-caption">日常与席位</div>
        <div className="ios-list">
          <button type="button" className="ios-row" onClick={() => navigate('/feed/me')}>
            <span className="row-title">我的日常</span>
            <span className="row-trail">
              <span>{myMomentsCount} 张照片</span>
              <IconChevronRight />
            </span>
          </button>
          <button type="button" className="ios-row" onClick={() => navigate('/compose')}>
            <span className="row-title">记下今天</span>
            <span className="row-trail">
              <span>发布瞬间</span>
              <IconChevronRight />
            </span>
          </button>
          <button type="button" className="ios-row" onClick={() => navigate('/home')}>
            <span className="row-title">席位状态</span>
            <span className="row-trail">
              <span>{activeCount} / 3 席在位</span>
              <IconChevronRight />
            </span>
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="group-caption">外观模式</div>
        <div className="segmented" role="radiogroup" aria-label="外观模式">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={theme === mode}
              className={theme === mode ? 'on' : undefined}
              onClick={() => setTheme(mode)}
            >
              {mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}
            </button>
          ))}
        </div>
      </section>

      {(installEvent || import.meta.env.DEV) && (
        <section className="settings-section">
          <div className="group-caption">系统与数据</div>
          <div className="ios-list">
            {installEvent && (
              <button
                type="button"
                className="ios-row"
                onClick={() => {
                  void installEvent.prompt()
                  setInstallEvent(null)
                }}
              >
                <span className="row-title">添加到主屏幕</span>
                <span className="row-trail">
                  <IconChevronRight />
                </span>
              </button>
            )}
            {import.meta.env.DEV && (
              <button type="button" className="ios-row destructive" onClick={() => setAskReset(true)}>
                <span className="row-title">重置演示数据</span>
                <span className="row-trail">
                  <span>恢复初始状态</span>
                </span>
              </button>
            )}
          </div>
        </section>
      )}

      {askReset && (
        <Dialog
          title="重置演示数据"
          body="所有新增的照片、对话与席位变更都将恢复为初始演示状态。"
          confirm="确认重置"
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
