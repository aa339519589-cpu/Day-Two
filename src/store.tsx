import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearImages, deleteImage, putImage } from './idb'
import { fileToJpeg, revokeImage } from './images'
import { initialOf, nextSlot, todayKey } from './logic'
import { createSeed } from './seed'
import { blankContract, type Me, type Message, type Moment, type Persisted, type Relation, type ThemeMode } from './types'

const DATA_KEY = 'daytwo-state-v1'
const THEME_KEY = 'daytwo-theme'

type Toast = { id: number; text: string }

type Store = {
  data: Persisted
  today: string
  theme: ThemeMode
  toast: Toast | null
  setTheme: (theme: ThemeMode) => void
  showToast: (text: string) => void
  onboard: (name: string) => void
  saveMe: (me: Me) => void
  acceptIncoming: (personId: string) => void
  declineIncoming: (personId: string) => void
  invite: (personId: string) => void
  cancelInvite: (personId: string) => void
  simulateAccept: (personId: string) => void
  endRelation: (personId: string) => void
  inviteContract: (personId: string) => void
  cancelContract: (personId: string) => void
  simulateContract: (personId: string) => void
  pauseContract: (personId: string) => void
  resumeContract: (personId: string) => void
  endContract: (personId: string) => void
  addMoment: (file: File, caption: string) => Promise<string>
  sendText: (personId: string, text: string, momentId?: string) => void
  sendImage: (personId: string, file: File) => Promise<void>
  removeMoment: (id: string) => Promise<void>
  deleteThread: (personId: string) => void
  resetDemo: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)

function loadData(): Persisted {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return createSeed()
    const parsed = JSON.parse(raw) as Persisted
    if (parsed.version !== 1 || !parsed.me || !Array.isArray(parsed.moments)) return createSeed()
    return parsed
  } catch {
    return createSeed()
  }
}

