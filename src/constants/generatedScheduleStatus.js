export const generatedScheduleStatuses = ['draft', 'published', 'archived']

const labels = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

export function normalizeGeneratedScheduleStatus(value) {
  if (value === 'published' || value === 'archived') {
    return value
  }

  return 'draft'
}

export function labelGeneratedScheduleStatus(value) {
  const normalized = normalizeGeneratedScheduleStatus(value)
  return labels[normalized] ?? 'Draft'
}
