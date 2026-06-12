import { useState } from 'react'
import type { Equipment, Exercise, ExerciseType, MuscleGroup } from '../types'
import { useStore } from '../store'
import Modal from './Modal'

const MUSCLES: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Cardio', 'Full Body', 'Other',
]
const EQUIPMENT: Equipment[] = [
  'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Band', 'Smith Machine', 'Other',
]
const TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'weight_reps', label: 'Weight & reps' },
  { value: 'reps_only', label: 'Reps only (bodyweight)' },
  { value: 'duration', label: 'Duration' },
  { value: 'weighted_duration', label: 'Weight & duration' },
]

interface ExerciseFormProps {
  existing?: Exercise
  onClose: () => void
  onSaved?: (ex: Exercise) => void
}

export default function ExerciseForm({ existing, onClose, onSaved }: ExerciseFormProps) {
  const { addExercise, updateExercise } = useStore()
  const [name, setName] = useState(existing?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(existing?.muscleGroup ?? 'Chest')
  const [equipment, setEquipment] = useState<Equipment>(existing?.equipment ?? 'Barbell')
  const [type, setType] = useState<ExerciseType>(existing?.type ?? 'weight_reps')

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (existing) {
      const updated = { ...existing, name: trimmed, muscleGroup, equipment, type }
      updateExercise(updated)
      onSaved?.(updated)
    } else {
      const created = addExercise({ name: trimmed, muscleGroup, equipment, type })
      onSaved?.(created)
    }
    onClose()
  }

  return (
    <Modal
      title={existing ? 'Edit exercise' : 'New exercise'}
      onClose={onClose}
      footer={
        <button className="btn btn-primary btn-block" disabled={!name.trim()} onClick={save}>
          {existing ? 'Save changes' : 'Create exercise'}
        </button>
      }
    >
      <label className="field">
        <span>Name</span>
        <input
          className="text-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Cable Lateral Raise (Single Arm)"
          autoFocus
        />
      </label>
      <label className="field">
        <span>Muscle group</span>
        <select className="select-input" value={muscleGroup} onChange={e => setMuscleGroup(e.target.value as MuscleGroup)}>
          {MUSCLES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Equipment</span>
        <select className="select-input" value={equipment} onChange={e => setEquipment(e.target.value as Equipment)}>
          {EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Logged as</span>
        <select className="select-input" value={type} onChange={e => setType(e.target.value as ExerciseType)}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
    </Modal>
  )
}