function loadTheme(): ThemeMode {
  const value = localStorage.getItem(THEME_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const color = dark ? '#000000' : '#ffffff'
  document.querySelectorAll('meta[name="theme-color"]').forEach((node) => node.setAttribute('content', color))
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function mapRelation(data: Persisted, personId: string, update: (rel: Relation) => Relation): Persisted {
  return { ...data, relations: data.relations.map((rel) => (rel.personId === personId ? update(rel) : rel)) }
}

function markActive(data: Persisted, personId: string | null, today: string): Persisted {
  return {
    ...data,
    relations: data.relations.map((rel) => {
      const hit = personId === null ? rel.status === 'active' : rel.personId === personId
      if (!hit || rel.contract.status !== 'active') return rel
      if (rel.contract.selfDays.includes(today)) return rel
      return { ...rel, contract: { ...rel.contract, selfDays: [...rel.contract.selfDays, today] } }
    }),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(loadData)
  const [theme, setThemeState] = useState<ThemeMode>(loadTheme)
  const [today, setToday] = useState(todayKey)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  useEffect(() => {
    const sync = () => setToday(todayKey())
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const api = useMemo<Store>(() => {
    const showToast = (text: string) => setToast({ id: Date.now(), text })

    const requireSlot = () => {
      if (nextSlot(data.relations) !== null) return true
      showToast('席位满了')
      return false
    }

    return {
      data,
      today,
      theme,
      toast,
      setTheme: setThemeState,
      showToast,
      onboard: (name) => {
        const trimmed = name.trim().slice(0, 16)
        if (!trimmed) return
        setData((current) => ({ ...current, onboarded: true, me: { ...current.me, name: trimmed } }))
      },
      saveMe: (me) => setData((current) => ({ ...current, me })),
      acceptIncoming: (personId) => {
        if (!requireSlot()) return
        const slot = nextSlot(data.relations)
        setData((current) =>
          mapRelation(current, personId, (rel) =>
            rel.status === 'incoming' ? { ...rel, status: 'active', slot, since: new Date().toISOString() } : rel,
          ),
        )
        showToast('已接受')
      },
      declineIncoming: (personId) => {
        setData((current) => ({ ...current, relations: current.relations.filter((rel) => rel.personId !== personId) }))
        showToast('已婉拒')
      },
      invite: (personId) => {
        const held = data.relations.filter((rel) => rel.status === 'active' || rel.status === 'incoming' || rel.status === 'outgoing').length
        if (held >= 3) {
          showToast('席位满了')
          return
        }
        setData((current) => {
          const existing = current.relations.find((rel) => rel.personId === personId)
          const next: Relation = {
            personId,
            status: 'outgoing',
            since: new Date().toISOString(),
            slot: null,
            contract: existing?.contract ?? blankContract(),
          }
          const relations = existing
            ? current.relations.map((rel) => (rel.personId === personId ? { ...next, contract: blankContract() } : rel))
            : [...current.relations, next]
          return { ...current, relations }
        })
        showToast('已邀请')
      },
      cancelInvite: (personId) => {
        setData((current) => ({
          ...current,
          relations: current.relations.filter((rel) => !(rel.personId === personId && rel.status === 'outgoing')),
        }))
      },
      simulateAccept: (personId) => {
        const slot = nextSlot(data.relations)
        if (slot === null) {
          showToast('席位满了')
          return
        }
        setData((current) =>
          mapRelation(current, personId, (rel) =>
            rel.status === 'outgoing' ? { ...rel, status: 'active', slot, since: new Date().toISOString(), contract: blankContract() } : rel,
          ),
        )
        showToast('已接受')
      },
      endRelation: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({
            ...rel,
            status: 'ended',
            slot: null,
            endedAt: new Date().toISOString(),
            contract:
              rel.contract.status === 'off'
                ? rel.contract
                : { ...rel.contract, status: 'ended' },
          })),
        )
        showToast('已退出')
      },
      inviteContract: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({ ...rel, contract: { ...rel.contract, status: 'pending' } })),
        )
      },
      cancelContract: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({ ...rel, contract: { ...rel.contract, status: 'off' } })),
        )
      },
      simulateContract: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({
            ...rel,
            contract: { ...rel.contract, status: 'active', since: new Date().toISOString() },
          })),
        )
        showToast('约定已开')
      },
      pauseContract: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({ ...rel, contract: { ...rel.contract, status: 'paused' } })),
        )
      },
      resumeContract: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({ ...rel, contract: { ...rel.contract, status: 'active' } })),
        )
      },
      endContract: (personId) => {
        setData((current) =>
          mapRelation(current, personId, (rel) => ({ ...rel, contract: { ...rel.contract, status: 'ended' } })),
        )
        showToast('约定已结束')
      },
      addMoment: async (file, caption) => {
        const blob = await fileToJpeg(file)
        const key = crypto.randomUUID()
        await putImage(key, blob)
        const moment: Moment = {
          id: uid('m'),
          authorId: 'me',
          image: `idb:${key}`,
          caption: caption.trim().slice(0, 80),
          createdAt: new Date().toISOString(),
          mine: true,
        }
        setData((current) => markActive({ ...current, moments: [...current.moments, moment] }, null, todayKey()))
        showToast('已记下')
        return moment.id
      },
      sendText: (personId, text, momentId) => {
        const rel = data.relations.find((item) => item.personId === personId && item.status === 'active')
        const body = text.trim().slice(0, 500)
        if (!body || !rel) return
        const message: Message = {
          id: uid('c'),
          personId,
          from: 'me',
          text: body,
          momentId,
          createdAt: new Date().toISOString(),
        }
        setData((current) => markActive({ ...current, messages: [...current.messages, message] }, personId, todayKey()))
        if (rel.contract.status === 'paused') showToast('已暂停')
      },
      sendImage: async (personId, file) => {
        const rel = data.relations.find((item) => item.personId === personId && item.status === 'active')
        if (!rel) return
        const blob = await fileToJpeg(file)
        const key = crypto.randomUUID()
        await putImage(key, blob)
        const message: Message = {
          id: uid('c'),
          personId,
          from: 'me',
          text: '',
          image: `idb:${key}`,
          createdAt: new Date().toISOString(),
        }
        setData((current) => markActive({ ...current, messages: [...current.messages, message] }, personId, todayKey()))
        if (rel.contract.status === 'paused') showToast('已暂停')
      },
      removeMoment: async (id) => {
        const moment = data.moments.find((item) => item.id === id)
        if (!moment?.mine) return
        setData((current) => ({ ...current, moments: current.moments.filter((item) => item.id !== id) }))
        if (moment.image.startsWith('idb:')) {
          revokeImage(moment.image)
          await deleteImage(moment.image.slice(4))
        }
      },
      deleteThread: (personId) => {
        setData((current) => ({ ...current, messages: current.messages.filter((item) => item.personId !== personId) }))
        showToast('已删除')
      },
      resetDemo: async () => {
        localStorage.removeItem(DATA_KEY)
        await clearImages()
        window.location.assign('/')
      },
    }
  }, [data, theme, today, toast])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const value = useContext(Ctx)
  if (!value) throw new Error('Store missing')
  return value
}

export function usePerson(id: string | undefined) {
  const { data } = useStore()
  return data.people.find((person) => person.id === id)
}

export { initialOf }
