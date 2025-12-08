interface DashboardHeaderProps {
  trainerName: string
  weekStart: string
  weekEnd: string
  onPrev: () => void
  onNext: () => void
}

export default function DashboardHeader({
  trainerName,
  weekStart,
  weekEnd,
  onPrev,
  onNext,
}: DashboardHeaderProps) {
  return (
    <header className="main-header">
      <div>
        <h2>Dashboard</h2>
        <p className="main-subtitle">
          Trainer: <strong>{trainerName}</strong> · Week {weekStart} → {weekEnd}
        </p>
      </div>

      <div className="week-nav">
        <button className="week-btn" onClick={onPrev}>
          ◀ Previous week
        </button>
        <button className="week-btn" onClick={onNext}>
          Next week ▶
        </button>
      </div>
    </header>
  )
}
