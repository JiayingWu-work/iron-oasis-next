import { useState } from 'react'
import type { Client } from '../../types'
import { formatDateToInput } from '@/lib/date'

interface AddLateFeeFormProps {
  clients: Client[]
  onAddLateFee: (clientId: number, date: string) => void
}

export default function AddLateFeeForm({
  clients,
  onAddLateFee,
}: AddLateFeeFormProps) {
  const [clientId, setClientId] = useState<number>()
  const [date, setDate] = useState(formatDateToInput(new Date()))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !date) return
    onAddLateFee(clientId, date)
  }

  return (
    <div className="add">
      <h3 className="add-title">Add $45 late fee </h3>
      <form className="add-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <select
            value={clientId}
            onChange={(e) => setClientId(Number(e.target.value))}
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button
          className="primary-btn"
          type="submit"
          disabled={!clientId || !date}
        >
          Add late fee
        </button>
      </form>
    </div>
  )
}
