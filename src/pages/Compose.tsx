import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useStore } from '../store'
import { Back, FitViewport, LockScroll, useTitle } from '../ui'

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

  return (
    <FitViewport>
      <LockScroll />
      <div className="composer-page">
        <header className="topbar">
          <Back fallback="/daily" />
          <div className="grow">
            <h1>记下今天</h1>
            <p>可以不写字</p>
          </div>
        </header>
        <div className="preview">
          {preview ? (
            <>
              <img className="blur" src={preview} alt="" />
              <img className="fit" src={preview} alt="即将放入日常的照片" />
            </>
          ) : (
            <div className="empty">从相册选一张今天的照片。吃的、路、天色，都可以。</div>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="pad">
          <label className="btn ghost" style={{ marginBottom: 12 }}>
            {file ? '换一张' : '选择照片'}
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
          <label className="field">
            <span>一句话</span>
            <input value={caption} maxLength={80} placeholder="可以空着" onChange={(event) => setCaption(event.target.value)} />
          </label>
          <button
            type="button"
            className="btn"
            disabled={!file || busy}
            onClick={() => {
              if (!file) return
              setBusy(true)
              setError('')
              addMoment(file, caption)
                .then((id) => navigate(`/feed/me?m=${id}`, { replace: true }))
                .catch((reason: unknown) => {
                  setError(reason instanceof Error ? reason.message : '没有放进去，请再试一次。')
                  setBusy(false)
                })
            }}
          >
            {busy ? '处理中' : '放下'}
          </button>
        </div>
      </div>
    </FitViewport>
  )
}
