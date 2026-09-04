import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { complaintsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useAuth } from '../../../src/auth/AuthContext'
import { useDebounced } from '../../../src/hooks/useDebounced'
import { ComplaintCard } from '../../../src/components/ComplaintCard'
import { Loader, EmptyState, ErrorNote, SearchBar } from '../../../src/components/ui'
import { STATUS_LABEL } from '../../../src/lib/roles'

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const PAGE_SIZE = 20

export default function ComplaintsTab() {
  const router = useRouter()
  const { user } = useAuth()
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim())

  const query = useInfiniteQuery({
    queryKey: ['complaints', { status, q }],
    queryFn: ({ pageParam = 1 }) =>
      complaintsApi.list({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: status === 'ALL' ? undefined : status,
        q: q || undefined,
      }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.complaints) ?? [], [query.data])
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const canRaise = user?.role === 'STUDENT' || user?.role === 'RECTOR'

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <View className="px-4 pt-3 gap-2">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search no., text, USN, room" />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(s) => s}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setStatus(item)}
              className={`px-3 py-1.5 rounded-full border ${status === item ? 'bg-brand border-brand' : 'bg-white border-slate-300'}`}
            >
              <Text className={status === item ? 'text-white text-xs font-semibold' : 'text-slate-600 text-xs'}>
                {item === 'ALL' ? 'All' : STATUS_LABEL[item]}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {query.isLoading ? (
        <Loader />
      ) : query.isError ? (
        <View className="p-4">
          <ErrorNote message={apiErrorMessage(query.error)} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={
            total ? <Text className="text-xs text-slate-400 mb-1">{total} complaint{total === 1 ? '' : 's'}</Text> : null
          }
          renderItem={({ item }) => <ComplaintCard complaint={item} />}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={query.refetch}
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator className="my-4" color="#1d4ed8" /> : null
          }
          ListEmptyComponent={
            <EmptyState title="No complaints" subtitle={q ? 'Nothing matches your search.' : 'Nothing matches this filter yet.'} />
          }
        />
      )}

      {canRaise ? (
        <Pressable
          onPress={() => router.push('/new-complaint')}
          className="absolute bottom-6 right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  )
}
