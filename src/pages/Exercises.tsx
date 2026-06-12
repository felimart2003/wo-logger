import { useMemo, useState } from 'react'
import type { Exercise, MuscleGroup, Workout } from '../types'
import { useStore } from '../store'
import Modal from '../components/Modal'
import ExerciseForm from '../components/ExerciseForm'
import { MUSCLE_GROUPS } from '../components/ExercisePicker'
import { LineChart } from '../components/Charts'
import {
  epley1RM, exerciseBests, fmtDateTime, fmtDuration, fmtNum, fmtWeight, kgToDisplay,
} from '../utils'

export default function ExercisesPage() {
  const { exercises, history } = useStore()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'All'>('All')
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const usageCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of history)
      for (const e of w.entries)
        m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1)
    return m
  }, [history])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter(ex =>
      (muscle === 'All' || ex.muscleGroup === muscle) &&
      (q === '' || ex.name.toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q)))
  }, [exercises, query, muscle])

  const open = exercises.find(ex => ex.id === openId) ?? null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Exercises</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ New exercise</button>
      </div>

      <input
        className="text-input search-input"
        placeholder="Search exercises…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div className="chip-row">
        {(['All', ...MUSCLE_GROUPS] as const).map(m => (
          <button key={m} className={`chip ${muscle === m ? 'chip-active' : ''}`} onClick={() => setMuscle(m)}>
            {m}
          </button>
        ))}
      </div>

      <div className="picker-list">
        {filtered.map(ex => (
          <button key={ex.id} className="picker-item" onClick={() => setOpenId(ex.id)}>
            <div className="picker-item-main">
              <span className="picker-item-name">{ex.name}{ex.isCustom ? ' ★' : ''}</span>
              <span className="picker-item-sub">{ex.muscleGroup} · {ex.equipment}</span>
            </div>
            <span className="picker-item-sub">
              {usageCount.get(ex.id) ? `${usageCount.get(ex.id)} sessions ›` : '›'}
            </span>
          </button>
        ))}
        {filtered.length === 0 && <div className="empty-note">No exercises match.</div>}
      </div>

      {creating && <ExerciseForm onClose={() => setCreating(false)} />}
      {open && <ExerciseDetail exercise={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}

type Metric = 'weight' | '1rm' | 'volume' | 'reps' | 'duration'

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const { history, deleteExercise, settings } = useStore()
  const unit = settings.unit
  const [editing, setEditing] = useState(false)

  const hasWeight = exercise.type === 'weight_reps' || exercise.type === 'weighted_duration'
  const defaultMetric: Metric = hasWeight ? 'weight' : exercise.type === 'duration' ? 'duration' : 'reps'
  const [metric, setMetric] = useState<Metric>(defaultMetric)

  const sessions = useMemo(() => {
    const out: { workout: Workout; entryIdx: number[] }[] = []
    for (const w of history) {
      const idx = w.entries
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.exerciseId === exercise.id && e.sets.some(s => s.completed))
        .map(({ i }) => i)
      if (idx.length > 0) out.push({ workout: w, entryIdx: idx })
    }
    return out.sort((a, b) => a.workout.startedAt - b.workout.startedAt)
  }, [history, exercise.id])

  const bests = useMemo(
    () => exerciseBests(exercise.id, history),
    [exercise.id, history],
  )

  const totals = useMemo(() => {
    let sets = 0
    let reps = 0
    let volume = 0
    for (const { workout, entryIdx } of sessions) {
      for (const i of entryIdx) {
        for (const s of workout.entries[i].sets) {
          if (!s.completed) continue
          sets++
          reps += s.reps ?? 0
          if (s.weightKg != null && s.reps != null) volume += s.weightKg * s.reps
        }
      }
    }
    return { sessions: sessions.length, sets, reps, volume }
  }, [sessions])

  const points = useMemo(() => sessions.map(({ workout, entryIdx }) => {
    let v = 0
    for (const i of entryIdx) {
      for (const s of workout.entries[i].sets) {
        if (!s.completed) continue
        switch (metric) {
          case 'weight':
            if (s.weightKg != null) v = Math.max(v, s.weightKg)
            break
          case '1rm':
            if (s.weightKg != null && s.reps != null) v = Math.max(v, epley1RM(s.weightKg, s.reps))
            break
          case 'volume':
            if (s.weightKg != null && s.reps != null) v += s.weightKg * s.reps
            break
          case 'reps':
            v += s.reps ?? 0
            break
          case 'duration':
            if (s.durationSec != null) v = Math.max(v, s.durationSec)
            break
        }
      }
    }
    const isWeight = metric === 'weight' || metric === '1rm' || metric === 'volume'
    return { t: workout.startedAt, v: isWeight ? kgToDisplay(v, unit) : v }
  }), [sessions, metric, unit])

  const metricOptions: { value: Metric; label: string }[] = [
    ...(hasWeight ? [
      { value: 'weight' as Metric, label: 'Heaviest weight' },
      { value: '1rm' as Metric, label: 'Est. 1RM' },
      { value: 'volume' as Metric, label: 'Session volume' },
    ] : []),
    ...(exercise.type === 'weight_reps' || exercise.type === 'reps_only'
      ? [{ value: 'reps' as Metric, label: 'Total reps' }] : []),
    ...(exercise.type === 'duration' || exercise.type === 'weighted_duration'
      ? [{ value: 'duration' as Metric, label: 'Longest duration' }] : []),
  ]

  const isWeightMetric = metric === 'weight' || metric === '1rm' || metric === 'volume'

  return (
    <Modal
      title={exercise.name}
      onClose={onClose}
      full
      headerAction={exercise.isCustom ? (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="btn btn-ghost btn-sm btn-text-danger"
            onClick={() => {
              if (!window.confirm(`Delete custom exercise "${exercise.name}"? Past workouts that used it will show "Unknown exercise".`)) return
              deleteExercise(exercise.id)
              onClose()
            }}
          >
            Delete
          </button>
        </>
      ) : undefined}
    >
      <p className="recent-sub">{exercise.muscleGroup} · {exercise.equipment}{exercise.isCustom ? ' · Custom' : ''}</p>

      <h3 className="subsection">Personal records</h3>
      <div className="stat-grid">
        {hasWeight && (
          <>
            <div className="stat-box">
              <span className="stat-value">{bests.maxWeightKg > 0 ? fmtWeight(bests.maxWeightKg, unit) : '—'}</span>
              <span className="stat-label">Heaviest weight</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{bests.best1RMKg > 0 ? fmtWeight(bests.best1RMKg, unit) : '—'}</span>
              <span className="stat-label">Best est. 1RM</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{bests.maxSetVolumeKg > 0 ? fmtWeight(bests.maxSetVolumeKg, unit) : '—'}</span>
              <span className="stat-label">Best set volume</span>
            </div>
          </>
        )}
        {(exercise.type === 'weight_reps' || exercise.type === 'reps_only') && (
          <div className="stat-box">
            <span className="stat-value">{bests.maxReps > 0 ? bests.maxReps : '—'}</span>
            <span className="stat-label">Most reps in a set</span>
          </div>
        )}
        {(exercise.type === 'duration' || exercise.type === 'weighted_duration') && (
          <div className="stat-box">
            <span className="stat-value">{bests.maxDurationSec > 0 ? fmtDuration(bests.maxDurationSec) : '—'}</span>
            <span className="stat-label">Longest duration</span>
          </div>
        )}
      </div>

      <h3 className="subsection">Lifetime totals</h3>
      <div className="stat-grid">
        <div className="stat-box"><span className="stat-value">{totals.sessions}</span><span className="stat-label">Sessions</span></div>
        <div className="stat-box"><span className="stat-value">{totals.sets}</span><span className="stat-label">Sets</span></div>
        <div className="stat-box"><span className="stat-value">{totals.reps}</span><span className="stat-label">Reps</span></div>
        <div className="stat-box"><span className="stat-value">{fmtWeight(totals.volume, unit)}</span><span className="stat-label">Volume</span></div>
      </div>

      <h3 className="subsection">Progress</h3>
      <div className="chip-row">
        {metricOptions.map(o => (
          <button
            key={o.value}
            className={`chip ${metric === o.value ? 'chip-active' : ''}`}
            onClick={() => setMetric(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <LineChart
        points={points}
        formatValue={v => isWeightMetric
          ? `${fmtNum(v)} ${unit}`
          : metric === 'duration' ? fmtDuration(v) : String(Math.round(v))}
      />

      <h3 className="subsection">History</h3>
      {sessions.length === 0 && <p className="empty-note">You haven't logged this exercise yet.</p>}
      {[...sessions].reverse().map(({ workout, entryIdx }) => (
        <div className="card session-card" key={workout.id}>
          <div className="recent-name">{workout.name}</div>
          <div className="recent-sub">{fmtDateTime(workout.startedAt)}</div>
          {entryIdx.flatMap(i => workout.entries[i].sets.filter(s => s.completed)).map((s, j) => (
            <div className="session-set" key={s.id}>
              <span className="session-set-n">{j + 1}</span>
              <span>
                {s.weightKg != null && `${fmtWeight(s.weightKg, unit)}`}
                {s.weightKg != null && s.reps != null && ' × '}
                {s.reps != null && `${s.reps} reps`}
                {s.durationSec != null && ` ${fmtDuration(s.durationSec)}`}
              </span>
              {s.weightKg != null && s.reps != null && (
                <span className="session-set-1rm">1RM ≈ {fmtWeight(epley1RM(s.weightKg, s.reps), unit)}</span>
              )}
            </div>
          ))}
        </div>
      ))}

      {editing && <ExerciseForm existing={exercise} onClose={() => setEditing(false)} />}
    </Modal>
  )
}
