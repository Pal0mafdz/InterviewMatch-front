type FormatDateConfig = {
  locale?: string
  useUTC?: boolean
}

const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  config: FormatDateConfig = {}
) {
  const d = toDate(date)
  const { locale = 'es-ES', useUTC = false } = config

  return d.toLocaleDateString(locale, useUTC ? { ...options, timeZone: 'UTC' } : options)
}

export function toDateTimeLocalInput(date: string | Date): string {
  const d = toDate(date)

  if (Number.isNaN(d.getTime())) {
    return ''
  }

  const year = d.getFullYear()
  const month = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  const hours = pad2(d.getHours())
  const minutes = pad2(d.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function localDateTimeInputToIso(value: string): string | null {
  const trimmed = value.trim()
  const match = LOCAL_DATETIME_PATTERN.exec(trimmed)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])
  const localDate = new Date(year, monthIndex, day, hours, minutes, 0, 0)

  if (
    Number.isNaN(localDate.getTime())
    || localDate.getFullYear() !== year
    || localDate.getMonth() !== monthIndex
    || localDate.getDate() !== day
    || localDate.getHours() !== hours
    || localDate.getMinutes() !== minutes
  ) {
    return null
  }

  return localDate.toISOString()
}

export function getLocalTimeZoneLabel(): string {
  const now = new Date()
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'
  const offsetMinutes = -now.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hours = pad2(Math.floor(abs / 60))
  const minutes = pad2(abs % 60)

  return `${timeZone} (UTC${sign}${hours}:${minutes})`
}
