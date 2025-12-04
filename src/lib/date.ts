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

// Helper: parse 'YYYY-MM-DD' into a local Date (no timezone weirdness)
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d) // year, monthIndex, day
}

// Always compute Monday -> Sunday range for a given date string
export function getWeekRange(dateStr: string): WeekRange {
  const date = parseDate(dateStr)
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
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + delta)
  return formatDateToInput(d)
}

export function isWithinRange(dateStr: string, start: string, end: string) {
  const d = parseDate(dateStr).getTime()
  const s = parseDate(start).getTime()
  const e = parseDate(end).getTime()
  return d >= s && d <= e
}
