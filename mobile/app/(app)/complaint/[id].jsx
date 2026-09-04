import { useState } from 'react'
import { Alert, Image, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { complaintsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useAuth } from '../../../src/auth/AuthContext'
import { useComplaintActions } from '../../../src/hooks/useComplaintActions'
import { SelectField } from '../../../src/components/form'
import { DateTimeField } from '../../../src/components/DateTimeField'
import {
  Screen,
  Card,
  Row,
  Button,
  Field,
  Loader,
  ErrorNote,
  StatusBadge,
  CategoryBadge,
} from '../../../src/components/ui'
import { CELL_ROLES, ROLE_LABEL } from '../../../src/lib/roles'
import { formatDate, formatDateTime } from '../../../src/lib/format'
import { fileUrl } from '../../../src/config'

export default function ComplaintDetail() {
  const { id } = useLocalSearchParams()
  const { user } = useAuth()
  const actions = useComplaintActions(id)

  const query = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.get(id),
  })

  if (query.isLoading) return <Loader />
  if (query.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(query.error)} />
      </Screen>
    )

  const { complaint, activities } = query.data
  const mine = user?.role === 'STUDENT' && complaint.studentId === user?.studentId
  const assignedToMe = complaint.assignedTo?.id === user?.id

  return (
    <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-slate-900">{complaint.complaintNo}</Text>
          <StatusBadge status={complaint.status} />
        </View>
        <View className="flex-row gap-2 mt-2">
          <CategoryBadge category={complaint.category} />
        </View>
        <Text className="text-slate-700 mt-3">{complaint.description}</Text>
      </Card>

      <Card>
        <Row label="Hostel" value={complaint.hostel?.name} />
        <Row
          label="Student"
          value={
            complaint.student
              ? `${complaint.student.firstName} ${complaint.student.lastName} (${complaint.student.usn})`
              : 'Hostel-wide'
          }
        />
        <Row label="Room" value={complaint.roomNo || complaint.student?.roomNo} />
        <Row label="Filed by" value={`${complaint.complainerName} · ${complaint.complainerPhone}`} />
        <Row label="Filed on" value={formatDate(complaint.createdAt)} />
        <Row
          label="Assigned to"
          value={
            complaint.assignedTo
              ? `${ROLE_LABEL[complaint.assignedTo.role] ?? complaint.assignedTo.role}`
              : '—'
          }
        />
        {complaint.estimatedCompletionAt ? (
          <Row label="ETA" value={formatDateTime(complaint.estimatedCompletionAt)} />
        ) : null}
      </Card>

      {complaint.feeSummary ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Student fee summary</Text>
          <Row label="Total paid" value={`₹${Number(complaint.feeSummary.totalPaid).toLocaleString('en-IN')}`} />
          <Row label="Payments" value={complaint.feeSummary.paymentCount} />
        </Card>
      ) : null}

      {complaint.resolutionRemarks ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Resolution</Text>
          <Text className="text-slate-700">{complaint.resolutionRemarks}</Text>
          {complaint.resolutionImagePath ? (
            <Image
              source={{ uri: fileUrl(complaint.resolutionImagePath) }}
              className="w-full h-48 rounded-xl mt-2"
              resizeMode="cover"
            />
          ) : null}
        </Card>
      ) : null}

      {complaint.attachmentPath ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Attachment</Text>
          <Image
            source={{ uri: fileUrl(complaint.attachmentPath) }}
            className="w-full h-48 rounded-xl"
            resizeMode="cover"
          />
        </Card>
      ) : null}

      <ActionPanel
        complaint={complaint}
        user={user}
        mine={mine}
        assignedToMe={assignedToMe}
        actions={actions}
      />

      <Text className="font-semibold text-slate-900 mt-2">Activity</Text>
      {activities.map((a) => (
        <View key={a.id} className="bg-white rounded-xl p-3 border border-slate-200">
          <Text className="text-xs text-slate-400">
            {formatDateTime(a.createdAt)} · {ROLE_LABEL[a.user?.role] ?? a.user?.role}
          </Text>
          <Text className="text-slate-700 mt-1">
            {a.action === 'STATUS_CHANGE'
              ? `${a.fromStatus ?? '—'} → ${a.toStatus}`
              : a.action === 'ETA_UPDATE'
                ? 'ETA updated'
                : 'Comment'}
            {a.comment ? `: ${a.comment}` : ''}
          </Text>
        </View>
      ))}
    </Screen>
  )
}

