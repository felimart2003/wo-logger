/* eslint-disable react-refresh/only-export-components -- This module intentionally co-locates the store provider and its typed hook. */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ReactNode } from 'react'
import { SEED_EXERCISES } from './data/exercises'
import type {
  ActiveWorkout, BodyWeightEntry, Exercise, ExerciseEntry, RestTimer,
  Routine, SetEntry, Settings, Workout,
} from './types'
import { uid } from './utils'

import { validBackup, validStored } from './validation'

const LS_PREFIX = 'wo-logger.'

function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key)
      const parsed: unknown = raw != null ? JSON.parse(raw) : initial
      return validStored(key, parsed) ? parsed as T : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
    } catch {
      window.dispatchEvent(new Event('wo-logger-storage-error'))
    }
  }, [key, value])
  return [value, setValue] as const
}

export function emptySet(): SetEntry {
  return { id: uid(), kind: 'normal', weightKg: null, reps: null, durationSec: null, completed: false }
}

export function emptyEntry(exerciseId: string, restSec: number): ExerciseEntry {
  return { id: uid(), exerciseId, notes: '', restSec, sets: [emptySet()] }
}

interface StoreValue {
  exercises: Exercise[]
  exerciseById: Map<string, Exercise>
  addExercise: (ex: Omit<Exercise, 'id' | 'isCustom'>) => Exercise
  updateExercise: (ex: Exercise) => void
  deleteExercise: (id: string) => void

  routines: Routine[]
  saveRoutine: (r: Routine) => void
  deleteRoutine: (id: string) => void
  toggleBookmark: (id: string) => void

  history: Workout[]
  saveWorkout: (w: Workout) => void
  updateWorkout: (w: Workout) => void
  deleteWorkout: (id: string) => void

  active: ActiveWorkout | null
  setActive: (a: ActiveWorkout | null | ((prev: ActiveWorkout | null) => ActiveWorkout | null)) => void
  startEmptyWorkout: () => void
  startFromRoutine: (r: Routine) => void

  bodyWeights: BodyWeightEntry[]
  addBodyWeight: (date: string, weightKg: number) => void
  deleteBodyWeight: (id: string) => void

  settings: Settings
  setSettings: (s: Settings) => void

  rest: RestTimer | null
  startRest: (sec: number) => void
  adjustRest: (deltaSec: number) => void
  stopRest: () => void

  exportData: () => string
  importData: (json: string) => boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [customExercises, setCustomExercises] = useStored<Exercise[]>('customExercises', [])
  const [routines, setRoutines] = useStored<Routine[]>('routines', [])
  const [history, setHistory] = useStored<Workout[]>('history', [])
  const [active, setActive] = useStored<ActiveWorkout | null>('activeWorkout', null)
  const [bodyWeights, setBodyWeights] = useStored<BodyWeightEntry[]>('bodyWeights', [])
  const [settings, setSettings] = useStored<Settings>('settings', { unit: 'kg', defaultRestSec: 90 })
  const [rest, setRest] = useState<RestTimer | null>(null)

  const exercises = useMemo(() => {
    const all = [...SEED_EXERCISES, ...customExercises]
    return all.sort((a, b) => a.name.localeCompare(b.name))
  }, [customExercises])

  const exerciseById = useMemo(() => {
    const m = new Map<string, Exercise>()
    for (const ex of exercises) m.set(ex.id, ex)
    return m
  }, [exercises])

  const addExercise = useCallback((ex: Omit<Exercise, 'id' | 'isCustom'>) => {
    const created: Exercise = { ...ex, id: 'custom-' + uid(), isCustom: true }
    setCustomExercises(prev => [...prev, created])
    return created
  }, [setCustomExercises])

  const updateExercise = useCallback((ex: Exercise) => {
    setCustomExercises(prev => prev.map(p => (p.id === ex.id ? ex : p)))
  }, [setCustomExercises])

  const deleteExercise = useCallback((id: string) => {
    setCustomExercises(prev => prev.filter(p => p.id !== id))
  }, [setCustomExercises])

