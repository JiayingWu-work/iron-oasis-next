import type { Trainer, TrainingMode } from '@/types'

export function getPricePerClass(
  trainerTier: Trainer['tier'],
  sessionsPurchased: number,
  mode: TrainingMode = '1v1',
): number {
  let base: number

  if (sessionsPurchased <= 12) {
    switch (trainerTier) {
      case 1:
        base = 150
        break
      case 2:
        base = 165
        break
      case 3:
        base = 180
        break
    }
  } else if (sessionsPurchased <= 20) {
    switch (trainerTier) {
      case 1:
        base = 140
        break
      case 2:
        base = 155
        break
      case 3:
        base = 170
        break
    }
  } else {
    switch (trainerTier) {
      case 1:
        base = 130
        break
      case 2:
        base = 145
        break
      case 3:
        base = 160
        break
    }
  }

  // 1v2 = +$20 per class
  if (mode === '1v2') {
    return base + 20
  }

  // '1v1' and '2v2' use the base rate
  return base
}
