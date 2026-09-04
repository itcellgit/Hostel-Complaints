import { Text } from 'react-native'
import { Screen, Card } from '../../src/components/ui'

const SECTIONS = [
  {
    title: 'Filing a complaint',
    body: 'Tap the + button on the Complaints tab. Pick a category, describe the issue clearly, and optionally attach a photo. Your hostel and room are filled in automatically.',
  },
  {
    title: 'What happens next',
    body: 'Your complaint goes to the GIT Dean Infra (or the Faculty Incharge for disciplinary issues). They forward it to the right facility cell, which sets an estimated completion date and resolves it with a photo of the completed work.',
  },
  {
    title: 'Closing a complaint',
    body: 'Once a complaint is marked Resolved, open it and tap "Close complaint". You can leave optional feedback. If you don\'t close it, the Faculty Incharge may close it for you.',
  },
  {
    title: 'Forgot your password',
    body: 'On the login screen tap "Forgot password?". An Admin (or your Rector) will reset it and share a new temporary password.',
  },
]

export default function Guide() {
  return (
    <Screen>
      {SECTIONS.map((s) => (
        <Card key={s.title}>
          <Text className="font-semibold text-slate-900 mb-1">{s.title}</Text>
          <Text className="text-slate-600 leading-5">{s.body}</Text>
        </Card>
      ))}
    </Screen>
  )
}
