import { useState } from 'react'
import { Alert, Image, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useAuth } from '../../../src/auth/AuthContext'
import { useComplaintActions } from '../../../src/hooks/useComplaintActions'
import { SelectField } from '../../../src/components/form'
import { DateTimeField } from '../../../src/components/DateTimeField'
import { ComplaintTimeline } from '../../../src/components/ComplaintTimeline'
import { MaintainerCompleteSheet, pickPhoto } from '../../../src/components/MaintainerCompleteSheet'
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
  UrgencyBadge,
} from '../../../src/components/ui'
import { CELL_ROLES, ROLE_LABEL } from '../../../src/lib/roles'
import { currentHandler, handlerText } from '../../../src/lib/complaint'
import { formatDate, formatDateTime, resolutionTime } from '../../../src/lib/format'
import { fileUrl } from '../../../src/config'

function Photo({ title, path }) {
  return (
    <Card>
      <Text className="font-semibold text-slate-900 mb-2">{title}</Text>
      <Image source={{ uri: fileUrl(path) }} className="w-full h-48 rounded-xl" resizeMode="cover" />
    </Card>
  )
}

export default function ComplaintDetail() {
  const { id } = useLocalSearchParams()
  const { user } = useAuth()
  const actions = useComplaintActions(id)
  const [completing, setCompleting] = useState(false)

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
  const handler = currentHandler(complaint)
  const resolvedIn = resolutionTime(complaint)

  return (
    <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
      <Card>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-lg font-bold text-slate-900">{complaint.complaintNo}</Text>
          <StatusBadge status={complaint.status} assigneeRole={complaint.assignedTo?.role} />
        </View>
        <View className="flex-row flex-wrap gap-2 mt-2">
          <CategoryBadge category={complaint.category} />
          <UrgencyBadge status={complaint.status} since={complaint.statusChangedAt} />
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
        <Row label="Filed on" value={formatDateTime(complaint.createdAt)} />
        {handler ? <Row label="Currently with" value={handlerText(handler)} /> : null}
        {complaint.estimatedCompletionAt ? (
          <Row label="Est. completion" value={formatDateTime(complaint.estimatedCompletionAt)} />
        ) : null}
        {complaint.resolvedAt ? <Row label="Resolved on" value={formatDateTime(complaint.resolvedAt)} /> : null}
        {resolvedIn ? <Row label="Resolution time" value={resolvedIn} /> : null}
        {complaint.closedAt ? <Row label="Closed on" value={formatDate(complaint.closedAt)} /> : null}
      </Card>

      {complaint.feeSummary ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Student fee summary</Text>
          <Row label="Total paid" value={`₹${Number(complaint.feeSummary.totalPaid).toLocaleString('en-IN')}`} />
          <Row label="Payments" value={complaint.feeSummary.paymentCount} />
        </Card>
      ) : null}

      {complaint.attachmentPath ? <Photo title="Attached photo" path={complaint.attachmentPath} /> : null}

      {complaint.resolutionRemarks || complaint.resolutionImagePath ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Resolution</Text>
          {complaint.resolutionRemarks ? <Text className="text-slate-700">{complaint.resolutionRemarks}</Text> : null}
          {complaint.resolutionImagePath ? (
            <Image
              source={{ uri: fileUrl(complaint.resolutionImagePath) }}
              className="w-full h-48 rounded-xl mt-2"
              resizeMode="cover"
            />
          ) : null}
        </Card>
      ) : null}

      {complaint.maintainerProofPath ? (
        <Photo title="Maintainer's proof of completion" path={complaint.maintainerProofPath} />
      ) : null}

      {complaint.closingComment ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-1">Closing comment</Text>
          <Text className="text-slate-700">{complaint.closingComment}</Text>
        </Card>
      ) : null}

      <ActionPanel
        complaint={complaint}
        user={user}
        mine={mine}
        assignedToMe={assignedToMe}
        actions={actions}
        onMaintainerComplete={() => setCompleting(true)}
      />

      <Card>
        <Text className="font-semibold text-slate-900 mb-3">Activity</Text>
        <ComplaintTimeline activities={activities} />
      </Card>

      <MaintainerCompleteSheet complaint={completing ? complaint : null} onClose={() => setCompleting(false)} />
    </Screen>
  )
}

