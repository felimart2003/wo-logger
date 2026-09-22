import type { Exercise, ExerciseEntry, SetEntry, Settings, Workout, Routine, BodyWeightEntry, ActiveWorkout } from './types'
type Obj = Record<string, unknown>
const obj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown): v is string => typeof v === 'string' && v.length <= 100000
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const nullable = (v: unknown) => v === null || num(v)
const list = <T,>(v: unknown, check: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.length <= 50000 && v.every(check) && new Set(v.map(x => (x as Obj).id)).size === v.length
export const validSet = (v: unknown): v is SetEntry => obj(v) && str(v.id) && ['normal','warmup','drop','failure'].includes(String(v.kind)) && nullable(v.weightKg) && nullable(v.reps) && nullable(v.durationSec) && typeof v.completed === 'boolean'
export const validEntry = (v: unknown): v is ExerciseEntry => obj(v) && str(v.id) && str(v.exerciseId) && str(v.notes) && num(v.restSec) && list(v.sets, validSet)
export const validExercise = (v: unknown): v is Exercise => obj(v) && str(v.id) && str(v.name) && str(v.muscleGroup) && str(v.equipment) && ['weight_reps','reps_only','duration','weighted_duration'].includes(String(v.type))
export const validActive = (v: unknown): v is ActiveWorkout => obj(v) && str(v.id) && str(v.name) && str(v.notes) && num(v.startedAt) && list(v.entries, validEntry)
export const validWorkout = (v: unknown): v is Workout => validActive(v) && obj(v) && num(v.endedAt) && v.endedAt >= v.startedAt
export const validRoutine = (v: unknown): v is Routine => obj(v) && str(v.id) && str(v.name) && str(v.notes) && num(v.createdAt) && nullable(v.lastUsedAt) && typeof v.bookmarked === 'boolean' && list(v.entries, validEntry)
export const validWeight = (v: unknown): v is BodyWeightEntry => obj(v) && str(v.id) && typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && Number.isFinite(Date.parse(v.date)) && num(v.weightKg) && v.weightKg > 0
export const validSettings = (v: unknown): v is Settings => obj(v) && ['kg','lb'].includes(String(v.unit)) && num(v.defaultRestSec) && v.defaultRestSec <= 3600
export function validStored(key: string, value: unknown): boolean {
 switch(key) {
 case 'customExercises': return list(value, validExercise)
 case 'routines': return list(value, validRoutine)
 case 'history': return list(value, validWorkout)
 case 'bodyWeights': return list(value, validWeight)
 case 'settings': return validSettings(value)
 case 'activeWorkout': return value === null || validActive(value)
 default: return false
 }
}
export interface Backup { app: string; version: number; customExercises: Exercise[]; routines: Routine[]; history: Workout[]; bodyWeights: BodyWeightEntry[]; settings: Settings }
export function validBackup(v: unknown): v is Backup {
 return obj(v) && v.app === 'wo-logger' && v.version === 1 && ['customExercises','routines','history','bodyWeights','settings'].every(key => validStored(key, v[key]))
}