  const saveRoutine = useCallback((r: Routine) => {
    setRoutines(prev => {
      const exists = prev.some(p => p.id === r.id)
      return exists ? prev.map(p => (p.id === r.id ? r : p)) : [...prev, r]
    })
  }, [setRoutines])

  const deleteRoutine = useCallback((id: string) => {
    setRoutines(prev => prev.filter(p => p.id !== id))
  }, [setRoutines])

  const toggleBookmark = useCallback((id: string) => {
    setRoutines(prev => prev.map(p => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)))
  }, [setRoutines])

  const saveWorkout = useCallback((w: Workout) => {
    setHistory(prev => [...prev.filter(p => p.id !== w.id), w].sort((a, b) => b.startedAt - a.startedAt))
  }, [setHistory])

  const updateWorkout = saveWorkout

  const deleteWorkout = useCallback((id: string) => {
    setHistory(prev => prev.filter(p => p.id !== id))
  }, [setHistory])

  const startEmptyWorkout = useCallback(() => {
    setActive({ id: uid(), name: 'Workout', startedAt: Date.now(), notes: '', entries: [] })
  }, [setActive])

  const startFromRoutine = useCallback((r: Routine) => {
    const entries: ExerciseEntry[] = r.entries.map(entry => ({
      id: uid(),
      exerciseId: entry.exerciseId,
      notes: entry.notes,
      restSec: entry.restSec,
      sets: entry.sets.map(s => ({ ...s, id: uid(), completed: false })),
    }))
    setActive({ id: uid(), name: r.name, startedAt: Date.now(), notes: '', entries, routineId: r.id })
    setRoutines(prev => prev.map(p => (p.id === r.id ? { ...p, lastUsedAt: Date.now() } : p)))
  }, [setActive, setRoutines])

  const addBodyWeight = useCallback((date: string, weightKg: number) => {
    setBodyWeights(prev => {
      const withoutDay = prev.filter(p => p.date !== date)
      return [...withoutDay, { id: uid(), date, weightKg }].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [setBodyWeights])

  const deleteBodyWeight = useCallback((id: string) => {
    setBodyWeights(prev => prev.filter(p => p.id !== id))
  }, [setBodyWeights])

  const startRest = useCallback((sec: number) => {
    if (sec <= 0) return
    setRest({ endsAt: Date.now() + sec * 1000, totalSec: sec })
  }, [])

  const adjustRest = useCallback((deltaSec: number) => {
    setRest(prev => {
      if (!prev) return prev
      const endsAt = Math.max(Date.now(), prev.endsAt + deltaSec * 1000)
      return { endsAt, totalSec: Math.max(1, prev.totalSec + deltaSec) }
    })
  }, [])

  const stopRest = useCallback(() => setRest(null), [])

  const exportData = useCallback(() => {
    return JSON.stringify({
      app: 'wo-logger',
      version: 1,
      exportedAt: new Date().toISOString(),
      customExercises, routines, history, bodyWeights, settings,
    }, null, 2)
  }, [customExercises, routines, history, bodyWeights, settings])

  const importData = useCallback((json: string) => {
    try {
      const data = JSON.parse(json)
      if (!validBackup(data)) return false
      if (Array.isArray(data.customExercises)) setCustomExercises(data.customExercises)
      if (Array.isArray(data.routines)) setRoutines(data.routines)
      if (Array.isArray(data.history)) setHistory(data.history)
      if (Array.isArray(data.bodyWeights)) setBodyWeights(data.bodyWeights)
      if (data.settings) setSettings(data.settings)
      return true
    } catch {
      return false
    }
  }, [setCustomExercises, setRoutines, setHistory, setBodyWeights, setSettings])

  const value: StoreValue = {
    exercises, exerciseById, addExercise, updateExercise, deleteExercise,
    routines, saveRoutine, deleteRoutine, toggleBookmark,
    history, saveWorkout, updateWorkout, deleteWorkout,
    active, setActive, startEmptyWorkout, startFromRoutine,
    bodyWeights, addBodyWeight, deleteBodyWeight,
    settings, setSettings,
    rest, startRest, adjustRest, stopRest,
    exportData, importData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
