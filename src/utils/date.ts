export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {}, locale = 'es-ES') {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, options)
}
