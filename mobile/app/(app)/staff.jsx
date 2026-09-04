import { useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { staffApi, hostelsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useCrud } from '../../src/hooks/useCrud'
import { Loader, EmptyState, ErrorNote, Field, Button } from '../../src/components/ui'
import { SelectField } from '../../src/components/form'
import { FormSheet } from '../../src/components/FormSheet'

export default function AdminStaff() {
  const router = useRouter()
  const [sheet, setSheet] = useState(false)
  const q = useQuery({ queryKey: ['staff'], queryFn: staffApi.list })
  const hostelsQ = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })

  const create = useCrud({ mutationFn: (d) => staffApi.create(d), invalidate: [['staff']] })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <ErrorNote message={apiErrorMessage(q.error)} />
      </SafeAreaView>
    )

  const hostelOptions = (hostelsQ.data ?? []).map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <FlatList
        data={q.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
        ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No staff" />}
        renderItem={({ item }) => {
          const active = (item.assignments ?? []).filter((a) => !a.endDate)
          return (
            <Pressable
              onPress={() => router.push(`/staff/${item.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-200 active:opacity-70"
            >
              <View className="flex-row justify-between">
                <Text className="font-semibold text-slate-900">
                  {item.firstName} {item.lastName ?? ''}
                </Text>
                {item.user && !item.user.isActive ? <Text className="text-xs text-red-600">Inactive</Text> : null}
              </View>
              <Text className="text-slate-500 text-sm">{item.phone} · {item.user?.loginId}</Text>
              {active.map((a) => (
                <Text key={a.id} className="text-slate-400 text-xs mt-0.5">
                  {a.roleType} · {a.hostel?.name}
                </Text>
              ))}
            </Pressable>
          )
        }}
      />

      <Pressable
        onPress={() => setSheet(true)}
        className="absolute bottom-6 right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateStaffSheet
        visible={sheet}
        hostelOptions={hostelOptions}
        saving={create.isPending}
        onClose={() => setSheet(false)}
        onSave={(d) =>
          create.submit(d, {
            onDone: (res) => {
              setSheet(false)
              if (res?.tempPassword) Alert.alert('Staff created', `Temporary password: ${res.tempPassword}`)
            },
          })
        }
      />
    </SafeAreaView>
  )
}

function CreateStaffSheet({ visible, hostelOptions, onClose, onSave, saving }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [loginId, setLoginId] = useState('')
  const [roleType, setRoleType] = useState('RECTOR')
  const [hostelId, setHostelId] = useState(null)

  return (
    <FormSheet
      visible={visible}
      title="New Rector / Faculty"
      onClose={onClose}
      onOpen={() => {
        setFirstName('')
        setLastName('')
        setPhone('')
        setLoginId('')
        setRoleType('RECTOR')
        setHostelId(null)
      }}
    >
      <Field label="First name" value={firstName} onChangeText={setFirstName} />
      <Field label="Last name (optional)" value={lastName} onChangeText={setLastName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Login email" value={loginId} onChangeText={setLoginId} autoCapitalize="none" keyboardType="email-address" />
      <SelectField
        label="Role"
        value={roleType}
        onChange={setRoleType}
        options={[
          { label: 'Rector', value: 'RECTOR' },
          { label: 'Faculty Incharge', value: 'FACULTY' },
        ]}
      />
      <SelectField label="Hostel" value={hostelId} onChange={setHostelId} options={hostelOptions} />
      <Button
        title="Create"
        loading={saving}
        onPress={() => {
          if (!firstName.trim() || !phone.trim() || !loginId.trim() || !hostelId) {
            Alert.alert('Missing fields', 'First name, phone, login email and hostel are required.')
            return
          }
          onSave({
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            phone: phone.trim(),
            loginId: loginId.trim(),
            roleType,
            hostelId,
          })
        }}
      />
    </FormSheet>
  )
}
