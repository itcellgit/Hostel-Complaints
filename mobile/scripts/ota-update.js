// Publish an over-the-air (JS-only) update with EAS Update.
//
//   npm run update:preview -- "Fix complaint form"
//   npm run update:production -- "Fix complaint form"
//
// The bundle is built on this machine, so EXPO_PUBLIC_API_URL is forced to the
// deployed API here. Otherwise the LAN URL in mobile/.env would be baked into
// the update and break every installed app.
const { spawnSync } = require('child_process')

const PROD_API_URL = 'https://hostel-complaints.git.edu'

const channel = process.argv[2]
const message = process.argv.slice(3).join(' ')
if (!['preview', 'production'].includes(channel) || !message) {
  console.error('Usage: node scripts/ota-update.js <preview|production> "<message>"')
  process.exit(1)
}

const result = spawnSync(
  'npx',
  // Quoted because shell mode (needed for npx on Windows) splits on spaces.
  ['eas-cli', 'update', '--channel', channel, '--message', JSON.stringify(message), '--platform', 'android'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, EXPO_PUBLIC_API_URL: PROD_API_URL },
  }
)
process.exit(result.status ?? 1)
