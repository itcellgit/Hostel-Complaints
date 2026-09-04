import { useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { hostelsApi, collegesApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useCrud } from '../../src/hooks/useCrud'
import { Loader, EmptyState, ErrorNote, Field, Button } from '../../src/components/ui'
import { SelectField, MultiSelectField } from '../../src/components/form'
import { FormSheet } from '../../src/components/FormSheet'

export default function Hostels() {
  const [sheet, setSheet] = useState(null)
  const q = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const collegesQ = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })

  const create = useCrud({ mutationFn: (d) => hostelsApi.create(d), invalidate: [['hostels']] })
  const update = useCrud({ mutationFn: ({ id, ...d }) => hostelsApi.update(id, d), invalidate: [['hostels']] })
  const remove = useCrud({ mutationFn: (id) => hostelsApi.remove(id), invalidate: [['hostels']] })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <ErrorNote message={apiErrorMessage(q.error)} />
      </SafeAreaView>
    )

  const collegeOptions = (collegesQ.data ?? []).map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <FlatList
        data={q.data ?? []}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
        ListEmptyComponent={<EmptyState icon="business-outline" title="No hostels" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSheet(item)}
            className="bg-white rounded-2xl p-4 border border-slate-200 flex-row justify-between items-start active:opacity-70"
          >
            <View className="flex-1">
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-slate-500 text-sm">
                {item.code} · {item.type}
                {item.totalCapacity ? ` · cap. ${item.totalCapacity}` : ''}
              </Text>
              <Text className="text-slate-400 text-xs mt-1">
                {item._count?.students ?? 0} active students ·{' '}
                {(item.collegeLinks ?? []).map((l) => l.college.code).join(', ')}
              </Text>
            </View>
            <Ionicons name="create-outline" size={20} color="#64748b" />
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => setSheet({})}
        className="absolute bottom-6 right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <HostelSheet
        item={sheet}
        collegeOptions={collegeOptions}
        saving={create.isPending || update.isPending}
        onClose={() => setSheet(null)}
        onSave={(data) => {
          if (sheet?.id) update.submit({ id: sheet.id, ...data }, { onDone: () => setSheet(null) })
          else create.submit(data, { onDone: () => setSheet(null) })
        }}
        onDelete={
          sheet?.id
            ? () =>
                Alert.alert('Delete hostel?', 'Only works if it has no students/complaints.', [
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
    </SafeAreaView>
  )
}

function HostelSheet({ item, collegeOptions, onClose, onSave, onDelete, saving }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState('BOYS')
  const [address, setAddress] = useState('')
  const [capacity, setCapacity] = useState('')
  const [collegeIds, setCollegeIds] = useState([])

  return (
    <FormSheet
      visible={!!item}
      title={item?.id ? 'Edit hostel' : 'New hostel'}
      onClose={onClose}
      onOpen={() => {
        setName(item?.name ?? '')
        setCode(item?.code ?? '')
        setType(item?.type ?? 'BOYS')
        setAddress(item?.address ?? '')
        setCapacity(item?.totalCapacity ? String(item.totalCapacity) : '')
        setCollegeIds((item?.collegeLinks ?? []).map((l) => l.college.id))
      }}
    >
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Code" value={code} onChangeText={setCode} autoCapitalize="characters" />
      <SelectField
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { label: 'Boys', value: 'BOYS' },
          { label: 'Girls', value: 'GIRLS' },
        ]}
      />
      <MultiSelectField label="Linked colleges" value={collegeIds} onChange={setCollegeIds} options={collegeOptions} />
      <Field label="Address (optional)" value={address} onChangeText={setAddress} />
      <Field label="Capacity (optional)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
      <Button
        title={item?.id ? 'Save' : 'Create'}
        loading={saving}
        onPress={() => {
          if (!name.trim() || !code.trim() || collegeIds.length === 0) {
            Alert.alert('Missing fields', 'Name, code and at least one college are required.')
            return
          }
          onSave({
            name: name.trim(),
            code: code.trim(),
            type,
            collegeIds,
            address: address.trim() || undefined,
            totalCapacity: capacity ? Number(capacity) : undefined,
          })
        }}
      />
      {onDelete ? <Button title="Delete" variant="danger" onPress={onDelete} /> : null}
    </FormSheet>
  )
}
