export type Unit = 'kg' | 'lb'

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Forearms'
  | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Abs' | 'Cardio'
  | 'Full Body' | 'Other'

export type Equipment =
  | 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight'
  | 'Kettlebell' | 'Band' | 'Smith Machine' | 'Other'

/** How the exercise is logged */
export type ExerciseType = 'weight_reps' | 'reps_only' | 'duration' | 'weighted_duration'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  type: ExerciseType
  isCustom?: boolean
}

export type SetKind = 'normal' | 'warmup' | 'drop' | 'failure'

export interface SetEntry {
  id: string
  kind: SetKind
  weightKg: number | null
  reps: number | null
  durationSec: number | null
  completed: boolean
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  notes: string
  restSec: number
  sets: SetEntry[]
}

export interface Workout {
  id: string
  name: string
  startedAt: number
  endedAt: number
  notes: string
  entries: ExerciseEntry[]
}

export interface ActiveWorkout {
  id: string
  name: string
  startedAt: number
  notes: string
  entries: ExerciseEntry[]
  routineId?: string
}

export interface Routine {
  id: string
  name: string
  notes: string
  entries: ExerciseEntry[]
  bookmarked: boolean
  createdAt: number
  lastUsedAt: number | null
}

export interface BodyWeightEntry {
  id: string
  /** YYYY-MM-DD */
  date: string
  weightKg: number
}

export interface Settings {
  unit: Unit
  defaultRestSec: number
}

export interface RestTimer {
  endsAt: number
  totalSec: number
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  kind: 'weight' | '1rm' | 'volume' | 'reps' | 'duration'
  value: number
}
