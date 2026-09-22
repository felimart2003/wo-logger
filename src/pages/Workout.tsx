import { useEffect, useMemo, useState } from 'react'
import type { Exercise, ExerciseEntry, PersonalRecord, Routine, Workout } from '../types'
import { emptySet, useStore } from '../store'
import Modal from '../components/Modal'
import EntryCard from '../components/EntryCard'
import ExercisePicker from '../components/ExercisePicker'
import {
  detectPRs, fmtClock, fmtDuration, fmtWeight, prLabel, previousSets, uid,
  workoutSetCount, workoutVolumeKg,
} from '../utils'

export default function WorkoutPage({ goToTab }: { goToTab: (tab: string) => void }) {
  const { active } = useStore()
  const [summary, setSummary] = useState<{ workout: Workout; prs: PersonalRecord[] } | null>(null)

  return (
    <div className="page">
      {active
        ? <ActiveWorkoutView onFinished={(workout, prs) => setSummary({ workout, prs })} />
        : <StartScreen />}
      {summary && (
        <FinishSummary
          workout={summary.workout}
          prs={summary.prs}
          onClose={() => { setSummary(null); goToTab('history') }}
        />
      )}
    </div>
  )
}

/* ---------------- Start screen + routines ---------------- */

function StartScreen() {
  const { routines, startEmptyWorkout, startFromRoutine, toggleBookmark, deleteRoutine, saveRoutine, exerciseById } = useStore()
  const [editing, setEditing] = useState<Routine | null>(null)
  const [creating, setCreating] = useState(false)

  const favourites = routines.filter(r => r.bookmarked).sort((a, b) => a.name.localeCompare(b.name))
  const others = routines.filter(r => !r.bookmarked).sort((a, b) => a.name.localeCompare(b.name))

  function duplicate(r: Routine) {
    saveRoutine({
      ...r,
      id: uid(),
      name: `${r.name} (copy)`,
      bookmarked: false,
      createdAt: Date.now(),
      lastUsedAt: null,
      entries: r.entries.map(e => ({ ...e, id: uid(), sets: e.sets.map(s => ({ ...s, id: uid() })) })),
    })
  }

  function routineCard(r: Routine) {
    const names = r.entries
      .map(e => exerciseById.get(e.exerciseId)?.name ?? 'Unknown')
      .join(', ')
    return (
      <div className="card routine-card" key={r.id}>
        <div className="routine-top">
          <div className="routine-info">
            <div className="routine-name">{r.name}</div>
            <div className="routine-sub">{r.entries.length} exercises{names ? ` · ${names}` : ''}</div>
            {r.lastUsedAt && (
              <div className="routine-sub">
                Last used {new Date(r.lastUsedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
          <button
            className={`star-btn ${r.bookmarked ? 'star-on' : ''}`}
            onClick={() => toggleBookmark(r.id)}
            title={r.bookmarked ? 'Remove bookmark' : 'Bookmark routine'}
          >
            {r.bookmarked ? '★' : '☆'}
          </button>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary btn-sm" onClick={() => startFromRoutine(r)}>Start routine</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={() => duplicate(r)}>Duplicate</button>
          <button
            className="btn btn-ghost btn-sm btn-text-danger"
            onClick={() => { if (window.confirm(`Delete routine "${r.name}"?`)) deleteRoutine(r.id) }}
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header"><h1>Workout</h1></div>

      <button className="btn btn-primary btn-block btn-lg" onClick={startEmptyWorkout}>
        + Start empty workout
      </button>

      <div className="section-header">
        <h2>Routines</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>+ New routine</button>
      </div>

      {routines.length === 0 && (
        <p className="empty-note">
          Build your own workout templates here — pick exercises, preset the sets, then start
          them with one tap. Bookmark your favourites with the ★ to pin them on top.
        </p>
      )}

      {favourites.length > 0 && (
        <>
          <h3 className="subsection">★ Bookmarked</h3>
          {favourites.map(routineCard)}
        </>
      )}
      {others.length > 0 && (
        <>
          {favourites.length > 0 && <h3 className="subsection">All routines</h3>}
          {others.map(routineCard)}
        </>
      )}

      {(creating || editing) && (
        <RoutineEditor
          existing={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null) }}
        />
      )}
    </>
  )
}

/* ---------------- Routine editor ---------------- */

export function RoutineEditor({ existing, initialEntries, initialName, onClose }: {
  existing?: Routine
  initialEntries?: ExerciseEntry[]
  initialName?: string
  onClose: () => void
}) {
  const { saveRoutine, exerciseById, settings } = useStore()
  const [name, setName] = useState(existing?.name ?? initialName ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [entries, setEntries] = useState<ExerciseEntry[]>(existing?.entries ?? initialEntries ?? [])
  const [picking, setPicking] = useState(false)

  function addExercises(list: Exercise[]) {
    setEntries(prev => [
      ...prev,
      ...list.map(ex => ({
        id: uid(), exerciseId: ex.id, notes: '', restSec: settings.defaultRestSec, sets: [emptySet()],
      })),
    ])
    setPicking(false)
  }

  function move(i: number, dir: -1 | 1) {
    setEntries(prev => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function save() {
    const trimmed = name.trim()
    if (!trimmed || entries.length === 0) return
    saveRoutine({
      id: existing?.id ?? uid(),
      name: trimmed,
      notes,
      entries,
      bookmarked: existing?.bookmarked ?? false,
      createdAt: existing?.createdAt ?? Date.now(),
      lastUsedAt: existing?.lastUsedAt ?? null,
    })
    onClose()
  }

  return (
    <Modal
      title={existing ? 'Edit routine' : 'New routine'}
      onClose={onClose}
      full
      footer={
        <button
          className="btn btn-primary btn-block"
          disabled={!name.trim() || entries.length === 0}
          onClick={save}
        >
          Save routine
        </button>
      }
    >
      <label className="field">
        <span>Routine name</span>
        <input
          className="text-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Push Day A"
          autoFocus={!existing}
        />
      </label>
      <input
        className="text-input notes-input"
        placeholder="Routine notes (optional)…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      {entries.map((entry, i) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          exercise={exerciseById.get(entry.exerciseId)}
          unit={settings.unit}
          mode="routine"
          onChange={updated => setEntries(prev => prev.map(p => (p.id === updated.id ? updated : p)))}
          onRemove={() => setEntries(prev => prev.filter(p => p.id !== entry.id))}
          onMoveUp={i > 0 ? () => move(i, -1) : undefined}
          onMoveDown={i < entries.length - 1 ? () => move(i, 1) : undefined}
        />
      ))}

      <button className="btn btn-ghost btn-block" onClick={() => setPicking(true)}>+ Add exercises</button>

      {picking && <ExercisePicker onAdd={addExercises} onClose={() => setPicking(false)} />}
    </Modal>
  )
}

/* ---------------- Active workout ---------------- */

function ActiveWorkoutView({ onFinished }: {
  onFinished: (w: Workout, prs: PersonalRecord[]) => void
}) {
  const {
    active, setActive, history, exerciseById, settings, saveWorkout, startRest, stopRest,
  } = useStore()
  const [picking, setPicking] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const prevByExercise = useMemo(() => {
    const m = new Map<string, ReturnType<typeof previousSets>>()
    if (active) {
      for (const entry of active.entries) {
        if (!m.has(entry.exerciseId)) m.set(entry.exerciseId, previousSets(entry.exerciseId, history))
      }
    }
    return m
  }, [active, history])

  if (!active) return null

  const elapsed = (now - active.startedAt) / 1000
  const volume = workoutVolumeKg(active)
  const sets = workoutSetCount(active)

  function updateEntry(updated: ExerciseEntry) {
    setActive(prev => prev && ({
      ...prev,
      entries: prev.entries.map(e => (e.id === updated.id ? updated : e)),
    }))
  }

  function addExercises(list: Exercise[]) {
    setActive(prev => prev && ({
      ...prev,
      entries: [
        ...prev.entries,
        ...list.map(ex => ({
          id: uid(), exerciseId: ex.id, notes: '', restSec: settings.defaultRestSec, sets: [emptySet()],
        })),
      ],
    }))
    setPicking(false)
  }

  function move(i: number, dir: -1 | 1) {
    setActive(prev => {
      if (!prev) return prev
      const next = [...prev.entries]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...prev, entries: next }
    })
  }

  function discard() {
    if (!window.confirm('Discard this workout? All logged sets will be lost.')) return
    stopRest()
    setActive(null)
  }

  function finish() {
    if (!active) return
    const cleanedEntries = active.entries
      .map(e => ({ ...e, sets: e.sets.filter(s => s.completed) }))
      .filter(e => e.sets.length > 0)
    if (cleanedEntries.length === 0) {
      window.alert('Complete at least one set (tap the ✓) before finishing — or discard the workout.')
      return
    }
    const workout: Workout = {
      id: active.id,
      name: active.name.trim() || 'Workout',
      startedAt: active.startedAt,
      endedAt: Date.now(),
      notes: active.notes,
      entries: cleanedEntries,
    }
    const prs = detectPRs(workout, history, exerciseById)
    saveWorkout(workout)
    stopRest()
    setActive(null)
    onFinished(workout, prs)
  }

  return (
    <>
      <div className="active-header">
        <div className="active-timer">{fmtClock(elapsed)}</div>
        <div className="btn-row">
          <button className="btn btn-ghost btn-sm btn-text-danger" onClick={discard}>Discard</button>
          <button className="btn btn-success btn-sm" onClick={finish}>Finish</button>
        </div>
      </div>

      <input
        className="text-input title-input"
        value={active.name}
        onChange={e => setActive(prev => prev && { ...prev, name: e.target.value })}
        placeholder="Workout name"
      />
      <input
        className="text-input notes-input"
        value={active.notes}
        onChange={e => setActive(prev => prev && { ...prev, notes: e.target.value })}
        placeholder="Workout notes…"
      />

      <div className="active-stats">
        <span><strong>{fmtWeight(volume, settings.unit)}</strong> volume</span>
        <span><strong>{sets}</strong> sets done</span>
      </div>

      {active.entries.map((entry, i) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          exercise={exerciseById.get(entry.exerciseId)}
          unit={settings.unit}
          mode="active"
          prevSets={prevByExercise.get(entry.exerciseId) ?? null}
          onChange={updateEntry}
          onRemove={() => setActive(prev => prev && ({ ...prev, entries: prev.entries.filter(e => e.id !== entry.id) }))}
          onMoveUp={i > 0 ? () => move(i, -1) : undefined}
          onMoveDown={i < active.entries.length - 1 ? () => move(i, 1) : undefined}
          onSetCompleted={e => { if (e.restSec > 0) startRest(e.restSec) }}
        />
      ))}

      <button className="btn btn-ghost btn-block" onClick={() => setPicking(true)}>+ Add exercises</button>

      {picking && <ExercisePicker onAdd={addExercises} onClose={() => setPicking(false)} />}
    </>
  )
}

/* ---------------- Finish summary ---------------- */

function FinishSummary({ workout, prs, onClose }: {
  workout: Workout
  prs: PersonalRecord[]
  onClose: () => void
}) {
  const { settings } = useStore()
  return (
    <Modal
      title="Workout complete 🎉"
      onClose={onClose}
      footer={<button className="btn btn-primary btn-block" onClick={onClose}>Done</button>}
    >
      <div className="summary-name">{workout.name}</div>
      <div className="stat-grid">
        <div className="stat-box">
          <span className="stat-value">{fmtDuration((workout.endedAt - workout.startedAt) / 1000)}</span>
          <span className="stat-label">Duration</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{fmtWeight(workoutVolumeKg(workout), settings.unit)}</span>
          <span className="stat-label">Volume</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{workoutSetCount(workout)}</span>
          <span className="stat-label">Sets</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{prs.length}</span>
          <span className="stat-label">PRs 🏆</span>
        </div>
      </div>
      {prs.length > 0 && (
        <>
          <h3 className="subsection">Personal records</h3>
          {prs.map((pr, i) => (
            <div className="pr-row" key={i}>
              <span className="pr-trophy">🏆</span>
              <div>
                <div className="recent-name">{pr.exerciseName}</div>
                <div className="recent-sub">{prLabel(pr, settings.unit)}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </Modal>
  )
}
