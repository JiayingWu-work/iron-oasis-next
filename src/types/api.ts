import { TrainingMode } from '.'

export type ApiClient = {
  id: number
  name: string
  trainer_id: number
  secondary_trainer_id: number | null
  mode: TrainingMode
}

export type ApiPackage = {
  id: number
  client_id: number
  trainer_id: number
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
  mode: TrainingMode
}

export type ApiSession = {
  id: number
  date: string
  trainer_id: number
  client_id: number
  package_id: number | null
  mode: TrainingMode
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
  weekStart: string
  weekEnd: string
}

export type DeleteResponse = { id: string }
