import type { Trainer } from '../types'

type SidebarProps = {
  trainers: Trainer[]
  selectedTrainerId: string
  onSelectTrainer: (id: string) => void
}

export default function Sidebar({
  trainers,
  selectedTrainerId,
  onSelectTrainer,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Iron Oasis</h1>
        <p className="sidebar-subtitle">Class Tracker MVP</p>
      </div>

      <div className="sidebar-section">
        <h3>Forms</h3>
        <button className="sidebar-btn" disabled>
          + Add new client
        </button>
        <button className="sidebar-btn" disabled>
          + Add new trainer
        </button>
        <p className="sidebar-hint">MVP: forms coming later</p>
      </div>

      <div className="sidebar-section">
        <h3>Trainers</h3>
        <ul className="trainer-list">
          {trainers.map((t) => (
            <li
              key={t.id}
              className={
                'trainer-item' +
                (t.id === selectedTrainerId ? ' trainer-item--active' : '')
              }
              onClick={() => onSelectTrainer(t.id)}
            >
              <span className="trainer-name">{t.name}</span>
              <span className="trainer-tier">Tier {t.tier}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
