import { useMemo, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { hostelResidentRulesApi, complaintsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useCrud } from '../../src/hooks/useCrud'
import { Screen, Card, Loader, EmptyState, ErrorNote, Field, Button } from '../../src/components/ui'
import { SelectField } from '../../src/components/form'
import { FormSheet } from '../../src/components/FormSheet'

export default function Rules() {
  const [sheet, setSheet] = useState(null)

  // Rectors can't list hostels — derive theirs from the complaint feed.
  const feedQ = useQuery({
    queryKey: ['complaints', { status: 'ALL' }],
    queryFn: () => complaintsApi.list({ page: 1, pageSize: 20 }),
  })
  const hostelId = useMemo(
    () => feedQ.data?.complaints?.find((c) => c.hostel)?.hostel?.id ?? null,
    [feedQ.data],
  )

  const q = useQuery({
    queryKey: ['rules', hostelId],
    queryFn: () => hostelResidentRulesApi.list(hostelId),
    enabled: !!hostelId,
  })

  const create = useCrud({ mutationFn: (d) => hostelResidentRulesApi.create(d), invalidate: [['rules', hostelId]] })
  const update = useCrud({
    mutationFn: ({ id, ...d }) => hostelResidentRulesApi.update(id, d),
    invalidate: [['rules', hostelId]],
  })
  const remove = useCrud({ mutationFn: (id) => hostelResidentRulesApi.remove(id), invalidate: [['rules', hostelId]] })

  if (feedQ.isLoading || (hostelId && q.isLoading)) return <Loader />
  if (!hostelId)
    return (
      <Screen>
        <EmptyState icon="list-outline" title="Hostel not found" subtitle="File or view a complaint first so the app can detect your hostel." />
      </Screen>
    )
  if (q.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(q.error)} />
      </Screen>
    )

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <View className="flex-row justify-end">
        <Pressable onPress={() => setSheet({})} className="flex-row items-center gap-1">
          <Ionicons name="add-circle" size={20} color="#1d4ed8" />
          <Text className="text-brand font-semibold">Add rule</Text>
        </Pressable>
      </View>

      {(q.data ?? []).length === 0 ? (
        <EmptyState icon="list-outline" title="No rules yet" />
      ) : (
        (q.data ?? []).map((r) => (
          <Pressable key={r.id} onPress={() => setSheet(r)}>
            <Card>
              <View className="flex-row justify-between items-center">
                <Text className={`text-xs font-semibold ${r.kind === 'DONT' ? 'text-red-500' : 'text-green-600'}`}>
                  {r.kind === 'DONT' ? "DON'T" : 'DO'}
                </Text>
                <Ionicons name="create-outline" size={16} color="#94a3b8" />
              </View>
              <Text className="font-semibold text-slate-900 mt-0.5">{r.title}</Text>
              <Text className="text-slate-600 mt-1">{r.description}</Text>
            </Card>
          </Pressable>
        ))
      )}

      <RuleSheet
        item={sheet}
        hostelId={hostelId}
        saving={create.isPending || update.isPending}
        onClose={() => setSheet(null)}
        onSave={(data) => {
          if (sheet?.id) update.submit({ id: sheet.id, ...data }, { onDone: () => setSheet(null) })
          else create.submit({ hostelId, ...data }, { onDone: () => setSheet(null) })
        }}
        onDelete={
          sheet?.id
            ? () =>
                Alert.alert('Delete rule?', null, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => remove.submit(sheet.id, { onDone: () => setSheet(null) }),
                  },
                ])
            : null
        }
      />
    </Screen>
  )
}

function RuleSheet({ item, onClose, onSave, onDelete, saving }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState('DO')
  return (
    <FormSheet
      visible={!!item}
      title={item?.id ? 'Edit rule' : 'New rule'}
      onClose={onClose}
      onOpen={() => {
        setTitle(item?.title ?? '')
        setDescription(item?.description ?? '')
        setKind(item?.kind ?? 'DO')
      }}
    >
      <SelectField
        label="Type"
        value={kind}
        onChange={setKind}
        options={[
          { label: 'Do', value: 'DO' },
          { label: "Don't", value: 'DONT' },
        ]}
      />
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="Description" value={description} onChangeText={setDescription} multiline style={{ minHeight: 80 }} />
      <Button
        title={item?.id ? 'Save' : 'Create'}
        loading={saving}
        onPress={() => title.trim() && description.trim() && onSave({ title: title.trim(), description: description.trim(), kind })}
      />
      {onDelete ? <Button title="Delete" variant="danger" onPress={onDelete} /> : null}
    </FormSheet>
  )
}
