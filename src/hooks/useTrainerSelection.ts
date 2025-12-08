import { useEffect, useMemo, useState } from 'react'
import type { Trainer } from '@/types'

type TrainersResponse = {
  trainers: Trainer[]
}

export function useTrainerSelection() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(
    null,
  )

  useEffect(() => {
    async function loadTrainers() {
      const res = await fetch('/api/trainers')
      if (!res.ok) {
        console.error('Failed to load trainers')
        return
      }
      const data: TrainersResponse = await res.json()
      setTrainers(data.trainers)

      // pick first trainer as default if none selected
      if (data.trainers.length > 0 && selectedTrainerId == null) {
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
    selectedTrainerId,
    setSelectedTrainerId,
    selectedTrainer,
  }
}
