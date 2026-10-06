// Palette from the dataviz skill's validated default (references/palette.md).
// Status colors are mode-invariant; categorical hues step for light/dark.
import { CELL_ROLES } from './roles.js'

export const STATUS_COLOR = {
  OPEN: '#fab219', // warning
  IN_PROGRESS: '#2a78d6', // categorical slot 1 (blue) — "in motion", not a status-palette role
  ASSIGNED_TO_MAINTAINER: '#8b5cf6',
  MAINTAINER_COMPLETED: '#1baf7a',
  RESOLVED: '#0ca30c', // good
  CLOSED: '#52514e', // secondary ink — settled, no longer needs attention
  REJECTED: '#d03b3b', // critical
}

export const STATUS_LABEL = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  ASSIGNED_TO_MAINTAINER: 'Assigned to maintainer',
  MAINTAINER_COMPLETED: 'Maintainer completed',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
}

// IN_PROGRESS / RESOLVED are shared with non-cell flows (e.g. Faculty on
// disciplinary complaints), so the facility-cell wording depends on who holds it.
export function statusLabelFor(status, assigneeRole) {
  const withCell = CELL_ROLES.includes(assigneeRole)
  if (withCell && status === 'IN_PROGRESS') return 'Forwarded to facility cell'
  if (withCell && status === 'RESOLVED') return 'Facility cell verified'
  return STATUS_LABEL[status] ?? status
}

// Categorical slots 1-6 (blue, orange, aqua, yellow, magenta, violet) for the
// six complaint categories — order fixed, never cycled.
export const CATEGORY_COLOR = {
  INFRASTRUCTURE: { light: '#2a78d6', dark: '#3987e5' },
  FACILITIES: { light: '#eb6834', dark: '#d95926' },
  CLEANLINESS: { light: '#1baf7a', dark: '#199e70' },
  FOOD: { light: '#eda100', dark: '#c98500' },
  DISCIPLINE: { light: '#e87ba4', dark: '#d55181' },
  OTHERS: { light: '#4a3aa7', dark: '#9085e9' },
}

export const CATEGORY_LABEL = {
  INFRASTRUCTURE: 'Infrastructure',
  FACILITIES: 'Facilities',
  DISCIPLINE: 'Discipline',
  CLEANLINESS: 'Cleanliness',
  FOOD: 'Food',
  OTHERS: 'Others',
}

// Single sequential hue (light→dark step 450/400) for month-over-month
// trend bars — one metric across time, not distinct categories, so every
// bar shares the same identity color.
export const TREND_COLOR = { light: '#2a78d6', dark: '#3987e5' }