function ActionPanel({ complaint, user, mine, assignedToMe, actions }) {
  const role = user?.role
  const [comment, setComment] = useState('')
  const [remarks, setRemarks] = useState('')
  const [eta, setEta] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [forwardRole, setForwardRole] = useState(null)
  const isCell = CELL_ROLES.includes(role)

  const canComment = ['DEAN_INFRA', 'FACULTY', 'RECTOR', 'STUDENT', ...CELL_ROLES].includes(role) &&
    (role !== 'STUDENT' || mine)

  function run(mutation, payload, okMsg) {
    mutation.mutate(payload, {
      onError: (e) => Alert.alert('Error', apiErrorMessage(e)),
      onSuccess: () => {
        setComment('')
        setRemarks('')
        setEta(null)
        setPhoto(null)
        setForwardRole(null)
        if (okMsg) Alert.alert('Done', okMsg)
      },
    })
  }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (!res.canceled) setPhoto(res.assets[0])
  }

  const showForward = role === 'DEAN_INFRA' && assignedToMe && complaint.status === 'OPEN'
  const showReject =
    assignedToMe &&
    ((role === 'DEAN_INFRA' && complaint.status === 'OPEN') ||
      ((role === 'FACULTY' || isCell) && complaint.status === 'IN_PROGRESS')) &&
    !(isCell && complaint.estimatedCompletionAt)
  const showEta = isCell && assignedToMe && complaint.status === 'IN_PROGRESS'
  const showResolve =
    assignedToMe && complaint.status === 'IN_PROGRESS' && (role === 'FACULTY' || isCell)
  const showClose =
    complaint.status === 'RESOLVED' && ((role === 'STUDENT' && mine) || role === 'FACULTY')

  if (!canComment && !showForward && !showReject && !showEta && !showResolve && !showClose) return null

  return (
    <Card className="gap-3">
      <Text className="font-semibold text-slate-900">Actions</Text>

      {showForward ? (
        <View className="gap-2">
          <SelectField
            label="Forward to facility cell"
            value={forwardRole}
            onChange={setForwardRole}
            placeholder="Choose a cell…"
            options={CELL_ROLES.map((r) => ({ label: ROLE_LABEL[r] ?? r, value: r }))}
          />
          <Field label="Note (optional)" placeholder="Anything the cell should know" value={comment} onChangeText={setComment} />
          <Button
            title={forwardRole ? `Forward to ${ROLE_LABEL[forwardRole]}` : 'Forward'}
            icon="arrow-redo-outline"
            loading={actions.forward.isPending}
            disabled={!forwardRole}
            onPress={() =>
              run(
                actions.forward,
                { role: forwardRole, comment: comment.trim() || undefined },
                `Forwarded to ${ROLE_LABEL[forwardRole]}`,
              )
            }
          />
        </View>
      ) : null}

      {showEta ? (
        <View className="gap-2">
          <DateTimeField label="Estimated completion" value={eta} onChange={setEta} />
          <Field
            label="Note (optional)"
            placeholder="Anything about the timeline"
            value={comment}
            onChangeText={setComment}
          />
          <Button
            title={complaint.estimatedCompletionAt ? 'Update ETA' : 'Set ETA'}
            variant="secondary"
            loading={actions.setEta.isPending}
            disabled={!eta}
            onPress={() =>
              run(
                actions.setEta,
                { estimatedCompletionAt: eta.toISOString(), comment: comment.trim() || undefined },
                'ETA set',
              )
            }
          />
        </View>
      ) : null}

      {showResolve ? (
        <View className="gap-2">
          <Field
            label="Resolution remarks"
            placeholder="What was done"
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />
          {isCell ? (
            <Button
              title={photo ? 'Photo attached ✓' : 'Attach photo of completed work'}
              variant="ghost"
              icon="camera-outline"
              onPress={pickPhoto}
            />
          ) : null}
          <Button
            title="Mark resolved"
            loading={actions.setStatus.isPending}
            onPress={() =>
              run(
                actions.setStatus,
                { status: 'RESOLVED', resolutionRemarks: remarks, file: photo },
                'Marked resolved',
              )
            }
          />
        </View>
      ) : null}

      {showReject ? (
        <View className="gap-2">
          <Field
            label="Reason for rejection"
            placeholder="Required"
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />
          <Button
            title="Reject complaint"
            variant="danger"
            loading={actions.setStatus.isPending}
            onPress={() =>
              run(actions.setStatus, { status: 'REJECTED', resolutionRemarks: remarks }, 'Complaint rejected')
            }
          />
        </View>
      ) : null}

      {showClose ? (
        <View className="gap-2">
          <Field
            label={role === 'FACULTY' ? 'Closing comment (required)' : 'Feedback (optional)'}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <Button
            title="Close complaint"
            loading={actions.close.isPending}
            onPress={() => run(actions.close, comment, 'Complaint closed')}
          />
        </View>
      ) : null}

      {canComment ? (
        <View className="gap-2">
          <Field label="Add a comment" value={comment} onChangeText={setComment} multiline />
          <Button
            title="Post comment"
            variant="secondary"
            loading={actions.comment.isPending}
            disabled={!comment.trim()}
            onPress={() => run(actions.comment, comment.trim())}
          />
        </View>
      ) : null}
    </Card>
  )
}
