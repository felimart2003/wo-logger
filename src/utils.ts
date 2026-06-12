import type {
  Exercise, PersonalRecord, SetEntry, SetKind, Unit, Workout,
} from './types'

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const KG_PER_LB = 0.45359237

export function kgToDisplay(kg: number, unit: Unit): number {
  const v = unit === 'kg' ? kg : kg / KG_PER_LB
  return Math.round(v * 100) / 100
}

export function displayToKg(v: number, unit: Unit): number {
  return unit === 'kg' ? v : v * KG_PER_LB
}

/** Format a number trimming trailing zeros, max 1 decimal place. */
export function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

export function fmtWeight(kg: number, unit: Unit): string {
  return `${fmtNum(kgToDisplay(kg, unit))} ${unit}`
}

/** Epley estimated one-rep max. */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

/** mm:ss or h:mm:ss */
export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** "1h 23m", "45m", "30s" */
export function fmtDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  if (s < 60) return `${s}s`
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ', ' + new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  })
}

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday-based start of week. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (out.getDay() + 6) % 7
  out.setDate(out.getDate() - dow)
  return out
}

export function setVolumeKg(s: SetEntry): number {
  if (s.weightKg == null || s.reps == null) return 0
  return s.weightKg * s.reps
}

export function workoutVolumeKg(w: { entries: { sets: SetEntry[] }[] }): number {
  let total = 0
  for (const entry of w.entries)
    for (const s of entry.sets)
      if (s.completed) total += setVolumeKg(s)
  return total
}

export function workoutSetCount(w: { entries: { sets: SetEntry[] }[] }): number {
  let n = 0
  for (const entry of w.entries) n += entry.sets.filter(s => s.completed).length
  return n
}

export const SET_KIND_ORDER: SetKind[] = ['normal', 'warmup', 'drop', 'failure']

export function nextSetKind(kind: SetKind): SetKind {
  const i = SET_KIND_ORDER.indexOf(kind)
  return SET_KIND_ORDER[(i + 1) % SET_KIND_ORDER.length]
}

export function setKindLabel(kind: SetKind, normalIndex: number): string {
  switch (kind) {
    case 'warmup': return 'W'
    case 'drop': return 'D'
    case 'failure': return 'F'
    default: return String(normalIndex)
  }
}

export interface ExerciseBests {
  maxWeightKg: number
  best1RMKg: number
  maxSetVolumeKg: number
  maxReps: number
  maxDurationSec: number
}

const EMPTY_BESTS: ExerciseBests = {
  maxWeightKg: 0, best1RMKg: 0, maxSetVolumeKg: 0, maxReps: 0, maxDurationSec: 0,
}

/** Best completed-set numbers for one exercise across the given workouts. */
export function exerciseBests(exerciseId: string, workouts: Workout[]): ExerciseBests {
  const b = { ...EMPTY_BESTS }
  for (const w of workouts) {
    for (const entry of w.entries) {
      if (entry.exerciseId !== exerciseId) continue
      for (const s of entry.sets) {
        if (!s.completed) continue
        if (s.weightKg != null) b.maxWeightKg = Math.max(b.maxWeightKg, s.weightKg)
        if (s.weightKg != null && s.reps != null) {
          b.best1RMKg = Math.max(b.best1RMKg, epley1RM(s.weightKg, s.reps))
          b.maxSetVolumeKg = Math.max(b.maxSetVolumeKg, s.weightKg * s.reps)
        }
        if (s.reps != null) b.maxReps = Math.max(b.maxReps, s.reps)
        if (s.durationSec != null) b.maxDurationSec = Math.max(b.maxDurationSec, s.durationSec)
      }
    }
  }
  return b
}

/** PRs achieved by `workout` compared to all `priorWorkouts`. */
export function detectPRs(
  workout: Workout,
  priorWorkouts: Workout[],
  exerciseById: Map<string, Exercise>,
): PersonalRecord[] {
  const prs: PersonalRecord[] = []
  const seen = new Set<string>()
  for (const entry of workout.entries) {
    if (seen.has(entry.exerciseId)) continue
    seen.add(entry.exerciseId)
    const ex = exerciseById.get(entry.exerciseId)
    if (!ex) continue
    const prior = exerciseBests(entry.exerciseId, priorWorkouts)
    const now = exerciseBests(entry.exerciseId, [workout])
    const hadPrior = priorWorkouts.some(w =>
      w.entries.some(e2 => e2.exerciseId === entry.exerciseId && e2.sets.some(s => s.completed)))
    if (!hadPrior) continue // first time doing it — everything would be a "PR"
    if (ex.type === 'weight_reps' || ex.type === 'weighted_duration') {
      if (now.maxWeightKg > prior.maxWeightKg && now.maxWeightKg > 0)
        prs.push({ exerciseId: ex.id, exerciseName: ex.name, kind: 'weight', value: now.maxWeightKg })
      if (now.best1RMKg > prior.best1RMKg && now.best1RMKg > 0)
        prs.push({ exerciseId: ex.id, exerciseName: ex.name, kind: '1rm', value: now.best1RMKg })
      if (now.maxSetVolumeKg > prior.maxSetVolumeKg && now.maxSetVolumeKg > 0)
        prs.push({ exerciseId: ex.id, exerciseName: ex.name, kind: 'volume', value: now.maxSetVolumeKg })
    } else if (ex.type === 'reps_only') {
      if (now.maxReps > prior.maxReps && now.maxReps > 0)
        prs.push({ exerciseId: ex.id, exerciseName: ex.name, kind: 'reps', value: now.maxReps })
    } else if (ex.type === 'duration') {
      if (now.maxDurationSec > prior.maxDurationSec && now.maxDurationSec > 0)
        prs.push({ exerciseId: ex.id, exerciseName: ex.name, kind: 'duration', value: now.maxDurationSec })
    }
  }
  return prs
}

export function prLabel(pr: PersonalRecord, unit: Unit): string {
  switch (pr.kind) {
    case 'weight': return `Heaviest weight: ${fmtWeight(pr.value, unit)}`
    case '1rm': return `Best est. 1RM: ${fmtWeight(pr.value, unit)}`
    case 'volume': return `Best set volume: ${fmtWeight(pr.value, unit)}`
    case 'reps': return `Most reps: ${pr.value}`
    case 'duration': return `Longest duration: ${fmtDuration(pr.value)}`
  }
}

/** The most recent completed sets for an exercise, used as the "previous" column. */
export function previousSets(
  exerciseId: string,
  history: Workout[],
): SetEntry[] | null {
  const sorted = [...history].sort((a, b) => b.startedAt - a.startedAt)
  for (const w of sorted) {
    for (const entry of w.entries) {
      if (entry.exerciseId !== exerciseId) continue
      const done = entry.sets.filter(s => s.completed)
      if (done.length > 0) return done
    }
  }
  return null
}

let audioCtx: AudioContext | null = null
export function playBeep() {
  try {
    audioCtx ??= new AudioContext()
    const now = audioCtx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, now + i * 0.25)
      gain.gain.exponentialRampToValueAtTime(0.4, now + i * 0.25 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.25 + 0.2)
      osc.connect(gain).connect(audioCtx.destination)
      osc.start(now + i * 0.25)
      osc.stop(now + i * 0.25 + 0.22)
    }
  } catch {
    // audio unavailable — ignore
  }
}
