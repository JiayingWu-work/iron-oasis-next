import { useState } from 'react'
import type { Client } from '../../types'

interface AddClassesFormProps {
  date: string
  onDateChange: (value: string) => void
  clients: Client[]
  onAddSessions: (date: string, clientIds: number[]) => void
}

export default function AddClassesForm({
  date,
  onDateChange,
  clients,
  onAddSessions,
}: AddClassesFormProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])

  const handleToggleClient = (id: number) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const handleSave = () => {
    if (selectedClientIds.length === 0) return
    onAddSessions(date, selectedClientIds)
    setSelectedClientIds([])
  }

  return (
    <div className="add-form">
      <h3 className="add-title">Add classes</h3>
      <div className="field-row">
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      {clients.length === 0 ? (
        <p className="hint">No clients for this trainer yet.</p>
      ) : (
        <div className="client-list">
          {clients.map((client) => (
            <label key={client.id} className="client-item">
              <input
                type="checkbox"
                checked={selectedClientIds.includes(client.id)}
                onChange={() => handleToggleClient(client.id)}
              />
              <span>{client.name}</span>
            </label>
          ))}
        </div>
      )}
      <button
        className="primary-btn"
        onClick={handleSave}
        disabled={selectedClientIds.length === 0}
      >
        Save Classes
      </button>
    </div>
  )
}
