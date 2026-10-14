import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useStore } from '../store'
import { Back, FitViewport, IconImage, LockScroll, useTitle } from '../ui'

export function ComposePage() {
  const navigate = useNavigate()
  const { addMoment } = useStore()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useTitle(`记下今天 · ${BRAND.name}`)

  const choose = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview)
    if (!next) {
      setFile(null)
      setPreview('')
      return
    }
    if (!next.type.startsWith('image/')) {
      setError('请选择图片文件。')
      return
    }
    setError('')
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }

  const submit = () => {
    if (!file || busy) return
    setBusy(true)
    setError('')
    addMoment(file, caption)
      .then((id) => navigate(`/feed/me?m=${id}`, { replace: true }))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '没有放进去，请再试一次。')
        setBusy(false)
      })
  }

  return (
    <FitViewport>
      <LockScroll />
      <div className="composer-page">
        <header className="topbar compose-topbar">
          <Back fallback="/daily" />
          <div className="grow">
            <span className="eyebrow" style={{ margin: 0 }}>NEW MOMENT</span>
            <h1>记下今天</h1>
          </div>
          {file && (
            <button
              type="button"
              className="topbar-action primary"
              disabled={busy}
              onClick={submit}
            >
              {busy ? '处理中' : '放下'}
            </button>
          )}
        </header>

        <div className="compose-body">
          <div className="preview">
            {preview ? (
              <>
                <img className="fit" src={preview} alt="即将放入日常的照片" />
                <label className="reselect-pill">
                  更换照片
                  <input
                    className="file"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      choose(event.target.files?.[0] ?? null)
                      event.target.value = ''
                    }}
                  />
                </label>
              </>
            ) : (
              <label className="empty-viewfinder">
                <span className="viewfinder-icon">
                  <IconImage />
                </span>
                <strong>选择一张今天的照片</strong>
                <span>只对席位中的朋友可见 · 不设点赞与评论区</span>
                <input
                  className="file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    choose(event.target.files?.[0] ?? null)
                    event.target.value = ''
                  }}
                />
              </label>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="compose-controls">
            <label className="compose-caption-field">
              <div className="caption-head">
                <span>写下一句话（选填）</span>
                <small>{caption.length} / 80</small>
              </div>
              <input
                type="text"
                value={caption}
                maxLength={80}
                placeholder="此刻的光线、气味或刚发生的小事…"
                aria-label="一句话"
                onChange={(event) => setCaption(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="btn"
              disabled={!file || busy}
              onClick={submit}
            >
              {busy ? '正在冲印…' : '放进日常'}
            </button>
          </div>
        </div>
      </div>
    </FitViewport>
  )
}
