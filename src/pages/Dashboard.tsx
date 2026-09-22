import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import Modal from '../components/Modal'
import NumInput from '../components/NumInput'
import { BarChart, LineChart } from '../components/Charts'
import {
  dayKey, displayToKg, fmtDuration, fmtNum, fmtWeight, kgToDisplay,
  parseDayKey, startOfWeek, workoutSetCount, workoutVolumeKg,
} from '../utils'

type Period = '1M' | '3M' | '6M' | '1Y' | 'All'
const PERIODS: Period[] = ['1M', '3M', '6M', '1Y', 'All']
const PERIOD_DAYS: Record<Period, number> = { '1M': 30, '3M': 91, '6M': 182, '1Y': 365, All: Infinity }

export default function Dashboard({ goToTab }: { goToTab: (tab: string) => void }) {
  const [now] = useState(() => Date.now())
  const store = useStore()
  const { history, bodyWeights, settings } = store
  const [period, setPeriod] = useState<Period>('3M')
  const [logging, setLogging] = useState(false)
  const [managing, setManaging] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const unit = settings.unit

  const weekStats = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date()).getTime()
    const thisWeek = history.filter(w => w.startedAt >= thisWeekStart)
    const volume = thisWeek.reduce((acc, w) => acc + workoutVolumeKg(w), 0)
    const duration = thisWeek.reduce((acc, w) => acc + (w.endedAt - w.startedAt) / 1000, 0)

    // consecutive-week streak (including this week)
    const weeks = new Set(history.map(w => startOfWeek(new Date(w.startedAt)).getTime()))
    let streak = 0
    let cursor = startOfWeek(new Date()).getTime()
    while (weeks.has(cursor)) {
      streak++
      const previousWeek = new Date(cursor)
      previousWeek.setDate(previousWeek.getDate() - 7)
      cursor = previousWeek.getTime()
    }

    return { count: thisWeek.length, volume, duration, streak }
  }, [history])

  const weeklyBars = useMemo(() => {
    const bars = []
    const now = startOfWeek(new Date())
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(start.getDate() - i * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const count = history.filter(w => w.startedAt >= start.getTime() && w.startedAt < end.getTime()).length
      bars.push({
        label: start.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' }),
        value: count,
      })
    }
    return bars
  }, [history])

  const weightData = useMemo(() => {
    const cutoff = PERIOD_DAYS[period] === Infinity
      ? 0
      : now - PERIOD_DAYS[period] * 24 * 3600 * 1000
    const inPeriod = bodyWeights.filter(b => parseDayKey(b.date).getTime() >= cutoff)
    const points = inPeriod.map(b => ({
      t: parseDayKey(b.date).getTime(),
      v: kgToDisplay(b.weightKg, unit),
      label: parseDayKey(b.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
    }))
    let change: { abs: number; pct: number } | null = null
    if (inPeriod.length >= 2) {
      const first = inPeriod[0].weightKg
      const last = inPeriod[inPeriod.length - 1].weightKg
      change = { abs: last - first, pct: first > 0 ? ((last - first) / first) * 100 : 0 }
    }
    const latest = bodyWeights.length > 0 ? bodyWeights[bodyWeights.length - 1] : null
    return { points, change, latest }
  }, [bodyWeights, period, unit, now])

  const recent = history.slice(0, 3)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">⚙</button>
      </div>

      <section className="welcome-panel"><p className="eyebrow">WO LOGGER / YOUR TRAINING JOURNAL</p><h2>Build strength.<br />See your progress.</h2><p>Log every set, repeat your best routines, and watch consistency add up. Your data stays on this device.</p><button className="btn btn-primary" onClick={() => goToTab("workout")}>Start training →</button></section>
      <div className="stat-grid">
        <div className="stat-box">
          <span className="stat-value">{weekStats.count}</span>
          <span className="stat-label">Workouts this week</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{weekStats.streak}<small> wk</small></span>
          <span className="stat-label">Week streak</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{fmtNum(kgToDisplay(weekStats.volume, unit) / 1000)}<small>k {unit}</small></span>
          <span className="stat-label">Volume this week</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{history.length}</span>
          <span className="stat-label">Total workouts</span>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <h2>Body weight</h2>
          <div className="card-header-actions">
            {bodyWeights.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setManaging(true)}>Entries</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setLogging(true)}>+ Log weight</button>
          </div>
        </div>

        {weightData.latest ? (
          <>
            <div className="weight-current">
              <span className="weight-big">{fmtWeight(weightData.latest.weightKg, unit)}</span>
              <span className="weight-date">
                latest · {parseDayKey(weightData.latest.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="chip-row">
              {PERIODS.map(p => (
                <button key={p} className={`chip ${period === p ? 'chip-active' : ''}`} onClick={() => setPeriod(p)}>
                  {p}
                </button>
              ))}
            </div>

            {weightData.change ? (
              <div className="change-grid">
                <div className={`change-box ${weightData.change.abs > 0 ? 'change-up' : weightData.change.abs < 0 ? 'change-down' : ''}`}>
                  <span className="change-value">
                    {weightData.change.abs > 0 ? '▲ +' : weightData.change.abs < 0 ? '▼ −' : ''}
                    {fmtNum(Math.abs(kgToDisplay(weightData.change.abs, unit)))} {unit}
                  </span>
                  <span className="change-label">Change ({period})</span>
                </div>
                <div className={`change-box ${weightData.change.pct > 0 ? 'change-up' : weightData.change.pct < 0 ? 'change-down' : ''}`}>
                  <span className="change-value">
                    {weightData.change.pct > 0 ? '▲ +' : weightData.change.pct < 0 ? '▼ −' : ''}
                    {Math.abs(weightData.change.pct).toFixed(1)}%
                  </span>
                  <span className="change-label">Change % ({period})</span>
                </div>
              </div>
            ) : (
              <p className="empty-note">Log at least two weights in this period to see your change.</p>
            )}

            <LineChart
              points={weightData.points}
              formatValue={v => `${fmtNum(v)} ${unit}`}
            />
          </>
        ) : (
          <p className="empty-note">Track your body weight to see a progress graph plus your gain/loss in {unit} and %.</p>
        )}
      </section>

      <section className="card">
        <div className="card-header"><h2>Workouts per week</h2></div>
        <BarChart bars={weeklyBars} />
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Recent workouts</h2>
          {history.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => goToTab('history')}>View all</button>
          )}
        </div>
        {recent.length === 0 && (
          <p className="empty-note">
            No workouts yet. <button className="link-btn" onClick={() => goToTab('workout')}>Start your first workout</button>
          </p>
        )}
        {recent.map(w => (
          <div className="recent-row" key={w.id}>
            <div>
              <div className="recent-name">{w.name}</div>
              <div className="recent-sub">
                {new Date(w.startedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}{fmtDuration((w.endedAt - w.startedAt) / 1000)}
                {' · '}{workoutSetCount(w)} sets
              </div>
            </div>
            <div className="recent-vol">{fmtWeight(workoutVolumeKg(w), unit)}</div>
          </div>
        ))}
      </section>

      {logging && <LogWeightModal onClose={() => setLogging(false)} />}
      {managing && <ManageWeightsModal onClose={() => setManaging(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function LogWeightModal({ onClose }: { onClose: () => void }) {
  const { addBodyWeight, bodyWeights, settings } = useStore()
  const unit = settings.unit
  const latest = bodyWeights.length > 0 ? bodyWeights[bodyWeights.length - 1].weightKg : null
  const [date, setDate] = useState(dayKey(new Date()))
  const [weight, setWeight] = useState<number | null>(latest != null ? kgToDisplay(latest, unit) : null)

  function save() {
    if (weight == null || weight <= 0 || !date) return
    addBodyWeight(date, displayToKg(weight, unit))
    onClose()
  }

  return (
    <Modal
      title="Log body weight"
      onClose={onClose}
      footer={<button className="btn btn-primary btn-block" disabled={weight == null || weight <= 0} onClick={save}>Save</button>}
    >
      <label className="field">
        <span>Date</span>
        <input className="text-input" type="date" value={date} max={dayKey(new Date())} onChange={e => setDate(e.target.value)} />
      </label>
      <label className="field">
        <span>Weight ({unit})</span>
        <NumInput value={weight} onChange={setWeight} placeholder={`e.g. ${unit === 'kg' ? '75' : '165'}`} />
      </label>
      <p className="hint">Logging a second entry on the same date replaces the first.</p>
    </Modal>
  )
}

function ManageWeightsModal({ onClose }: { onClose: () => void }) {
  const { bodyWeights, deleteBodyWeight, settings } = useStore()
  const sorted = [...bodyWeights].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Modal title="Body weight entries" onClose={onClose}>
      {sorted.length === 0 && <p className="empty-note">No entries.</p>}
      {sorted.map(b => (
        <div className="recent-row" key={b.id}>
          <div>
            <div className="recent-name">{fmtWeight(b.weightKg, settings.unit)}</div>
            <div className="recent-sub">
              {parseDayKey(b.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <button className="icon-btn icon-btn-danger" onClick={() => deleteBodyWeight(b.id)} title="Delete entry">✕</button>
        </div>
      ))}
    </Modal>
  )
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, setSettings, exportData, importData } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState('')

  function doExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wo-logger-backup-${dayKey(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function doImport(file: File) {
    if (file.size > 10000000) { setImportMsg("Backup is too large (10 MB maximum)."); return }
    if (!window.confirm("Replace saved workouts, routines, weights, and settings with this backup?")) return
    file.text().then(text => {
      const ok = importData(text)
      setImportMsg(ok ? 'Import successful ✓' : 'Import failed — not a valid backup file.')
    }).catch(() => setImportMsg('Could not read backup file.'))
  }

  function wipe() {
    if (!window.confirm('Delete ALL data (workouts, routines, weights, custom exercises)? This cannot be undone.')) return
    Object.keys(localStorage)
      .filter(k => k.startsWith('wo-logger.'))
      .forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <label className="field">
        <span>Weight unit</span>
        <div className="segmented">
          {(['kg', 'lb'] as const).map(u => (
            <button
              key={u}
              className={`segment ${settings.unit === u ? 'segment-active' : ''}`}
              onClick={() => setSettings({ ...settings, unit: u })}
            >
              {u}
            </button>
          ))}
        </div>
      </label>
      <label className="field">
        <span>Default rest timer</span>
        <select
          className="select-input"
          value={settings.defaultRestSec}
          onChange={e => setSettings({ ...settings, defaultRestSec: Number(e.target.value) })}
        >
          {[0, 30, 45, 60, 90, 120, 150, 180, 240, 300].map(r => (
            <option key={r} value={r}>{r === 0 ? 'Off' : r < 60 ? `${r}s` : `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`}</option>
          ))}
        </select>
      </label>
      <div className="field">
        <span>Data</span>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={doExport}>Export backup</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Import backup</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) doImport(f) }}
        />
        {importMsg && <p className="hint">{importMsg}</p>}
      </div>
      <div className="field">
        <span>Danger zone</span>
        <button className="btn btn-danger" onClick={wipe}>Delete all data</button>
      </div>
    </Modal>
  )
}
