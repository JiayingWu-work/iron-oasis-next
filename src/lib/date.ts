export function formatDateToInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type WeekRange = {
  start: string
  end: string
}

// Always compute Monday -> Sunday range for a given date string
export function getWeekRange(dateStr: string): WeekRange {
  const date = new Date(dateStr)
  const day = date.getDay() // Sun=0, Mon=1, ..., Sat=6
  const offsetToMonday = (day + 6) % 7 // convert Monday into "0 index"

  const start = new Date(date)
  start.setDate(date.getDate() - offsetToMonday) // Monday

  const end = new Date(start)
  end.setDate(start.getDate() + 6) // Sunday

  return {
    start: formatDateToInput(start),
    end: formatDateToInput(end),
  }
}

export function shiftDateByDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + delta)
  return formatDateToInput(d)
}

export function isWithinRange(dateStr: string, start: string, end: string) {
  const d = new Date(dateStr).getTime()
  return d >= new Date(start).getTime() && d <= new Date(end).getTime()
}
