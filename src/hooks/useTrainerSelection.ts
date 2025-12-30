import { useEffect, useMemo, useState } from 'react'
import type { Trainer } from '@/types'

type TrainersResponse = {
  trainers: Trainer[]
}

// Module-level cache to persist trainers across route navigations
let trainersCache: Trainer[] | null = null

// Export for testing - allows resetting the cache between tests
export function clearTrainersCache() {
  trainersCache = null
}

export function useTrainerSelection(initialTrainerId?: number) {
  // Initialize with cached trainers if available to prevent flash on navigation
  const [trainers, setTrainers] = useState<Trainer[]>(trainersCache ?? [])
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(
    initialTrainerId ?? null,
  )

  useEffect(() => {
    async function loadTrainers() {
      // Fetch only active trainers for the sidebar
      const res = await fetch('/api/trainers?active=true')
      if (!res.ok) {
        console.error('Failed to load trainers')
        return
      }
      const data: TrainersResponse = await res.json()

      // Update cache and state
      trainersCache = data.trainers
      setTrainers(data.trainers)

      // pick first trainer as default if none selected and no initial ID provided
      if (data.trainers.length > 0 && selectedTrainerId == null && initialTrainerId == null) {
        setSelectedTrainerId(data.trainers[0].id)
      }
    }

    loadTrainers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedTrainer = useMemo(
    () =>
      selectedTrainerId == null
        ? null
        : trainers.find((t) => t.id === selectedTrainerId) ?? null,
    [trainers, selectedTrainerId],
  )

  return {
    trainers,
    setTrainers,
    selectedTrainerId,
    setSelectedTrainerId,
    selectedTrainer,
  }
}
