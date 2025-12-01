export interface Trainer {
  id: string
  name: string
  tier: 1 | 2 | 3
}

export interface Client {
  id: string
  name: string
  trainerId: string
}

export interface Package {
  id: string
  clientId: string
  trainerId: string
  sessionsPurchased: number
  startDate: string // YYYY-MM-DD
  salesBonus?: number
}

export interface Session {
  id: string
  date: string // YYYY-MM-DD
  trainerId: string
  clientId: string
  packageId: string
}
