import { useMemo, useState } from 'react'
import type { Exercise, MuscleGroup } from '../types'
import { useStore } from '../store'
import Modal from './Modal'
import ExerciseForm from './ExerciseForm'

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Cardio', 'Full Body', 'Other',
]

interface ExercisePickerProps {
  onAdd: (exercises: Exercise[]) => void
  onClose: () => void
  multi?: boolean
}

export default function ExercisePicker({ onAdd, onClose, multi = true }: ExercisePickerProps) {
  const { exercises } = useStore()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'All'>('All')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter(ex =>
      (muscle === 'All' || ex.muscleGroup === muscle) &&
      (q === '' || ex.name.toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q)))
  }, [exercises, query, muscle])

  function toggle(ex: Exercise) {
    if (!multi) {
      onAdd([ex])
      return
    }
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(ex.id)) next.delete(ex.id)
      else next.add(ex.id)
      return next
    })
  }

  function confirm() {
    const picked = exercises.filter(ex => selected.has(ex.id))
    if (picked.length > 0) onAdd(picked)
  }

  return (
    <Modal
      title="Select exercises"
      onClose={onClose}
      full
      headerAction={
        <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>+ New</button>
      }
      footer={multi ? (
        <button className="btn btn-primary btn-block" disabled={selected.size === 0} onClick={confirm}>
          Add {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      ) : undefined}
    >
      <input
        className="text-input search-input"
        placeholder="Search exercises…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoFocus
      />
      <div className="chip-row">
        {(['All', ...MUSCLE_GROUPS] as const).map(m => (
          <button
            key={m}
            className={`chip ${muscle === m ? 'chip-active' : ''}`}
            onClick={() => setMuscle(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="picker-list">
        {filtered.map(ex => (
          <button
            key={ex.id}
            className={`picker-item ${selected.has(ex.id) ? 'picker-item-selected' : ''}`}
            onClick={() => toggle(ex)}
          >
            <div className="picker-item-main">
              <span className="picker-item-name">{ex.name}{ex.isCustom ? ' ★' : ''}</span>
              <span className="picker-item-sub">{ex.muscleGroup} · {ex.equipment}</span>
            </div>
            {multi && <span className="picker-check">{selected.has(ex.id) ? '✓' : ''}</span>}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="empty-note">
            No exercises match. <button className="link-btn" onClick={() => setCreating(true)}>Create one?</button>
          </div>
        )}
      </div>
      {creating && (
        <ExerciseForm
          onClose={() => setCreating(false)}
          onSaved={ex => {
            setCreating(false)
            if (multi) setSelected(prev => new Set(prev).add(ex.id))
            else onAdd([ex])
          }}
        />
      )}
    </Modal>
  )
}

export { MUSCLE_GROUPS }
