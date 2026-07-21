// Format an ISO timestamp into a short, readable date + time.
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  // Some columns come back without a timezone; those values are UTC, so add
  // a 'Z' when one is missing to keep every timestamp in the viewer's local time.
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso)
  return new Date(hasTz ? iso : iso + 'Z').toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
