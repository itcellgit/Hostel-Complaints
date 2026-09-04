import { FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { apiErrorMessage } from '../api/client'
import { Loader, EmptyState, ErrorNote } from './ui'

// Thin read-only list used by the admin reference screens (colleges, hostels,
// staff, users). Create/edit flows are phase 2 — see mobile/README.md.
export function ListScreen({ queryKey, queryFn, renderItem, keyExtractor, emptyTitle, emptyIcon }) {
  const q = useQuery({ queryKey, queryFn })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50 p-4">
        <ErrorNote message={apiErrorMessage(q.error)} />
      </SafeAreaView>
    )

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <FlatList
        data={q.data ?? []}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState icon={emptyIcon} title={emptyTitle} />}
      />
    </SafeAreaView>
  )
}
