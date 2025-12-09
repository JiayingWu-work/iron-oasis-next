import { useState } from 'react'
import type { Client } from '../types'
import { formatDateToInput } from '@/lib/date'

interface AddPackageFormProps {
  clients: Client[]
  onAddPackage: (
    clientId: number,
    sessionsPurchased: number,
    startDate: string,
  ) => void
}

export default function AddPackageForm({
  clients,
  onAddPackage,
}: AddPackageFormProps) {
  const [clientId, setClientId] = useState<number>()
  const [sessionsPurchased, setSessionsPurchased] = useState(0)
  const [startDate, setStartDate] = useState(formatDateToInput(new Date()))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || sessionsPurchased <= 0) return
    onAddPackage(clientId, sessionsPurchased, startDate)
    setSessionsPurchased(0)
  }

  return (
    <div className="add">
      <h3 className="add-title">Add package</h3>

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
            type="number"
            value={sessionsPurchased === 0 ? '' : sessionsPurchased}
            onChange={(e) => {
              const raw = e.target.value
              const num = Number(raw)
              if (Number.isNaN(num)) {
                setSessionsPurchased(0)
                return
              }
              // Remove leading zeros
              setSessionsPurchased(num)
            }}
            placeholder="Number of sessions (e.g. 14)"
          />
        </div>

        <div className="field-row">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <button
          className="primary-btn"
          type="submit"
          disabled={!clientId || sessionsPurchased <= 0}
        >
          Add package
        </button>
      </form>
    </div>
  )
}
