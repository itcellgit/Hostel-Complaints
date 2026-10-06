import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { complaintsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { Loader, EmptyState, ErrorNote, StatusBadge, CategoryBadge, UrgencyBadge } from '../../../src/components/ui'
import { ComplaintTimeline } from '../../../src/components/ComplaintTimeline'
import { currentHandler, handlerText } from '../../../src/lib/complaint'
import { formatDateTime } from '../../../src/lib/format'

const PAGE_SIZE = 10

// Dean Infra's Activity tab (web: DeanActivityPage) — every complaint in
// scope with its current handler and full, expandable activity trail.
export default function ActivityTab() {
  const router = useRouter()
  const [openId, setOpenId] = useState(null)

  const query = useInfiniteQuery({
    queryKey: ['complaints', 'audit-trail'],
    queryFn: ({ pageParam = 1 }) => complaintsApi.auditTrail({ page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    // Keeps "current handler / status" close to real time, like the web page.
    refetchInterval: 30000,
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.complaints) ?? [], [query.data])

  if (query.isLoading) return <Loader />
  if (query.isError)
    return (
      <View className="p-4">
        <ErrorNote message={apiErrorMessage(query.error)} />
      </View>
    )

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator className="my-4" color="#1d4ed8" /> : null}
        ListEmptyComponent={<EmptyState icon="time-outline" title="No complaints yet" />}
        renderItem={({ item: c }) => {
          const open = openId === c.id
          const last = c.activities[c.activities.length - 1]
          return (
            <View className="bg-white rounded-2xl border border-slate-200">
              <Pressable onPress={() => setOpenId(open ? null : c.id)} className="p-4 gap-2 active:opacity-70">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color="#94a3b8" />
                    <Text className="font-semibold text-slate-900">{c.complaintNo}</Text>
                  </View>
                  <StatusBadge status={c.status} assigneeRole={c.assignedTo?.role} />
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <CategoryBadge category={c.category} />
                  <UrgencyBadge status={c.status} since={c.statusChangedAt} />
                </View>
                <Text className="text-sm text-slate-700">
                  <Text className="text-slate-500">Current handler: </Text>
                  {handlerText(currentHandler(c))}
                </Text>
                <Text className="text-xs text-slate-500">
                  {c.hostel?.name} · {c.activities.length} event{c.activities.length === 1 ? '' : 's'}
                  {last ? ` · last update ${formatDateTime(last.createdAt)}` : ''}
                </Text>
              </Pressable>
              {open ? (
                <View className="border-t border-slate-100 p-4 gap-3">
                  <ComplaintTimeline activities={c.activities} />
                  <Pressable onPress={() => router.push(`/complaint/${c.id}`)}>
                    <Text className="text-brand font-semibold text-sm">Open complaint</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}
