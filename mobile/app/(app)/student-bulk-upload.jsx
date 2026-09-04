import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { studentsApi, hostelsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useAuth } from '../../src/auth/AuthContext'
import { useCrud } from '../../src/hooks/useCrud'
import { Screen, Card, Button, Row } from '../../src/components/ui'
import { SelectField } from '../../src/components/form'

export default function StudentBulkUpload() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [file, setFile] = useState(null)
  const [hostelId, setHostelId] = useState(null)
  const [report, setReport] = useState(null)

  const hostelsQ = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list(), enabled: isAdmin })
  const columnsQ = useQuery({ queryKey: ['import-template'], queryFn: studentsApi.importTemplate })

  const upload = useCrud({
    mutationFn: () => studentsApi.bulkUpload(file, isAdmin ? hostelId : undefined),
    invalidate: [['students']],
  })

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/comma-separated-values',
        'application/csv',
      ],
      copyToCacheDirectory: true,
    })
    if (!res.canceled) setFile(res.assets[0])
  }

  function submit() {
    if (!file) return Alert.alert('Pick a file first')
    if (isAdmin && !hostelId) return Alert.alert('Pick a hostel')
    upload.submit(undefined, {
      onDone: (r) => setReport(r),
    })
  }

  return (
    <Screen>
      <Card>
        <Text className="font-semibold text-slate-900 mb-1">Expected columns</Text>
        <Text className="text-slate-600 text-sm">{(columnsQ.data ?? []).join(', ') || '…'}</Text>
      </Card>

      {isAdmin ? (
        <SelectField
          label="Hostel"
          value={hostelId}
          onChange={setHostelId}
          options={(hostelsQ.data ?? []).map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))}
        />
      ) : null}

      <Button
        title={file ? `Selected: ${file.name}` : 'Choose .xlsx / .csv file'}
        variant="ghost"
        icon="document-attach-outline"
        onPress={pick}
      />
      <Button title="Upload" loading={upload.isPending} onPress={submit} />

      {report ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Import result</Text>
          <Row label="Created" value={(report.created ?? []).length} />
          <Row label="Errors" value={(report.errors ?? []).length} />
          {report.defaultPassword ? (
            <Row label="Default password" value={report.defaultPassword} />
          ) : null}
          {(report.errors ?? []).slice(0, 25).map((e, i) => (
            <Text key={i} className="text-red-600 text-xs mt-1">
              Row {e.rowNumber ?? '?'}{e.usn ? ` (${e.usn})` : ''}: {e.message}
            </Text>
          ))}
          <Button title="Done" variant="secondary" className="mt-3" onPress={() => router.back()} />
        </Card>
      ) : null}
    </Screen>
  )
}
