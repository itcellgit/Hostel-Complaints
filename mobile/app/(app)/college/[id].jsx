import { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { collegesApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useCrud } from '../../../src/hooks/useCrud'
import { Screen, Card, Field, Button, Loader, ErrorNote, Row } from '../../../src/components/ui'
import { FormSheet } from '../../../src/components/FormSheet'

export default function CollegeDetail() {
  const { id } = useLocalSearchParams()
  const [sheet, setSheet] = useState(null)

  const collegeQ = useQuery({ queryKey: ['college', id], queryFn: () => collegesApi.get(id) })
  const programsQ = useQuery({ queryKey: ['programs', id], queryFn: () => collegesApi.listPrograms(id) })

  const createP = useCrud({
    mutationFn: (data) => collegesApi.createProgram(id, data),
    invalidate: [['programs', id], ['college', id], ['colleges']],
  })
  const updateP = useCrud({
    mutationFn: ({ pid, ...data }) => collegesApi.updateProgram(pid, data),
    invalidate: [['programs', id]],
  })
  const removeP = useCrud({
    mutationFn: (pid) => collegesApi.removeProgram(pid),
    invalidate: [['programs', id], ['college', id], ['colleges']],
  })

  if (collegeQ.isLoading) return <Loader />
  if (collegeQ.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(collegeQ.error)} />
      </Screen>
    )

  const college = collegeQ.data

  return (
    <Screen refreshing={programsQ.isRefetching} onRefresh={programsQ.refetch}>
      <Card>
        <Text className="text-lg font-bold text-slate-900">{college.name}</Text>
        <Row label="Code" value={college.code} />
        <Row label="Address" value={college.address} />
      </Card>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="font-semibold text-slate-900">Programs</Text>
        <Pressable onPress={() => setSheet({})} className="flex-row items-center gap-1">
          <Ionicons name="add-circle" size={20} color="#1d4ed8" />
          <Text className="text-brand font-semibold">Add</Text>
        </Pressable>
      </View>

      {(programsQ.data ?? []).map((p) => (
        <Pressable
          key={p.id}
          onPress={() => setSheet(p)}
          className="bg-white rounded-xl p-4 border border-slate-200 flex-row justify-between items-center"
        >
          <View>
            <Text className="font-medium text-slate-900">{p.name}</Text>
            <Text className="text-slate-500 text-sm">{p.code}</Text>
          </View>
          <Ionicons name="create-outline" size={18} color="#64748b" />
        </Pressable>
      ))}
      {(programsQ.data ?? []).length === 0 ? (
        <Text className="text-slate-400 text-sm">No programs yet.</Text>
      ) : null}

      <ProgramSheet
        item={sheet}
        onClose={() => setSheet(null)}
        saving={createP.isPending || updateP.isPending}
        onSave={(data) => {
          if (sheet?.id) updateP.submit({ pid: sheet.id, ...data }, { onDone: () => setSheet(null) })
          else createP.submit(data, { onDone: () => setSheet(null) })
        }}
        onDelete={
          sheet?.id
            ? () =>
                Alert.alert('Delete program?', null, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => removeP.submit(sheet.id, { onDone: () => setSheet(null) }),
                  },
                ])
            : null
        }
      />
    </Screen>
  )
}

function ProgramSheet({ item, onClose, onSave, onDelete, saving }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  return (
    <FormSheet
      visible={!!item}
      title={item?.id ? 'Edit program' : 'New program'}
      onClose={onClose}
      onOpen={() => {
        setName(item?.name ?? '')
        setCode(item?.code ?? '')
      }}
    >
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Code" value={code} onChangeText={setCode} autoCapitalize="characters" />
      <Button
        title={item?.id ? 'Save' : 'Create'}
        loading={saving}
        onPress={() => name.trim() && code.trim() && onSave({ name: name.trim(), code: code.trim() })}
      />
      {onDelete ? <Button title="Delete" variant="danger" onPress={onDelete} /> : null}
    </FormSheet>
  )
}
