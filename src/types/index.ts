export interface Trainer {
  id: number
  name: string
  tier: 1 | 2 | 3
}

export interface Client {
  id: number
  name: string
  trainerId: number
}

export interface Package {
  id: number
  clientId: number
  trainerId: number
  sessionsPurchased: number
  startDate: string // YYYY-MM-DD
  salesBonus?: number
}

export interface Session {
  id: number
  date: string // YYYY-MM-DD
  trainerId: number
  clientId: number
  packageId: number
}

export type LateFee = {
  id: number
  clientId: number
  trainerId: number
  date: string
  amount: number
}
