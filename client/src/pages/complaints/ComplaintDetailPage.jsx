import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, PlayCircle, CheckCircle2, XCircle, MessageCircle, Send, Clock, Upload, Wrench, ShieldCheck } from 'lucide-react'
import { complaintsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Textarea, FormField, Select, Input } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { StatusBadge } from '../../components/complaints/StatusBadge.jsx'
import { CategoryBadge } from '../../components/complaints/CategoryBadge.jsx'
import { FeeSummaryCard } from '../../components/complaints/FeeSummaryCard.jsx'
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline.jsx'
import { UrgencyBadge } from '../../components/complaints/UrgencyBadge.jsx'
import { HandlerInfo } from '../../components/complaints/HandlerInfo.jsx'
import { MaintainerCompleteModal } from '../../components/complaints/MaintainerCompleteModal.jsx'
import { currentHandler } from '../../lib/complaint.js'
import { formatDateTime, formatDuration } from '../../lib/format.js'
import { CELL_ROLES, ROLE_LABEL } from '../../lib/roles.js'

export default function ComplaintDetailPage({ basePath }) {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [openModal, setOpenModal] = useState(null) // 'work' | 'reject' | 'comment' | null
  const [remarks, setRemarks] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [forwardRole, setForwardRole] = useState('')
  const [forwardComment, setForwardComment] = useState('')
  const [resolutionImage, setResolutionImage] = useState(null)
  const [etaValue, setEtaValue] = useState('')
  const [etaComment, setEtaComment] = useState('')
  const [closeComment, setCloseComment] = useState('')
  const [comment, setComment] = useState('')
  const [actionError, setActionError] = useState('')
  const [maintainerId, setMaintainerId] = useState('')
  const [assignComment, setAssignComment] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.get(id),
  })

  // Only a facility cell assigns work, and only to its own department's maintainers.
  const { data: maintainers = [] } = useQuery({
    queryKey: ['maintainers'],
    queryFn: complaintsApi.maintainers,
    enabled: CELL_ROLES.includes(user.role),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    queryClient.invalidateQueries({ queryKey: ['complaints'] })
  }

  const statusMutation = useMutation({
    mutationFn: ({ status, resolutionRemarks, file }) => complaintsApi.setStatus(id, { status, resolutionRemarks }, file),
    onSuccess: () => {
      setRemarks('')
      setRejectComment('')
      setResolutionImage(null)
      setActionError('')
      setOpenModal(null)
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Action failed'),
  })

  const forwardMutation = useMutation({
    mutationFn: ({ role, comment: note }) => complaintsApi.forward(id, { role, comment: note || undefined }),
    onSuccess: () => {
      setForwardRole('')
      setForwardComment('')
      setActionError('')
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Action failed'),
  })

  const etaMutation = useMutation({
    mutationFn: (payload) => complaintsApi.setEta(id, payload),
    onSuccess: () => {
      setEtaValue('')
      setEtaComment('')
      setActionError('')
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Action failed'),
  })

  const closeMutation = useMutation({
    mutationFn: (comment) => complaintsApi.close(id, comment),
    onSuccess: () => {
      setCloseComment('')
      setActionError('')
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Action failed'),
  })

  const assignMutation = useMutation({
    mutationFn: () => complaintsApi.assignMaintainer(id, { maintainerId, comment: assignComment || undefined }),
    onSuccess: () => {
      setMaintainerId('')
      setAssignComment('')
      setActionError('')
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Could not assign maintainer'),
  })

  const commentMutation = useMutation({
    mutationFn: (comment) => complaintsApi.comment(id, comment),
    onSuccess: () => {
      setComment('')
      setActionError('')
      setOpenModal(null)
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Could not add comment'),
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message="Could not load this complaint." />

  const { complaint, activities } = data
  const isOwnComplaint = user.role === 'STUDENT' && complaint.student?.id === user.studentId
  const isCellRole = CELL_ROLES.includes(user.role)
  const isAssignee = complaint.assignedTo?.id === user.id
  const canComment = user.role === 'DEAN_INFRA' || user.role === 'FACULTY' || user.role === 'RECTOR' || user.role === 'MAINTAINER' || isCellRole || isOwnComplaint
  const canClose = complaint.status === 'RESOLVED' && (isOwnComplaint || user.role === 'FACULTY')

  const canAssignMaintainer =
    isCellRole && isAssignee && ['IN_PROGRESS', 'ASSIGNED_TO_MAINTAINER', 'MAINTAINER_COMPLETED'].includes(complaint.status)
  const canVerify = isCellRole && isAssignee && complaint.status === 'MAINTAINER_COMPLETED'
  const canMaintainerComplete = user.role === 'MAINTAINER' && complaint.maintainer?.id === user.id && complaint.status === 'ASSIGNED_TO_MAINTAINER'
  const handler = currentHandler(complaint)

  const canForward = isAssignee && user.role === 'DEAN_INFRA' && complaint.status === 'OPEN'
  const canWork = isAssignee && (user.role === 'FACULTY' || isCellRole) && ['OPEN', 'IN_PROGRESS'].includes(complaint.status)
  // Once a facility cell has committed to an estimated completion time,
  // they've effectively accepted the job and can no longer back out.
  const rejectLockedByAcceptance = isCellRole && !!complaint.estimatedCompletionAt
  const canReject = isAssignee && ['OPEN', 'IN_PROGRESS'].includes(complaint.status)

  function closeModal() {
    setOpenModal(null)
    setActionError('')
  }

  return (
    <div className="space-y-4">
      <Link to={basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to complaints
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{complaint.complaintNo}</h1>
        <CategoryBadge category={complaint.category} />
        <StatusBadge status={complaint.status} assigneeRole={complaint.assignedTo?.role} />
        <UrgencyBadge status={complaint.status} since={complaint.statusChangedAt} />
        <span className="text-xs text-slate-400">Filed {formatDateTime(complaint.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Details" icon={FileText}>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <dt className="text-slate-500 dark:text-slate-400">Description</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{complaint.description}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Hostel</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{complaint.hostel.name}</dd>
              </div>
              {complaint.student ? (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Student</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                    {complaint.student.firstName} {complaint.student.lastName} ({complaint.student.usn}) — Room{' '}
                    {complaint.student.roomNo ?? '—'}
                    {!complaint.student.isActive && (
                      <span className="ml-1 text-xs text-red-600">(no longer a resident)</span>
                    )}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Room</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{complaint.roomNo ?? 'Common area'}</dd>
                </div>
              )}
              {complaint.student ? (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Complainer</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                    {complaint.complainerName} · {complaint.complainerPhone} · {complaint.complainerRelation}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Reported by</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                    {complaint.complainerName} · {complaint.complainerPhone}
                  </dd>
                </div>
              )}
              {handler && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Currently with</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                    <HandlerInfo handler={handler} />
                  </dd>
                </div>
              )}
              {complaint.estimatedCompletionAt && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Estimated completion</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{formatDateTime(complaint.estimatedCompletionAt)}</dd>
                </div>
              )}
              {complaint.resolvedAt && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Completed on</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{formatDateTime(complaint.resolvedAt)}</dd>
                </div>
              )}
              {complaint.resolvedAt && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Resolution time</dt>
                  <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
                    {formatDuration(new Date(complaint.resolvedAt) - new Date(complaint.createdAt))}
                  </dd>
                </div>
              )}
              {complaint.attachmentPath && (
                <div className="col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Attached photo</dt>
                  <dd className="mt-1">
                    <a href={complaint.attachmentPath} target="_blank" rel="noreferrer">
                      <img
                        src={complaint.attachmentPath}
                        alt="Complaint attachment"
                        className="h-40 w-auto rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </a>
                  </dd>
                </div>
              )}
              {complaint.resolutionRemarks && (
                <div className="col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Resolution remarks</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{complaint.resolutionRemarks}</dd>
                </div>
              )}
              {complaint.resolutionImagePath && (
                <div className="col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Photo of completed work</dt>
                  <dd className="mt-1">
                    <a href={complaint.resolutionImagePath} target="_blank" rel="noreferrer">
                      <img
                        src={complaint.resolutionImagePath}
                        alt="Completed work"
                        className="h-40 w-auto rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </a>
                  </dd>
                </div>
              )}
              {complaint.maintainerProofPath && (
                <div className="col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Maintainer's proof of completion</dt>
                  <dd className="mt-1">
                    <a href={complaint.maintainerProofPath} target="_blank" rel="noreferrer">
                      <img
                        src={complaint.maintainerProofPath}
                        alt="Maintainer proof of work"
                        className="h-40 w-auto rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </a>
                  </dd>
                </div>
              )}
              {complaint.closingComment && (
                <div className="col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Closing comment</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                    “{complaint.closingComment}” — {complaint.closedByUser?.role}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {(canWork || canReject || canComment || canVerify || canMaintainerComplete) && (
            <div className="flex flex-wrap gap-2">
              {canMaintainerComplete && (
                <Button variant="success" onClick={() => setOpenModal('maintainerComplete')}>
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                  Mark as completed
                </Button>
              )}
              {canVerify && (
                <Button variant="success" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ status: 'RESOLVED' })}>
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
                  Verify & resolve
                </Button>
              )}
              {canWork && (
                <Button variant="secondary" onClick={() => setOpenModal('work')}>
                  {complaint.status === 'OPEN' ? (
                    <>
                      <PlayCircle className="h-4 w-4" strokeWidth={2.25} />
                      Start working
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                      Mark resolved
                    </>
                  )}
                </Button>
              )}
              {canReject && (
                <Button
                  variant="danger"
                  disabled={rejectLockedByAcceptance}
                  title={rejectLockedByAcceptance ? 'This complaint can no longer be rejected once you have committed to an estimated completion time' : undefined}
                  onClick={() => setOpenModal('reject')}
                >
                  <XCircle className="h-4 w-4" strokeWidth={2.25} />
                  Reject
                </Button>
              )}
              {canComment && (
                <Button variant="secondary" onClick={() => setOpenModal('comment')}>
                  <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
                  Add comment
                </Button>
              )}
            </div>
          )}

          <ComplaintTimeline activities={activities} />
        </div>

        <div className="space-y-4">
          <FeeSummaryCard feeSummary={complaint.feeSummary} />

          {canForward && (
            <Card title="Forward this complaint" icon={Send}>
              <div className="space-y-3">
                <FormField label="Department">
                  <Select value={forwardRole} onChange={(e) => setForwardRole(e.target.value)}>
                    <option value="">Select a department…</option>
                    {CELL_ROLES.map((role) => (
                      <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                    ))}
                  </Select>
                </FormField>
                <Textarea
                  placeholder="Note for the department (optional)"
                  value={forwardComment}
                  onChange={(e) => setForwardComment(e.target.value)}
                />
                <ErrorBanner message={actionError} />
                <Button
                  disabled={forwardMutation.isPending || !forwardRole}
                  onClick={() => forwardMutation.mutate({ role: forwardRole, comment: forwardComment })}
                >
                  <Send className="h-4 w-4" strokeWidth={2.25} />
                  Forward
                </Button>
              </div>
            </Card>
          )}

          {canAssignMaintainer && (
            <Card title={complaint.status === 'MAINTAINER_COMPLETED' ? 'Send back for rework' : 'Assign to maintainer'} icon={Wrench}>
              <div className="space-y-3">
                {complaint.maintainer && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Current maintainer: <HandlerInfo handler={complaint.maintainer} />
                  </p>
                )}
                <FormField label="Maintainer">
                  <Select value={maintainerId} onChange={(e) => setMaintainerId(e.target.value)}>
                    <option value="">Select a maintainer…</option>
                    {maintainers.map((m) => (
                      <option key={m.id} value={m.id}>{m.loginId}</option>
                    ))}
                  </Select>
                </FormField>
                {maintainers.length === 0 && (
                  <p className="text-xs text-amber-600">No active maintainers are set up for your department yet — contact the Admin.</p>
                )}
                <Textarea
                  placeholder="Instructions for the maintainer (optional)"
                  value={assignComment}
                  onChange={(e) => setAssignComment(e.target.value)}
                />
                <ErrorBanner message={actionError} />
                <Button disabled={assignMutation.isPending || !maintainerId} onClick={() => assignMutation.mutate()}>
                  <Wrench className="h-4 w-4" strokeWidth={2.25} />
                  {complaint.status === 'IN_PROGRESS' ? 'Assign' : 'Reassign'}
                </Button>
              </div>
            </Card>
          )}

          {isCellRole && isAssignee && ['IN_PROGRESS', 'ASSIGNED_TO_MAINTAINER'].includes(complaint.status) && (
            <Card title="Estimated completion" icon={Clock}>
              <div className="space-y-3">
                {complaint.estimatedCompletionAt && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Currently promised:{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {formatDateTime(complaint.estimatedCompletionAt)}
                    </span>
                  </p>
                )}
                <FormField label={complaint.estimatedCompletionAt ? 'Update estimate' : 'By when will this be resolved?'}>
                  <Input type="datetime-local" value={etaValue} onChange={(e) => setEtaValue(e.target.value)} />
                </FormField>
                <Textarea
                  placeholder="Note (optional, e.g. reason for the change)"
                  value={etaComment}
                  onChange={(e) => setEtaComment(e.target.value)}
                />
                <ErrorBanner message={actionError} />
                <Button
                  variant="secondary"
                  disabled={etaMutation.isPending || !etaValue}
                  onClick={() =>
                    etaMutation.mutate({ estimatedCompletionAt: new Date(etaValue).toISOString(), comment: etaComment || undefined })
                  }
                >
                  <Clock className="h-4 w-4" strokeWidth={2.25} />
                  {complaint.estimatedCompletionAt ? 'Update estimate' : 'Set estimate'}
                </Button>
              </div>
            </Card>
          )}

          {canClose && (
            <Card title="Close complaint" icon={CheckCircle2}>
              <div className="space-y-3">
                <Textarea
                  placeholder={user.role === 'FACULTY' ? 'Comment (required)' : 'Feedback (optional)'}
                  value={closeComment}
                  onChange={(e) => setCloseComment(e.target.value)}
                />
                <ErrorBanner message={actionError} />
                <Button
                  variant="success"
                  disabled={closeMutation.isPending || (user.role === 'FACULTY' && !closeComment.trim())}
                  onClick={() => closeMutation.mutate(closeComment || undefined)}
                >
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                  Confirm resolved & close
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {openModal === 'maintainerComplete' && <MaintainerCompleteModal complaint={complaint} onClose={closeModal} />}

      {openModal === 'work' && (
        <Modal
          title={complaint.status === 'OPEN' ? 'Start working on this complaint' : 'Mark this complaint resolved'}
          onClose={closeModal}
          footer={
            complaint.status === 'OPEN' ? (
              <Button
                variant="secondary"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: 'IN_PROGRESS', resolutionRemarks: remarks || undefined })}
              >
                <PlayCircle className="h-4 w-4" strokeWidth={2.25} />
                Start working
              </Button>
            ) : (
              <Button
                variant="success"
                disabled={statusMutation.isPending || (isCellRole && (!complaint.estimatedCompletionAt || !resolutionImage))}
                title={
                  isCellRole && !complaint.estimatedCompletionAt
                    ? 'Set an estimated completion time first'
                    : isCellRole && !resolutionImage
                      ? 'Attach a photo of the completed work first'
                      : undefined
                }
                onClick={() =>
                  statusMutation.mutate({ status: 'RESOLVED', resolutionRemarks: remarks || undefined, file: resolutionImage })
                }
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                Mark resolved
              </Button>
            )
          }
        >
          <div className="space-y-3">
            <Textarea
              placeholder="Remarks (shown to the student)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              autoFocus
            />
            {complaint.status === 'IN_PROGRESS' && isCellRole && (
              <FormField label="Photo of completed work">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setResolutionImage(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <div className="flex items-center gap-2.5">
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" strokeWidth={2.25} />
                    {resolutionImage ? 'Change photo' : 'Attach photo'}
                  </Button>
                  {resolutionImage && (
                    <span className="truncate text-xs text-slate-600 dark:text-slate-300">{resolutionImage.name}</span>
                  )}
                </div>
              </FormField>
            )}
            <ErrorBanner message={actionError} />
          </div>
        </Modal>
      )}

      {openModal === 'reject' && (
        <Modal
          title="Reject this complaint"
          onClose={closeModal}
          footer={
            <Button
              variant="danger"
              disabled={statusMutation.isPending || !rejectComment.trim()}
              onClick={() => statusMutation.mutate({ status: 'REJECTED', resolutionRemarks: rejectComment })}
            >
              <XCircle className="h-4 w-4" strokeWidth={2.25} />
              Reject
            </Button>
          }
        >
          <div className="space-y-3">
            <Textarea
              placeholder="Justification for rejecting (required)"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              autoFocus
            />
            <ErrorBanner message={actionError} />
          </div>
        </Modal>
      )}

      {openModal === 'comment' && (
        <Modal
          title="Add a comment"
          onClose={closeModal}
          footer={
            <Button
              variant="secondary"
              disabled={commentMutation.isPending || !comment.trim()}
              onClick={() => commentMutation.mutate(comment)}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
              Add comment
            </Button>
          }
        >
          <div className="space-y-3">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a note…" autoFocus />
            <ErrorBanner message={actionError} />
          </div>
        </Modal>
      )}
    </div>
  )
}
