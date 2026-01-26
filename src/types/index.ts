export type TrainingMode = '1v1' | '1v2' | '2v2'

export type Location = 'west' | 'east'

export interface Trainer {
  id: number
  name: string
  tier: 1 | 2 | 3
  email: string
  isActive: boolean
  location: Location
  incomeRates?: IncomeRate[]
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
  createdAt: string
  isActive: boolean
  location: Location
  isPersonalClient: boolean // If true, trainer gets +10% on their pay rate for this client
  archivedAt?: string | null // YYYY-MM-DD (Monday) - when client was archived, null if active
}

export interface Package {
  id: number
  clientId: number
  trainerId: number
  sessionsPurchased: number
  startDate: string // YYYY-MM-DD
  salesBonus?: number
  mode: TrainingMode
  location: Location
}

export interface Session {
  id: number
  date: string // YYYY-MM-DD
  trainerId: number
  clientId: number
  packageId: number | null
  mode: TrainingMode
  locationOverride?: Location // null = use client's default location
}

export type LateFee = {
  id: number
  clientId: number
  trainerId: number
  date: string
  amount: number
}

export interface IncomeRate {
  id: number
  trainerId: number
  minClasses: number
  maxClasses: number | null
  rate: number
  effectiveWeek: string // YYYY-MM-DD (Monday of the week this rate starts applying)
}

export interface ClientPriceHistory {
  id: number
  clientId: number
  effectiveDate: string
  price1_12: number
  price13_20: number
  price21Plus: number
  modePremium: number
  reason: string | null
}
