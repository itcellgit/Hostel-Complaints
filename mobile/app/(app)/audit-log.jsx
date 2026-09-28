import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { auditLogApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useDebounced } from '../../src/hooks/useDebounced'
import { Loader, EmptyState, ErrorNote, SearchBar, Pill } from '../../src/components/ui'
import { SelectField } from '../../src/components/form'
import { ROLE_LABEL } from '../../src/lib/roles'
import { formatDateTime } from '../../src/lib/format'

const PAGE_SIZE = 30

// "student.create" -> "Student create"
function humanizeAction(action) {
  return action
    .split('.')
    .join(' ')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export default function AuditLogScreen() {
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim())
  const [action, setAction] = useState(null)
  const [role, setRole] = useState(null)

  const actionsQ = useQuery({ queryKey: ['audit-log-actions'], queryFn: auditLogApi.actions })

  const query = useInfiniteQuery({
    queryKey: ['audit-logs', { q, action, role }],
    queryFn: ({ pageParam = 1 }) =>
      auditLogApi.list({
        page: pageParam,
        pageSize: PAGE_SIZE,
        q: q || undefined,
        action: action || undefined,
        role: role || undefined,
      }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  })

  const logs = useMemo(() => query.data?.pages.flatMap((p) => p.logs) ?? [], [query.data])
  const total = query.data?.pages[0]?.pagination.total ?? 0

  const actionOptions = [
    { label: 'All actions', value: null },
    ...(actionsQ.data ?? []).map((a) => ({ label: humanizeAction(a), value: a })),
  ]
  const roleOptions = [
    { label: 'All roles', value: null },
    ...Object.entries(ROLE_LABEL).map(([k, v]) => ({ label: v, value: k })),
  ]

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <View className="px-4 pt-3 gap-2">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search login ID or detail" />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <SelectField placeholder="All actions" value={action} onChange={setAction} options={actionOptions} />
          </View>
          <View className="flex-1">
            <SelectField placeholder="All roles" value={role} onChange={setRole} options={roleOptions} />
          </View>
        </View>
      </View>

      {query.isLoading ? (
        <Loader />
      ) : query.isError ? (
        <View className="p-4">
          <ErrorNote message={apiErrorMessage(query.error)} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          ListHeaderComponent={
            total ? <Text className="text-xs text-slate-400 mb-1">{total} entr{total === 1 ? 'y' : 'ies'}</Text> : null
          }
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={query.refetch}
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator className="my-4" color="#1d4ed8" /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No activity"
              subtitle={q || action || role ? 'Nothing matches your filters.' : 'Nothing recorded yet.'}
            />
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 border border-slate-200 gap-1.5">
              <View className="flex-row items-center justify-between">
                <Pill text={humanizeAction(item.action)} />
                <Text className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</Text>
              </View>
              <Text className="text-slate-900 font-medium">
                {item.loginId ?? 'Unknown'}
                {item.role ? ` · ${ROLE_LABEL[item.role] ?? item.role}` : ''}
              </Text>
              {item.summary ? <Text className="text-slate-600 text-sm">{item.summary}</Text> : null}
              <Text className="text-slate-400 text-xs font-mono">{item.method} {item.path}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
