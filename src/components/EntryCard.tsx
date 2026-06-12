import type { Exercise, ExerciseEntry, SetEntry, Unit } from '../types'
import { emptySet } from '../store'
import NumInput from './NumInput'
import {
  displayToKg, fmtNum, fmtWeight, kgToDisplay, nextSetKind, setKindLabel, uid,
} from '../utils'

const REST_OPTIONS = [0, 30, 45, 60, 90, 120, 150, 180, 240, 300]

interface EntryCardProps {
  entry: ExerciseEntry
  exercise: Exercise | undefined
  unit: Unit
  /** 'routine' = template editing, 'active' = live logging, 'history' = editing a past workout */
  mode: 'routine' | 'active' | 'history'
  prevSets?: SetEntry[] | null
  onChange: (entry: ExerciseEntry) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onSetCompleted?: (entry: ExerciseEntry) => void
}

export default function EntryCard({
  entry, exercise, unit, mode, prevSets, onChange, onRemove, onMoveUp, onMoveDown, onSetCompleted,
}: EntryCardProps) {
  const type = exercise?.type ?? 'weight_reps'
  const hasWeight = type === 'weight_reps' || type === 'weighted_duration'
  const hasReps = type === 'weight_reps' || type === 'reps_only'
  const hasDuration = type === 'duration' || type === 'weighted_duration'
  const isLive = mode === 'active' || mode === 'history'

  function updateSet(id: string, patch: Partial<SetEntry>) {
    onChange({ ...entry, sets: entry.sets.map(s => (s.id === id ? { ...s, ...patch } : s)) })
  }

  function toggleComplete(s: SetEntry) {
    const completed = !s.completed
    const updated = {
      ...entry,
      sets: entry.sets.map(x => (x.id === s.id ? { ...x, completed } : x)),
    }
    onChange(updated)
    if (completed && mode === 'active') onSetCompleted?.(updated)
  }

  function addSet() {
    const last = entry.sets[entry.sets.length - 1]
    const next: SetEntry = last
      ? { ...last, id: uid(), completed: false, kind: last.kind === 'warmup' ? 'normal' : last.kind }
      : emptySet()
    onChange({ ...entry, sets: [...entry.sets, next] })
  }

  function removeSet(id: string) {
    onChange({ ...entry, sets: entry.sets.filter(s => s.id !== id) })
  }

  function fillFromPrev(s: SetEntry, prev: SetEntry) {
    updateSet(s.id, {
      weightKg: prev.weightKg,
      reps: prev.reps,
      durationSec: prev.durationSec,
    })
  }

  let normalCount = 0

  return (
    <div className="entry-card">
      <div className="entry-header">
        <div className="entry-title">
          <span className="entry-name">{exercise?.name ?? 'Unknown exercise'}</span>
          <span className="entry-sub">{exercise ? `${exercise.muscleGroup} · ${exercise.equipment}` : ''}</span>
        </div>
        <div className="entry-actions">
          {onMoveUp && <button className="icon-btn" onClick={onMoveUp} title="Move up">↑</button>}
          {onMoveDown && <button className="icon-btn" onClick={onMoveDown} title="Move down">↓</button>}
          <button className="icon-btn icon-btn-danger" onClick={onRemove} title="Remove exercise">✕</button>
        </div>
      </div>

      <input
        className="text-input notes-input"
        placeholder="Add notes here…"
        value={entry.notes}
        onChange={e => onChange({ ...entry, notes: e.target.value })}
      />

      {mode !== 'history' && (
        <label className="rest-select">
          <span>⏱ Rest timer:</span>
          <select
            className="select-input select-inline"
            value={entry.restSec}
            onChange={e => onChange({ ...entry, restSec: Number(e.target.value) })}
          >
            {REST_OPTIONS.map(r => (
              <option key={r} value={r}>{r === 0 ? 'Off' : r < 60 ? `${r}s` : `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`}</option>
            ))}
          </select>
        </label>
      )}

      <div className={`set-table ${isLive ? 'set-table-live' : ''}`}>
        <div className="set-row set-row-head">
          <span>Set</span>
          {mode === 'active' && <span>Previous</span>}
          {hasWeight && <span>{unit === 'kg' ? 'kg' : 'lb'}</span>}
          {hasReps && <span>Reps</span>}
          {hasDuration && <span>Sec</span>}
          <span />
        </div>
        {entry.sets.map((s, i) => {
          if (s.kind === 'normal') normalCount += 1
          const label = setKindLabel(s.kind, normalCount)
          const prev = prevSets?.[i]
          return (
            <div className={`set-row ${s.completed && isLive ? 'set-row-done' : ''}`} key={s.id}>
              <button
                className={`set-kind set-kind-${s.kind}`}
                onClick={() => updateSet(s.id, { kind: nextSetKind(s.kind) })}
                title="Tap to change set type (Warmup / Drop / Failure)"
              >
                {label}
              </button>
              {mode === 'active' && (
                <button
                  className="prev-btn"
                  disabled={!prev}
                  onClick={() => prev && fillFromPrev(s, prev)}
                  title="Tap to fill from previous"
                >
                  {prev ? prevLabel(prev, unit, hasWeight, hasReps, hasDuration) : '—'}
                </button>
              )}
              {hasWeight && (
                <NumInput
                  value={s.weightKg == null ? null : kgToDisplay(s.weightKg, unit)}
                  onChange={v => updateSet(s.id, { weightKg: v == null ? null : displayToKg(v, unit) })}
                  placeholder={prev?.weightKg != null ? fmtNum(kgToDisplay(prev.weightKg, unit)) : '0'}
                />
              )}
              {hasReps && (
                <NumInput
                  value={s.reps}
                  onChange={v => updateSet(s.id, { reps: v })}
                  placeholder={prev?.reps != null ? String(prev.reps) : '0'}
                  integer
                />
              )}
              {hasDuration && (
                <NumInput
                  value={s.durationSec}
                  onChange={v => updateSet(s.id, { durationSec: v })}
                  placeholder="0"
                  integer
                />
              )}
              <div className="set-row-end">
                {isLive && (
                  <button
                    className={`check-btn ${s.completed ? 'check-btn-on' : ''}`}
                    onClick={() => toggleComplete(s)}
                    title="Mark set complete"
                  >
                    ✓
                  </button>
                )}
                <button className="icon-btn icon-btn-dim" onClick={() => removeSet(s.id)} title="Delete set">✕</button>
              </div>
            </div>
          )
        })}
      </div>

      <button className="btn btn-ghost btn-block btn-sm" onClick={addSet}>+ Add set</button>
    </div>
  )
}

function prevLabel(
  prev: SetEntry, unit: Unit, hasWeight: boolean, hasReps: boolean, hasDuration: boolean,
): string {
  const parts: string[] = []
  if (hasWeight && prev.weightKg != null) parts.push(fmtWeight(prev.weightKg, unit))
  if (hasReps && prev.reps != null) parts.push(`${prev.reps}`)
  if (hasDuration && prev.durationSec != null) parts.push(`${prev.durationSec}s`)
  if (parts.length === 0) return '—'
  return hasWeight && hasReps ? parts.join(' × ') : parts.join(' ')
}
