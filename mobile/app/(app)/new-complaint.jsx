import { useMemo, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { complaintsApi, studentsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useAuth } from '../../src/auth/AuthContext'
import { Screen, Card, Field, Button, ErrorNote } from '../../src/components/ui'
import { COMPLAINT_CATEGORIES, CATEGORY_LABEL } from '../../src/lib/roles'

export default function NewComplaint() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuth()
  const isRector = user?.role === 'RECTOR'

  const [category, setCategory] = useState(null)
  const [description, setDescription] = useState('')
  const [hostelId, setHostelId] = useState(null)
  const [roomNo, setRoomNo] = useState('')
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')

  // Students: hostel is derived server-side. Rectors: pick from the hostels
  // seen in their own complaint feed (they can't list hostels directly).
  const meQ = useQuery({ queryKey: ['student-me'], queryFn: studentsApi.me, enabled: user?.role === 'STUDENT' })
  const feedQ = useQuery({
    queryKey: ['complaints', { status: 'ALL' }],
    queryFn: () => complaintsApi.list({ page: 1, pageSize: 50 }),
    enabled: isRector,
  })
  const rectorHostels = useMemo(() => {
    const map = new Map()
    ;(feedQ.data?.complaints ?? []).forEach((c) => c.hostel && map.set(c.hostel.id, c.hostel))
    return [...map.values()]
  }, [feedQ.data])

  const mutation = useMutation({
    mutationFn: () =>
      complaintsApi.create(
        {
          category,
          description,
          ...(isRector ? { hostelId, roomNo: roomNo || undefined } : {}),
        },
        photo,
      ),
    onSuccess: (complaint) => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
      qc.invalidateQueries({ queryKey: ['student-dashboard'] })
      router.replace(`/complaint/${complaint.id}`)
    },
    onError: (e) => setError(apiErrorMessage(e)),
  })

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (!res.canceled) setPhoto(res.assets[0])
  }

  function submit() {
    setError('')
    if (!category) return setError('Pick a category')
    if (description.trim().length < 10) return setError('Describe the issue in a bit more detail (min 10 chars)')
    if (isRector && !hostelId) return setError('Pick a hostel')
    mutation.mutate()
  }

  return (
    <Screen>
      {user?.role === 'STUDENT' && meQ.data ? (
        <Card>
          <Text className="text-slate-500 text-sm">Filing for</Text>
          <Text className="font-semibold text-slate-900">
            {meQ.data.student.hostel?.name} · Room {meQ.data.student.roomNo}
          </Text>
        </Card>
      ) : null}

      {isRector ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-2">Hostel</Text>
          {rectorHostels.length === 0 ? (
            <Text className="text-slate-500 text-sm">
              No hostel could be determined automatically. Raise this from the web portal instead.
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {rectorHostels.map((h) => (
                <Chip key={h.id} label={h.name} active={hostelId === h.id} onPress={() => setHostelId(h.id)} />
              ))}
            </View>
          )}
          <Field label="Room no (optional)" value={roomNo} onChangeText={setRoomNo} className="mt-2" />
        </Card>
      ) : null}

      <Card>
        <Text className="font-semibold text-slate-900 mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {COMPLAINT_CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </Card>

      <Field
        label="Description"
        placeholder="Describe the issue"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ minHeight: 100 }}
      />

      <Button
        title={photo ? 'Photo attached ✓ (tap to change)' : 'Attach a photo (optional)'}
        variant="ghost"
        icon="image-outline"
        onPress={pickPhoto}
      />

      <ErrorNote message={error} />
      <Button title="Submit complaint" onPress={submit} loading={mutation.isPending} />
    </Screen>
  )
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-2 rounded-full border ${active ? 'bg-brand border-brand' : 'bg-white border-slate-300'}`}
    >
      <Text className={active ? 'text-white text-sm font-semibold' : 'text-slate-700 text-sm'}>{label}</Text>
    </Pressable>
  )
}
