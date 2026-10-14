import assert from 'node:assert/strict'
import { addDays, decideDir, nextSlot, seatStatus, streakInfo, todayKey } from './logic.ts'
import type { Contract } from './types.ts'

const today = '2026-10-14'
const contract: Contract = {
  status: 'active',
  since: '2026-09-27T13:00:00.000Z',
  selfDays: [1, 2, 3, 4, 5, 6].map((n) => addDays(today, -n)),
  peerMode: 'recent',
}

const quiet = streakInfo(contract, today)
assert.equal(quiet.days, 6)
assert.equal(quiet.todaySelf, false)
assert.equal(quiet.todayPeer, true)

const spoken: Contract = { ...contract, selfDays: [...contract.selfDays, today] }
assert.equal(streakInfo(spoken, today).days, 7)

const gapped: Contract = { ...contract, selfDays: [today, addDays(today, -2)] }
assert.equal(streakInfo(gapped, today).days, 1)

const [fy, fm, fd] = today.split('-').map(Number)
const freshSince = new Date(fy, fm - 1, fd, 12, 0, 0).toISOString()
const fresh: Contract = { ...contract, since: freshSince, selfDays: [addDays(today, -1), today] }
assert.equal(streakInfo(fresh, today).days, 1)

assert.equal(decideDir(-10, 0, 800, 0, 5), 0)
assert.equal(decideDir(-200, 0, 800, 0, 5), 1)
assert.equal(decideDir(-200, -1, 800, 4, 5), 0)
assert.equal(decideDir(-40, -0.8, 800, 1, 5), 1)
assert.equal(decideDir(40, -0.8, 800, 1, 5), 0)
assert.equal(decideDir(200, 0, 800, 0, 5), 0)
assert.equal(decideDir(0, 0, 800, 0, 1), 0)

assert.equal(nextSlot([{ status: 'active', slot: 0 }, { status: 'active', slot: 1 }]), 2)
assert.equal(nextSlot([{ status: 'active', slot: 0 }, { status: 'active', slot: 1 }, { status: 'active', slot: 2 }]), null)
assert.equal(nextSlot([{ status: 'ended', slot: null }]), 0)

const now = new Date(2026, 9, 14, 12, 0, 0)
assert.equal(
  seatStatus('2026-09-27T13:00:00.000Z', contract, '她', today, now),
  '第 18 天 · 她在',
)
assert.equal(todayKey(now), today)

console.log('logic ok')
