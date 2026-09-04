import { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { staffApi, hostelsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useCrud } from '../../../src/hooks/useCrud'
import { Screen, Card, Row, Button, Field, Loader, ErrorNote } from '../../../src/components/ui'
import { SelectField } from '../../../src/components/form'
import { FormSheet } from '../../../src/components/FormSheet'
import { formatDate } from '../../../src/lib/format'

export default function StaffDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [editSheet, setEditSheet] = useState(false)
  const [assignSheet, setAssignSheet] = useState(false)

  const q = useQuery({ queryKey: ['staff', id], queryFn: () => staffApi.get(id) })
  const hostelsQ = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const inv = [['staff', id], ['staff']]

  const update = useCrud({ mutationFn: (d) => staffApi.update(id, d), invalidate: inv })
  const setStatus = useCrud({ mutationFn: (isActive) => staffApi.setStatus(id, isActive), invalidate: inv })
  const reset = useCrud({ mutationFn: () => staffApi.resetPassword(id), invalidate: inv })
  const addAssign = useCrud({ mutationFn: (d) => staffApi.addAssignment(id, d), invalidate: inv })
  const endAssign = useCrud({
    mutationFn: (assignmentId) => staffApi.endAssignment(assignmentId),
    invalidate: inv,
  })
  const remove = useCrud({ mutationFn: () => staffApi.remove(id), invalidate: [['staff']] })

  function confirmToggleStatus(staff) {
    const active = staff.user?.isActive
    Alert.alert(
      active ? 'Disable this login?' : 'Re-enable this login?',
      active
        ? `${staff.firstName} won't be able to sign in until re-enabled. Their record and tenure history are kept.`
        : `${staff.firstName} will be able to sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: active ? 'Disable' : 'Re-enable',
          style: active ? 'destructive' : 'default',
          onPress: () => setStatus.submit(!active),
        },
      ],
    )
  }

  function confirmDelete(staff) {
    Alert.alert(
      'Delete this person?',
      `Permanently removes ${staff.firstName} ${staff.lastName ?? ''} and their login. Won't work if they have an active tenure or complaint history — disable the login instead.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove.submit(undefined, { onDone: () => router.replace('/staff') }),
        },
      ],
    )
  }

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(q.error)} />
      </Screen>
    )

  const staff = q.data
  const hostelOptions = (hostelsQ.data ?? []).map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Card>
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              {staff.firstName} {staff.lastName ?? ''}
            </Text>
            <Text className="text-slate-500">{staff.user?.loginId}</Text>
          </View>
          <Pressable onPress={() => setEditSheet(true)} hitSlop={10}>
            <Ionicons name="create-outline" size={20} color="#64748b" />
          </Pressable>
        </View>
        <Row label="Phone" value={staff.phone} />
        <Row label="Account" value={staff.user?.isActive ? 'Active' : 'Inactive'} />
      </Card>

      <View className="flex-row gap-3">
        <Button
          title={staff.user?.isActive ? 'Disable login' : 'Re-enable login'}
          variant={staff.user?.isActive ? 'danger' : 'secondary'}
          className="flex-1"
          loading={setStatus.isPending}
          onPress={() => confirmToggleStatus(staff)}
        />
        <Button
          title="Reset password"
          variant="secondary"
          className="flex-1"
          loading={reset.isPending}
          onPress={() =>
            reset.submit(undefined, { onDone: (tp) => Alert.alert('Temporary password', String(tp)) })
          }
        />
      </View>
      <Button
        title="Delete this person"
        variant="danger"
        loading={remove.isPending}
        onPress={() => confirmDelete(staff)}
      />
      <Text className="text-xs text-slate-400 -mt-1">
        Editing name/phone is via the pencil above. Delete needs no active tenure and no complaint history.
      </Text>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="font-semibold text-slate-900">Assignments</Text>
        <Pressable onPress={() => setAssignSheet(true)} className="flex-row items-center gap-1">
          <Ionicons name="add-circle" size={20} color="#1d4ed8" />
          <Text className="text-brand font-semibold">Add</Text>
        </Pressable>
      </View>

      {(staff.assignments ?? []).map((a) => (
        <Card key={a.id}>
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="font-medium text-slate-900">
                {a.roleType} · {a.hostel?.name}
              </Text>
              <Text className="text-slate-400 text-xs">
                {formatDate(a.startDate)} → {a.endDate ? formatDate(a.endDate) : 'present'}
              </Text>
            </View>
            {!a.endDate ? (
              <Pressable
                onPress={() =>
                  Alert.alert('End assignment?', 'Sets the end date to today.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'End', style: 'destructive', onPress: () => endAssign.submit(a.id) },
                  ])
                }
              >
                <Text className="text-red-600 text-sm font-semibold">End</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ))}

      <FormSheet
        visible={editSheet}
        title="Edit staff"
        onClose={() => setEditSheet(false)}
        onOpen={() => {}}
      >
        <EditStaffForm staff={staff} saving={update.isPending} onSave={(d) => update.submit(d, { onDone: () => setEditSheet(false) })} />
      </FormSheet>

      <AssignSheet
        visible={assignSheet}
        hostelOptions={hostelOptions}
        saving={addAssign.isPending}
        onClose={() => setAssignSheet(false)}
        onSave={(d) => addAssign.submit(d, { onDone: () => setAssignSheet(false) })}
      />
    </Screen>
  )
}

function EditStaffForm({ staff, onSave, saving }) {
  const [firstName, setFirstName] = useState(staff.firstName)
  const [lastName, setLastName] = useState(staff.lastName ?? '')
  const [phone, setPhone] = useState(staff.phone)
  const [loginId, setLoginId] = useState(staff.user?.loginId ?? '')
  return (
    <>
      <Field label="First name" value={firstName} onChangeText={setFirstName} />
      <Field label="Last name" value={lastName} onChangeText={setLastName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field
        label="Login email"
        value={loginId}
        onChangeText={setLoginId}
        autoCapitalize="none"
        keyboardType="email-address"
        hint="Used to sign in; takes effect on their next login."
      />
      <Button
        title="Save"
        loading={saving}
        onPress={() => {
          if (!firstName.trim() || !phone.trim() || !loginId.trim()) return
          onSave({
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            phone: phone.trim(),
            loginId: loginId.trim(),
          })
        }}
      />
    </>
  )
}

function AssignSheet({ visible, hostelOptions, onClose, onSave, saving }) {
  const [hostelId, setHostelId] = useState(null)
  const [roleType, setRoleType] = useState('RECTOR')
  return (
    <FormSheet
      visible={visible}
      title="New assignment"
      onClose={onClose}
      onOpen={() => {
        setHostelId(null)
        setRoleType('RECTOR')
      }}
    >
      <SelectField label="Hostel" value={hostelId} onChange={setHostelId} options={hostelOptions} />
      <SelectField
        label="Role"
        value={roleType}
        onChange={setRoleType}
        options={[
          { label: 'Rector', value: 'RECTOR' },
          { label: 'Faculty Incharge', value: 'FACULTY' },
        ]}
      />
      <Button
        title="Add"
        loading={saving}
        onPress={() => hostelId && onSave({ hostelId, roleType })}
      />
    </FormSheet>
  )
}
