type FormatDateConfig = {
  locale?: string
  useUTC?: boolean
}

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  config: FormatDateConfig = {}
) {
  const d = typeof date === 'string' ? new Date(date) : date
  const { locale = 'es-ES', useUTC = false } = config

  return d.toLocaleDateString(locale, useUTC ? { ...options, timeZone: 'UTC' } : options)
}
