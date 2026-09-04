import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { studentsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useAuth } from '../../../src/auth/AuthContext'
import { useDebounced } from '../../../src/hooks/useDebounced'
import { Loader, EmptyState, ErrorNote, SearchBar } from '../../../src/components/ui'

const PAGE_SIZE = 20

export default function StudentsTab() {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim())
  const canManage = user?.role === 'ADMIN' || user?.role === 'RECTOR'

  function openAdd() {
    Alert.alert('Add students', null, [
      { text: 'Add one student', onPress: () => router.push('/student-form') },
      { text: 'Bulk upload (Excel/CSV)', onPress: () => router.push('/student-bulk-upload') },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const query = useInfiniteQuery({
    queryKey: ['students', { q, paged: true }],
    queryFn: ({ pageParam = 1 }) =>
      studentsApi.listPaged({ page: pageParam, pageSize: PAGE_SIZE, q: q || undefined }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.students) ?? [], [query.data])
  const total = query.data?.pages[0]?.pagination.total ?? 0

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <View className="px-4 pt-3 pb-1">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or USN" />
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
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          ListHeaderComponent={
            total ? <Text className="text-xs text-slate-400 mb-1">{total} student{total === 1 ? '' : 's'}</Text> : null
          }
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={query.refetch}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator className="my-4" color="#1d4ed8" /> : null
          }
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No students" subtitle={q ? 'Nothing matches your search.' : undefined} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/student/${item.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-200 active:opacity-70"
            >
              <View className="flex-row justify-between">
                <Text className="font-semibold text-slate-900">
                  {item.firstName} {item.lastName}
                </Text>
                {!item.isActive ? <Text className="text-xs text-red-600">Left</Text> : null}
              </View>
              <Text className="text-slate-500 text-sm mt-0.5">
                {item.usn} · {item.program?.code} · Room {item.roomNo}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">{item.hostel?.name}</Text>
            </Pressable>
          )}
        />
      )}

      {canManage ? (
        <Pressable
          onPress={openAdd}
          className="absolute bottom-6 right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  )
}
