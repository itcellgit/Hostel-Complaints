import { useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { usersApi, collegesApi, hostelsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useCrud } from '../../src/hooks/useCrud'
import { Loader, EmptyState, ErrorNote, Field, Button } from '../../src/components/ui'
import { SelectField, MultiSelectField } from '../../src/components/form'
import { FormSheet } from '../../src/components/FormSheet'
import { ROLE_LABEL, CELL_ROLES } from '../../src/lib/roles'

const OFFICE_ROLES = ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'DEAN_INFRA', ...CELL_ROLES]

export default function AdminUsers() {
  const [sheet, setSheet] = useState(null)
  const q = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() })
  const collegesQ = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })
  const hostelsQ = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })

  const create = useCrud({
    mutationFn: (d) => usersApi.create(d),
    invalidate: [['users']],
  })
  const update = useCrud({
    mutationFn: ({ id, ...d }) => usersApi.update(id, d),
    invalidate: [['users']],
  })
  const reset = useCrud({
    mutationFn: (id) => usersApi.resetPassword(id),
    invalidate: [['users']],
  })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <ErrorNote message={apiErrorMessage(q.error)} />
      </SafeAreaView>
    )

  const collegeOptions = (collegesQ.data ?? []).map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))
  const hostelOptions = (hostelsQ.data ?? []).map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      <FlatList
        data={q.data ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
        ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No users" />}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 border border-slate-200">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{item.loginId}</Text>
                <Text className="text-slate-500 text-sm">{ROLE_LABEL[item.role] ?? item.role}</Text>
                {!item.isActive ? <Text className="text-red-600 text-xs mt-0.5">Inactive</Text> : null}
                {item.passwordResetRequestedAt ? (
                  <Text className="text-amber-600 text-xs mt-0.5">Password reset requested</Text>
                ) : null}
              </View>
              <Pressable hitSlop={10} onPress={() => setSheet(item)} className="p-1">
                <Ionicons name="create-outline" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="flex-row gap-4 mt-2">
              <Pressable
                onPress={() =>
                  Alert.alert('Reset password?', `New temp password for ${item.loginId}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      onPress: () =>
                        reset.submit(item.id, {
                          onDone: (tp) => Alert.alert('Temporary password', String(tp)),
                        }),
                    },
                  ])
                }
              >
                <Text className="text-brand text-sm font-semibold">Reset password</Text>
              </Pressable>
              <Pressable
                onPress={() => update.submit({ id: item.id, isActive: !item.isActive })}
              >
                <Text className="text-sm font-semibold text-slate-600">
                  {item.isActive ? 'Deactivate' : 'Reactivate'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable
        onPress={() => setSheet({})}
        className="absolute bottom-6 right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <UserSheet
        item={sheet}
        collegeOptions={collegeOptions}
        hostelOptions={hostelOptions}
        saving={create.isPending || update.isPending}
        onClose={() => setSheet(null)}
        onCreate={(d) =>
          create.submit(d, {
            onDone: (res) => {
              setSheet(null)
              if (res?.tempPassword) Alert.alert('User created', `Temporary password: ${res.tempPassword}`)
            },
          })
        }
        onUpdate={(d) => update.submit({ id: sheet.id, ...d }, { onDone: () => setSheet(null) })}
      />
    </SafeAreaView>
  )
}

function UserSheet({ item, collegeOptions, hostelOptions, onClose, onCreate, onUpdate, saving }) {
  const isEdit = !!item?.id
  const [loginId, setLoginId] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [principalCollegeId, setPrincipalCollegeId] = useState(null)
  const [hostelIds, setHostelIds] = useState([])

  return (
    <FormSheet
      visible={!!item}
      title={isEdit ? 'Edit user' : 'New user'}
      onClose={onClose}
      onOpen={() => {
        setLoginId(item?.loginId ?? '')
        setRole(item?.role ?? 'ADMIN')
        setPrincipalCollegeId(item?.principalCollegeId ?? null)
        setHostelIds([])
      }}
    >
      <Field
        label="Login email"
        value={loginId}
        onChangeText={setLoginId}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {!isEdit ? (
        <SelectField
          label="Role"
          value={role}
          onChange={setRole}
          options={OFFICE_ROLES.map((r) => ({ label: ROLE_LABEL[r] ?? r, value: r }))}
        />
      ) : (
        <Text className="text-slate-500 text-sm">Role: {ROLE_LABEL[item.role] ?? item.role} (can't change)</Text>
      )}

      {role === 'PRINCIPAL' ? (
        <SelectField
          label="College"
          value={principalCollegeId}
          onChange={setPrincipalCollegeId}
          options={collegeOptions}
        />
      ) : null}
      {role === 'DEAN_INFRA' ? (
        <MultiSelectField label="Hostels" value={hostelIds} onChange={setHostelIds} options={hostelOptions} />
      ) : null}

      <Button
        title={isEdit ? 'Save' : 'Create'}
        loading={saving}
        onPress={() => {
          if (!loginId.trim()) return
          if (isEdit) {
            onUpdate({
              loginId: loginId.trim(),
              principalCollegeId: item.role === 'PRINCIPAL' ? principalCollegeId : undefined,
              hostelIds: item.role === 'DEAN_INFRA' && hostelIds.length ? hostelIds : undefined,
            })
            return
          }
          if (role === 'PRINCIPAL' && !principalCollegeId) return Alert.alert('Pick a college')
          if (role === 'DEAN_INFRA' && hostelIds.length === 0) return Alert.alert('Pick at least one hostel')
          onCreate({
            loginId: loginId.trim(),
            role,
            principalCollegeId: role === 'PRINCIPAL' ? principalCollegeId : undefined,
            hostelIds: role === 'DEAN_INFRA' ? hostelIds : undefined,
          })
        }}
      />
    </FormSheet>
  )
}
