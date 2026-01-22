import { TrainingMode, Location } from '.'

export type ApiClient = {
  id: number
  name: string
  trainer_id: number
  secondary_trainer_id: number | null
  mode: TrainingMode
  tier_at_signup: number
  price_1_12: number
  price_13_20: number
  price_21_plus: number
  mode_premium: number
  created_at: string
  is_active?: boolean
  location?: Location
  is_personal_client?: boolean
}

export type ApiPackage = {
  id: number
  client_id: number
  trainer_id: number
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
  mode: TrainingMode
  location?: Location
}

export type ApiSession = {
  id: number
  date: string
  trainer_id: number
  client_id: number
  package_id: number | null
  mode: TrainingMode
  location_override?: Location | null
}

export type ApiLateFee = {
  id: number
  client_id: number
  trainer_id: number
  date: string
  amount: number
}

export type ApiLateFeeWithClient = ApiLateFee & {
  client_name: string
}

export type ApiIncomeRate = {
  id: number
  trainer_id: number
  min_classes: number
  max_classes: number | null
  rate: string // DECIMAL comes as string from DB
  effective_week: string // YYYY-MM-DD (Monday of the week this rate starts applying)
}

export type ApiClientPriceHistory = {
  id: number
  client_id: number
  effective_date: string
  price_1_12: number
  price_13_20: number
  price_21_plus: number
  mode_premium: number
  reason: string | null
}

export type TrainerWeekResponse = {
  trainer: {
    id: number
    name: string
    tier: 1 | 2 | 3
  }
  clients: ApiClient[]
  packages: ApiPackage[]
  sessions: ApiSession[]
  lateFees: ApiLateFee[]
  incomeRates: ApiIncomeRate[]
  clientPriceHistory?: ApiClientPriceHistory[] // Optional for backwards compatibility
  weekStart: string
  weekEnd: string
}

export type DeleteResponse = { id: string }
