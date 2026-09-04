import { useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { collegesApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useCrud } from '../../src/hooks/useCrud'
import { Loader, EmptyState, ErrorNote, Card, Field, Button } from '../../src/components/ui'
import { FormSheet } from '../../src/components/FormSheet'

export default function Colleges() {
  const router = useRouter()
  const [sheet, setSheet] = useState(null) // null | {} | college
  const q = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })

  const create = useCrud({
    mutationFn: (data) => collegesApi.create(data),
    invalidate: [['colleges']],
  })
  const update = useCrud({
    mutationFn: ({ id, ...data }) => collegesApi.update(id, data),
    invalidate: [['colleges']],
  })
  const remove = useCrud({
    mutationFn: (id) => collegesApi.remove(id),
    invalidate: [['colleges']],
  })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <ErrorNote message={apiErrorMessage(q.error)} />
      </SafeAreaView>
    )

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <FlatList
        data={q.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
        ListEmptyComponent={<EmptyState icon="school-outline" title="No colleges" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/college/${item.id}`)}
            className="bg-white rounded-2xl p-4 border border-slate-200 active:opacity-70"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{item.name}</Text>
                <Text className="text-slate-500 text-sm">{item.code}</Text>
                <Text className="text-slate-400 text-xs mt-1">
                  {item._count?.programs ?? 0} programs · {item._count?.hostelLinks ?? 0} hostels
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => setSheet(item)} className="p-1">
                <Ionicons name="create-outline" size={20} color="#64748b" />
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => setSheet({})}
        className="absolute bottom-6 right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CollegeSheet
        item={sheet}
        onClose={() => setSheet(null)}
        onSave={(data) => {
          const isEdit = sheet && sheet.id
          const action = isEdit ? update : create
          action.submit(isEdit ? { id: sheet.id, ...data } : data, { onDone: () => setSheet(null) })
        }}
        onDelete={
          sheet && sheet.id
            ? () =>
                Alert.alert('Delete college?', 'This removes its programs too.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => remove.submit(sheet.id, { onDone: () => setSheet(null) }),
                  },
                ])
            : null
        }
        saving={create.isPending || update.isPending}
      />
    </SafeAreaView>
  )
}

function CollegeSheet({ item, onClose, onSave, onDelete, saving }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')

  return (
    <FormSheet
      visible={!!item}
      title={item?.id ? 'Edit college' : 'New college'}
      onClose={onClose}
      onOpen={() => {
        setName(item?.name ?? '')
        setCode(item?.code ?? '')
        setAddress(item?.address ?? '')
      }}
    >
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Code" value={code} onChangeText={setCode} autoCapitalize="characters" />
      <Field label="Address (optional)" value={address} onChangeText={setAddress} />
      <Button
        title={item?.id ? 'Save' : 'Create'}
        loading={saving}
        onPress={() => {
          if (!name.trim() || !code.trim()) return
          onSave({ name: name.trim(), code: code.trim(), address: address.trim() || undefined })
        }}
      />
      {onDelete ? <Button title="Delete" variant="danger" onPress={onDelete} /> : null}
    </FormSheet>
  )
}