function ActionPanel({ complaint, user, mine, assignedToMe, actions, onMaintainerComplete }) {
  const role = user?.role
  const [comment, setComment] = useState('')
  const [remarks, setRemarks] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [eta, setEta] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [forwardRole, setForwardRole] = useState(null)
  const [maintainerId, setMaintainerId] = useState(null)
  const [assignNote, setAssignNote] = useState('')
  const isCell = CELL_ROLES.includes(role)
  const status = complaint.status

  // Only a facility cell assigns work, and only to its own department's maintainers.
  const maintainersQ = useQuery({
    queryKey: ['maintainers'],
    queryFn: complaintsApi.maintainers,
    enabled: isCell,
  })
  const maintainers = maintainersQ.data ?? []

  function run(mutation, payload, okMsg) {
    mutation.mutate(payload, {
      onError: (e) => Alert.alert('Error', apiErrorMessage(e)),
      onSuccess: () => {
        setComment('')
        setRemarks('')
        setRejectReason('')
        setEta(null)
        setPhoto(null)
        setForwardRole(null)
        setMaintainerId(null)
        setAssignNote('')
        if (okMsg) Alert.alert('Done', okMsg)
      },
    })
  }

  // Same rules as client/src/pages/complaints/ComplaintDetailPage.jsx.
  const canComment = ['DEAN_INFRA', 'FACULTY', 'RECTOR', 'MAINTAINER', ...CELL_ROLES].includes(role) || mine
  const canClose = status === 'RESOLVED' && (mine || role === 'FACULTY')
  const canForward = assignedToMe && role === 'DEAN_INFRA' && status === 'OPEN'
  const canWork = assignedToMe && (role === 'FACULTY' || isCell) && ['OPEN', 'IN_PROGRESS'].includes(status)
  // Once a facility cell has committed to an ETA they've accepted the job.
  const canReject =
    assignedToMe && ['OPEN', 'IN_PROGRESS'].includes(status) && !(isCell && complaint.estimatedCompletionAt)
  const canEta = isCell && assignedToMe && ['IN_PROGRESS', 'ASSIGNED_TO_MAINTAINER'].includes(status)
  const canAssignMaintainer =
    isCell && assignedToMe && ['IN_PROGRESS', 'ASSIGNED_TO_MAINTAINER', 'MAINTAINER_COMPLETED'].includes(status)
  const canVerify = isCell && assignedToMe && status === 'MAINTAINER_COMPLETED'
  const canMaintainerComplete =
    role === 'MAINTAINER' && complaint.maintainer?.id === user?.id && status === 'ASSIGNED_TO_MAINTAINER'

  if (
    !canComment && !canClose && !canForward && !canWork && !canReject && !canEta &&
    !canAssignMaintainer && !canVerify && !canMaintainerComplete
  )
    return null

  // Facility cells must set an ETA and attach a photo before resolving.
  const resolveBlocker =
    isCell && !complaint.estimatedCompletionAt
      ? 'Set an estimated completion time first.'
      : isCell && !photo
        ? 'Attach a photo of the completed work.'
        : null

  return (
    <Card className="gap-3">
      <Text className="font-semibold text-slate-900">Actions</Text>

      {canMaintainerComplete ? (
        <Button title="Mark as completed" icon="checkmark-circle-outline" onPress={onMaintainerComplete} />
      ) : null}

      {canVerify ? (
        <Button
          title="Verify & resolve"
          icon="shield-checkmark-outline"
          loading={actions.setStatus.isPending}
          onPress={() =>
            Alert.alert('Verify & resolve?', "The maintainer's proof photo becomes the resolution photo.", [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Resolve', onPress: () => run(actions.setStatus, { status: 'RESOLVED' }, 'Complaint resolved') },
            ])
          }
        />
      ) : null}

      {canForward ? (
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

      {canAssignMaintainer ? (
        <View className="gap-2">
          <Text className="font-medium text-slate-800">
            {status === 'MAINTAINER_COMPLETED' ? 'Send back for rework' : 'Assign to maintainer'}
          </Text>
          {complaint.maintainer ? (
            <Text className="text-sm text-slate-600">Current maintainer: {handlerText(complaint.maintainer)}</Text>
          ) : null}
          <SelectField
            label="Maintainer"
            value={maintainerId}
            onChange={setMaintainerId}
            placeholder="Select a maintainer…"
            options={maintainers.map((m) => ({
              label: m.name ? `${m.name} — ${m.loginId}` : m.loginId,
              value: m.id,
            }))}
          />
          {maintainersQ.isSuccess && maintainers.length === 0 ? (
            <Text className="text-xs text-amber-600">
              No active maintainers are set up for your department yet — contact the Admin.
            </Text>
          ) : null}
          <Field
            label="Instructions (optional)"
            placeholder="Anything the maintainer should know"
            value={assignNote}
            onChangeText={setAssignNote}
            multiline
          />
          <Button
            title={status === 'IN_PROGRESS' ? 'Assign' : 'Reassign'}
            icon="construct-outline"
            variant={canVerify ? 'secondary' : 'primary'}
            loading={actions.assignMaintainer.isPending}
            disabled={!maintainerId}
            onPress={() =>
              run(
                actions.assignMaintainer,
                { maintainerId, comment: assignNote.trim() || undefined },
                'Maintainer assigned',
              )
            }
          />
        </View>
      ) : null}

      {canEta ? (
        <View className="gap-2">
          {complaint.estimatedCompletionAt ? (
            <Text className="text-sm text-slate-600">
              Current ETA: {formatDateTime(complaint.estimatedCompletionAt)}
            </Text>
          ) : null}
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

      {canWork && status === 'OPEN' ? (
        <View className="gap-2">
          <Field label="Note (optional)" value={remarks} onChangeText={setRemarks} multiline />
          <Button
            title="Start working"
            icon="play-circle-outline"
            loading={actions.setStatus.isPending}
            onPress={() =>
              run(
                actions.setStatus,
                { status: 'IN_PROGRESS', resolutionRemarks: remarks.trim() || undefined },
                'Marked in progress',
              )
            }
          />
        </View>
      ) : null}

      {canWork && status === 'IN_PROGRESS' ? (
        <View className="gap-2">
          <Field
            label="Resolution remarks"
            placeholder="What was done"
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />
          {isCell ? (
            <>
              {photo ? <Image source={{ uri: photo.uri }} className="w-full h-40 rounded-xl" resizeMode="cover" /> : null}
              <Button
                title={photo ? 'Change photo' : 'Attach photo of completed work'}
                variant="ghost"
                icon="camera-outline"
                onPress={async () => {
                  const p = await pickPhoto('Photo of completed work')
                  if (p) setPhoto(p)
                }}
              />
            </>
          ) : null}
          {resolveBlocker ? <Text className="text-xs text-amber-600">{resolveBlocker}</Text> : null}
          <Button
            title="Mark resolved"
            loading={actions.setStatus.isPending}
            disabled={!!resolveBlocker}
            onPress={() =>
              run(
                actions.setStatus,
                { status: 'RESOLVED', resolutionRemarks: remarks.trim() || undefined, file: photo },
                'Marked resolved',
              )
            }
          />
        </View>
      ) : null}

      {canReject ? (
        <View className="gap-2">
          <Field
            label="Reason for rejection"
            placeholder="Required"
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
          />
          <Button
            title="Reject complaint"
            variant="danger"
            loading={actions.setStatus.isPending}
            disabled={!rejectReason.trim()}
            onPress={() =>
              run(actions.setStatus, { status: 'REJECTED', resolutionRemarks: rejectReason.trim() }, 'Complaint rejected')
            }
          />
        </View>
      ) : null}

      {canClose ? (
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
            disabled={role === 'FACULTY' && !comment.trim()}
            onPress={() => run(actions.close, comment.trim() || undefined, 'Complaint closed')}
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
