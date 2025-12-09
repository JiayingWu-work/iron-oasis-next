import type { Trainer } from '@/types'

interface SideBarProps {
  trainers: Trainer[]
  selectedTrainerId: number | null
  onSelectTrainer: (id: number) => void
  onAddClient: () => void
}

export default function SideBar({
  trainers,
  selectedTrainerId,
  onSelectTrainer,
  onAddClient,
}: SideBarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Iron Oasis</h1>
        <p className="sidebar-subtitle">Class Tracker MVP</p>
      </div>
      <div className="sidebar-section">
        <h3>FORMS</h3>
        <button
          type="button"
          className="sidebar-action-btn"
          onClick={onAddClient}
        >
          + Add new client
        </button>
        <button type="button" className="sidebar-action-btn" disabled>
          + Add new trainer
        </button>
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
