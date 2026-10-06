import { useState } from 'react'
import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { Screen, Card, Loader, ErrorNote, Button } from '../../../src/components/ui'
import { ComplaintCard } from '../../../src/components/ComplaintCard'
import { MaintainerCompleteSheet } from '../../../src/components/MaintainerCompleteSheet'

// Maintainer home (web: MaintainerTasksPage). The server scopes a
// maintainer's complaint list to the ones assigned to them.
export default function TasksTab() {
  const [completing, setCompleting] = useState(null)
  const q = useQuery({
    queryKey: ['complaints', { maintainerTasks: true }],
    queryFn: () => complaintsApi.list({ pageSize: 100 }),
  })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(q.error)} />
      </Screen>
    )

  const complaints = q.data?.complaints ?? []
  const pending = complaints.filter((c) => c.status === 'ASSIGNED_TO_MAINTAINER')
  const history = complaints.filter((c) => c.status !== 'ASSIGNED_TO_MAINTAINER')

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Text className="font-semibold text-slate-900">Assigned to me ({pending.length})</Text>
      {pending.length === 0 ? (
        <Card>
          <Text className="text-slate-500">No tasks waiting on you.</Text>
        </Card>
      ) : (
        pending.map((c) => (
          <ComplaintCard
            key={c.id}
            complaint={c}
            footer={
              <View className="mt-1">
                <Button title="Mark as completed" icon="checkmark-circle-outline" onPress={() => setCompleting(c)} />
              </View>
            }
          />
        ))
      )}

      {history.length > 0 ? (
        <>
          <Text className="font-semibold text-slate-900 mt-2">Completed / handed over</Text>
          {history.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </>
      ) : null}

      <MaintainerCompleteSheet complaint={completing} onClose={() => setCompleting(null)} />
    </Screen>
  )
}
