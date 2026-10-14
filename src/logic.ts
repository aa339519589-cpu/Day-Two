import type { Contract } from './types'

export function todayKey(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split('-').map(Number)
  return todayKey(new Date(y, m - 1, d + n))
}

export function dayKeyFromIso(iso: string) {
  return todayKey(new Date(iso))
}

export function dayCount(sinceIso: string, now = new Date()) {
  const start = dayKeyFromIso(sinceIso)
  const end = todayKey(now)
  const [y1, m1, d1] = start.split('-').map(Number)
  const [y2, m2, d2] = end.split('-').map(Number)
  const a = Date.UTC(y1, m1 - 1, d1)
  const b = Date.UTC(y2, m2 - 1, d2)
  return Math.round((b - a) / 86400000) + 1
}

export function initialOf(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return '·'
  const ch = [...trimmed][0]
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch
}

export function formatWhen(iso: string, now = new Date()) {
  const date = new Date(iso)
  const day = todayKey(date)
  const today = todayKey(now)
  const hm = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  if (day === today) return `今天 ${hm}`
  if (day === addDays(today, -1)) return `昨天 ${hm}`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${hm}`
}

export function dayLabel(day: string, today: string) {
  if (day === today) return '今天'
  if (day === addDays(today, -1)) return '昨天'
  const [, m, d] = day.split('-')
  return `${Number(m)}月${Number(d)}日`
}

export function nextSlot(relations: { status: string; slot: number | null }[]) {
  const used = new Set(relations.filter((r) => r.status === 'active').map((r) => r.slot))
  for (let i = 0; i < 3; i++) if (!used.has(i)) return i
  return null
}

export function peerOn(contract: Contract, day: string, today: string) {
  if (contract.peerMode !== 'recent') return false
  return day >= addDays(today, -6) && day <= today
}

export function inContract(contract: Contract, day: string) {
  if (!contract.since) return false
  return day >= dayKeyFromIso(contract.since)
}

export type Streak = { days: number; todaySelf: boolean; todayPeer: boolean }

export function streakInfo(contract: Contract, today: string): Streak {
  const self = new Set(contract.selfDays)
  const todaySelf = self.has(today) && inContract(contract, today)
  const todayPeer = peerOn(contract, today, today) && inContract(contract, today)
  const complete = (day: string) => self.has(day) && peerOn(contract, day, today) && inContract(contract, day)
  let cursor = todaySelf && todayPeer ? today : addDays(today, -1)
  let days = 0
  while (days < 400 && complete(cursor)) {
    days += 1
    cursor = addDays(cursor, -1)
  }
  return { days, todaySelf, todayPeer }
}

export function recentDays(contract: Contract, today: string, n = 6) {
  const self = new Set(contract.selfDays)
  const rows: { day: string; self: boolean; peer: boolean }[] = []
  for (let i = 0; i < n; i++) {
    const day = addDays(today, -i)
    if (!inContract(contract, day)) continue
    rows.push({
      day,
      self: self.has(day),
      peer: peerOn(contract, day, today),
    })
  }
  return rows
}

export function dayLine(self: boolean, peer: boolean, pronoun: string) {
  if (self && peer) return '双方都在'
  if (peer && !self) return `${pronoun}留下了，你还没有`
  if (self && !peer) return `你留下了，${pronoun}还没有`
  return '这一天是空的'
}

export function seatStatus(since: string, contract: Contract, pronoun: string, today: string, now = new Date()) {
  const prefix = `第 ${dayCount(since, now)} 天`
  if (contract.status === 'paused') return `${prefix} · 暂停`
  if (contract.status !== 'active') return prefix
  const info = streakInfo(contract, today)
  if (info.todaySelf && info.todayPeer) return `${prefix} · 都在`
  if (info.todayPeer) return `${prefix} · ${pronoun}在`
  if (info.todaySelf) return `${prefix} · 你在`
  return prefix
}

export function todayLine(contract: Contract, pronoun: string, today: string) {
  const info = streakInfo(contract, today)
  if (info.todaySelf && info.todayPeer) return '今天都在'
  if (info.todayPeer) return `今天${pronoun}在`
  if (info.todaySelf) return '今天你在'
  return '今天还没有'
}

/** Swipe up (negative dy) moves to the next photo. */
export function decideDir(dy: number, vy: number, height: number, index: number, count: number): -1 | 0 | 1 {
  if (count <= 1 || height <= 0) return 0
  const flick = Math.abs(vy) > 0.45 && Math.abs(dy) > 28
  if ((dy < -height * 0.18 || (flick && vy < 0 && dy < 0)) && index < count - 1) return 1
  if ((dy > height * 0.18 || (flick && vy > 0 && dy > 0)) && index > 0) return -1
  return 0
}

export function splitList(value: string) {
  return value
    .split(/[、,，]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6)
}
