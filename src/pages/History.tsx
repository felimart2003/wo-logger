import { useMemo, useState } from 'react'
import type { ExerciseEntry, Workout } from '../types'
import { useStore } from '../store'
import Modal from '../components/Modal'
import EntryCard from '../components/EntryCard'
import { RoutineEditor } from './Workout'
import {
  fmtDateTime, fmtDuration, fmtWeight, uid, workoutSetCount, workoutVolumeKg,
} from '../utils'

export default function HistoryPage({ goToTab }: { goToTab: (tab: string) => void }) {
  const { history, exerciseById, settings } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)

  const byMonth = useMemo(() => {
    const groups: { label: string; workouts: Workout[] }[] = []
    for (const w of history) {
      const label = new Date(w.startedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.workouts.push(w)
      else groups.push({ label, workouts: [w] })
    }
    return groups
  }, [history])

  const open = history.find(w => w.id === openId) ?? null

  return (
    <div className="page">
      <div className="page-header"><h1>History</h1></div>

      {history.length === 0 && (
        <p className="empty-note">
          Finished workouts appear here.{' '}
          <button className="link-btn" onClick={() => goToTab('workout')}>Start one now</button>
        </p>
      )}

      {byMonth.map(group => (
        <div key={group.label}>
          <h3 className="subsection">{group.label}</h3>
          {group.workouts.map(w => (
            <button className="card workout-card" key={w.id} onClick={() => setOpenId(w.id)}>
              <div className="workout-card-top">
                <span className="recent-name">{w.name}</span>
                <span className="recent-sub">{fmtDateTime(w.startedAt)}</span>
              </div>
              <div className="workout-card-stats">
                <span>⏱ {fmtDuration((w.endedAt - w.startedAt) / 1000)}</span>
                <span>🏋 {fmtWeight(workoutVolumeKg(w), settings.unit)}</span>
                <span>{workoutSetCount(w)} sets</span>
              </div>
              <div className="workout-card-lines">
                {w.entries.slice(0, 4).map(e => (
                  <div className="recent-sub" key={e.id}>
                    {e.sets.length} × {exerciseById.get(e.exerciseId)?.name ?? 'Unknown exercise'}
                  </div>
                ))}
                {w.entries.length > 4 && <div className="recent-sub">…and {w.entries.length - 4} more</div>}
              </div>
            </button>
          ))}
        </div>
      ))}

      {open && <WorkoutDetail workout={open} onClose={() => setOpenId(null)} goToTab={goToTab} />}
    </div>
  )
}

function WorkoutDetail({ workout, onClose, goToTab }: {
  workout: Workout
  onClose: () => void
  goToTab: (tab: string) => void
}) {
  const { updateWorkout, deleteWorkout, exerciseById, settings, setActive, active } = useStore()
  const [savingAsRoutine, setSavingAsRoutine] = useState(false)

  function repeat() {
    if (active && !window.confirm('A workout is already in progress. Replace it?')) return
    setActive({
      id: uid(),
      name: workout.name,
      startedAt: Date.now(),
      notes: '',
      entries: workout.entries.map(e => ({
        ...e,
        id: uid(),
        sets: e.sets.map(s => ({ ...s, id: uid(), completed: false })),
      })),
    })
    onClose()
    goToTab('workout')
  }

  function remove() {
    if (!window.confirm(`Delete workout "${workout.name}"? This cannot be undone.`)) return
    deleteWorkout(workout.id)
    onClose()
  }

  const routineEntries: ExerciseEntry[] = workout.entries.map(e => ({
    ...e,
    id: uid(),
    sets: e.sets.map(s => ({ ...s, id: uid(), completed: false })),
  }))

  return (
    <Modal
      title={
        <input
          className="text-input title-input title-input-inline"
          value={workout.name}
          onChange={e => updateWorkout({ ...workout, name: e.target.value })}
        />
      }
      onClose={onClose}
      full
      footer={
        <div className="btn-row">
          <button className="btn btn-primary" onClick={repeat}>Repeat workout</button>
          <button className="btn btn-ghost" onClick={() => setSavingAsRoutine(true)}>Save as routine</button>
          <button className="btn btn-ghost btn-text-danger" onClick={remove}>Delete</button>
        </div>
      }
    >
      <p className="recent-sub">
        {fmtDateTime(workout.startedAt)} · {fmtDuration((workout.endedAt - workout.startedAt) / 1000)} ·{' '}
        {fmtWeight(workoutVolumeKg(workout), settings.unit)} volume · {workoutSetCount(workout)} sets
      </p>
      <input
        className="text-input notes-input"
        value={workout.notes}
        onChange={e => updateWorkout({ ...workout, notes: e.target.value })}
        placeholder="Workout notes…"
      />
      <p className="hint">Edits here save instantly to your history.</p>

      {workout.entries.map(entry => (
        <EntryCard
          key={entry.id}
          entry={entry}
          exercise={exerciseById.get(entry.exerciseId)}
          unit={settings.unit}
          mode="history"
          onChange={updated => updateWorkout({
            ...workout,
            entries: workout.entries.map(e => (e.id === updated.id ? updated : e)),
          })}
          onRemove={() => {
            if (!window.confirm('Remove this exercise from the logged workout?')) return
            updateWorkout({ ...workout, entries: workout.entries.filter(e => e.id !== entry.id) })
          }}
        />
      ))}

      {savingAsRoutine && (
        <RoutineEditor
          initialName={workout.name}
          initialEntries={routineEntries}
          onClose={() => setSavingAsRoutine(false)}
        />
      )}
    </Modal>
  )
}
