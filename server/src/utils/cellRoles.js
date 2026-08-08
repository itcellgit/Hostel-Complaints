// The facility "cell" departments Dean Infra forwards complaints to. One
// active user per role today, but role-based lookup (not a hardcoded user
// id) means a future second account for the same cell needs no code change.
export const CELL_ROLES = [
  'EPMC',
  'ENERGY_CELL',
  'COMPUTER_CENTER',
  'PRODUCTION_CELL',
  'CIVIL_MAINTENANCE',
]
