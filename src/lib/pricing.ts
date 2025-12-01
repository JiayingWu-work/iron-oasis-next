import type { Trainer } from '@/types'

export function getPricePerClass(
  trainerTier: Trainer['tier'],
  sessionsPurchased: number,
): number {
  if (sessionsPurchased <= 12) {
    switch (trainerTier) {
      case 1:
        return 150
      case 2:
        return 165
      case 3:
        return 180
    }
  } else if (sessionsPurchased <= 20) {
    switch (trainerTier) {
      case 1:
        return 140
      case 2:
        return 155
      case 3:
        return 170
    }
  } else {
    switch (trainerTier) {
      case 1:
        return 130
      case 2:
        return 145
      case 3:
        return 160
    }
  }
}
