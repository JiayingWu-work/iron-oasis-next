export type TrainingMode = '1v1' | '1v2' | '2v2'

export interface Trainer {
  id: number
  name: string
  tier: 1 | 2 | 3
  email: string
}

export interface Client {
  id: number
  name: string
  trainerId: number // primary: package owner / bonus owner
  secondaryTrainerId?: number // optional: additional trainer for 2v2
  mode: TrainingMode
  tierAtSignup: 1 | 2 | 3 // Pricing locked at signup (based on trainer's tier at that time)
  price1_12: number
  price13_20: number
  price21Plus: number
  modePremium: number // 1v2 premium locked at signup
  createdAt?: string
}

export interface Package {
  id: number
  clientId: number
  trainerId: number
  sessionsPurchased: number
  startDate: string // YYYY-MM-DD
  salesBonus?: number
  mode: TrainingMode
}

export interface Session {
  id: number
  date: string // YYYY-MM-DD
  trainerId: number
  clientId: number
  packageId: number | null
  mode: TrainingMode
}

export type LateFee = {
  id: number
  clientId: number
  trainerId: number
  date: string
  amount: number
}
