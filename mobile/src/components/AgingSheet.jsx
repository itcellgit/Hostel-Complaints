import { Text } from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/resources'
import { apiErrorMessage } from '../api/client'
import { FormSheet } from './FormSheet'
import { ComplaintCard } from './ComplaintCard'
import { Button, ErrorNote, Loader } from './ui'

const TITLES = {
  neutral: 'Pending 0–3 days',
  warning: 'Pending 3–7 days',
  danger: 'Pending 7+ days',
}

// Items are mapped (not a FlatList) because FormSheet already scrolls its children.
export function AgingSheet({ bucket, onClose }) {
  const query = useInfiniteQuery({
    queryKey: ['complaints', 'aging', bucket],
    queryFn: ({ pageParam }) => complaintsApi.list({ ageBucket: bucket, page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: !!bucket,
  })
  const items = query.data?.pages.flatMap((p) => p.complaints) ?? []

  return (
    <FormSheet visible={!!bucket} title={TITLES[bucket] ?? ''} onClose={onClose}>
      {query.isLoading ? (
        <Loader />
      ) : query.isError ? (
        <ErrorNote message={apiErrorMessage(query.error)} />
      ) : items.length === 0 ? (
        <Text className="text-center text-slate-500 py-6">Nothing in this range.</Text>
      ) : (
        items.map((c) => <ComplaintCard key={c.id} complaint={c} />)
      )}
      {query.hasNextPage ? (
        <Button
          title="Load more"
          variant="secondary"
          loading={query.isFetchingNextPage}
          onPress={() => query.fetchNextPage()}
        />
      ) : null}
    </FormSheet>
  )
}
