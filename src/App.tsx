import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store'
import Dashboard from './pages/Dashboard'
import WorkoutPage from './pages/Workout'
import HistoryPage from './pages/History'
import ExercisesPage from './pages/Exercises'
import { fmtClock, playBeep } from './utils'

type Tab = 'dashboard' | 'workout' | 'history' | 'exercises'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'workout', label: 'Workout', icon: '🏋️' },
  { id: 'history', label: 'History', icon: '🗓' },
  { id: 'exercises', label: 'Exercises', icon: '💪' },
]

function AppShell() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { active, rest } = useStore()
  const goToTab = (t: string) => setTab(t as Tab)

  return (
    <div className="app">
      <main className="content">
        {tab === 'dashboard' && <Dashboard goToTab={goToTab} />}
        {tab === 'workout' && <WorkoutPage goToTab={goToTab} />}
        {tab === 'history' && <HistoryPage goToTab={goToTab} />}
        {tab === 'exercises' && <ExercisesPage />}
      </main>

      {rest && <RestBar />}

      {active && tab !== 'workout' && (
        <button className="resume-banner" onClick={() => setTab('workout')}>
          ● Workout in progress — tap to resume
        </button>
      )}

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
            {t.id === 'workout' && active && <span className="tab-dot" />}
          </button>
        ))}
      </nav>
    </div>
  )
}

function RestBar() {
  const { rest, adjustRest, stopRest } = useStore()
  const [, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!rest) return
    const remaining = rest.endsAt - Date.now()
    if (remaining <= 0) return
    const t = setTimeout(() => {
      playBeep()
      stopRest()
    }, remaining)
    return () => clearTimeout(t)
  }, [rest, stopRest])

  if (!rest) return null
  const remaining = Math.max(0, (rest.endsAt - Date.now()) / 1000)
  const progress = Math.min(1, Math.max(0, remaining / rest.totalSec))

  return (
    <div className="rest-bar">
      <div className="rest-progress" style={{ width: `${progress * 100}%` }} />
      <span className="rest-label">Rest</span>
      <span className="rest-time">{fmtClock(remaining)}</span>
      <div className="btn-row">
        <button className="btn btn-ghost btn-sm" onClick={() => adjustRest(-15)}>−15s</button>
        <button className="btn btn-ghost btn-sm" onClick={() => adjustRest(15)}>+15s</button>
        <button className="btn btn-primary btn-sm" onClick={stopRest}>Skip</button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}
