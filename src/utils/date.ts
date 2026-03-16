export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {}, locale = 'es-ES') {
  const d = typeof date === 'string' ? new Date(date) : date
  // Force UTC formatting to avoid timezone-based day shifts when the stored date is intended
  // to be interpreted as a calendar date rather than a specific instant in time.
  return d.toLocaleDateString(locale, { timeZone: 'UTC', ...options })
}
