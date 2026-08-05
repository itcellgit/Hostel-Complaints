import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, PlayCircle, CheckCircle2, XCircle, MessageCircle } from 'lucide-react'
import { complaintsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Textarea } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { StatusBadge } from '../../components/complaints/StatusBadge.jsx'
import { CategoryBadge } from '../../components/complaints/CategoryBadge.jsx'
import { FeeSummaryCard } from '../../components/complaints/FeeSummaryCard.jsx'
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline.jsx'
import { formatDateTime } from '../../lib/format.js'

export default function ComplaintDetailPage({ basePath }) {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState('')
  const [closeComment, setCloseComment] = useState('')
  const [comment, setComment] = useState('')
  const [actionError, setActionError] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.get(id),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    queryClient.invalidateQueries({ queryKey: ['complaints'] })
  }

  const statusMutation = useMutation({
    mutationFn: (payload) => complaintsApi.setStatus(id, payload),
    onSuccess: () => {
      setRemarks('')
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

  const commentMutation = useMutation({
    mutationFn: (comment) => complaintsApi.comment(id, comment),
    onSuccess: () => {
      setComment('')
      setActionError('')
      invalidate()
    },
    onError: (err) => setActionError(err.response?.data?.error ?? 'Could not add comment'),
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message="Could not load this complaint." />

  const { complaint, activities } = data
  const isOwnComplaint = user.role === 'STUDENT' && complaint.student.id === user.studentId
  const canComment = user.role === 'DEAN_INFRA' || user.role === 'FACULTY' || isOwnComplaint
  const canClose = complaint.status === 'RESOLVED' && (isOwnComplaint || user.role === 'FACULTY')

  return (
    <div className="space-y-4">
      <Link to={basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to complaints
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{complaint.complaintNo}</h1>
        <CategoryBadge category={complaint.category} />
        <StatusBadge status={complaint.status} />
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
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Complainer</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                  {complaint.complainerName} · {complaint.complainerPhone} · {complaint.complainerRelation}
                </dd>
              </div>
              {complaint.resolutionRemarks && (
                <div className="col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Resolution remarks</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-100">{complaint.resolutionRemarks}</dd>
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

          <ComplaintTimeline activities={activities} />
        </div>

        <div className="space-y-4">
          <FeeSummaryCard feeSummary={complaint.feeSummary} />

          {user.role === 'DEAN_INFRA' && ['OPEN', 'IN_PROGRESS'].includes(complaint.status) && (
            <Card title="Act on this complaint" icon={PlayCircle}>
              <div className="space-y-3">
                <Textarea
                  placeholder="Remarks (shown to the student)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <ErrorBanner message={actionError} />
                <div className="flex flex-wrap gap-2">
                  {complaint.status === 'OPEN' && (
                    <Button
                      variant="secondary"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ status: 'IN_PROGRESS', resolutionRemarks: remarks || undefined })}
                    >
                      <PlayCircle className="h-4 w-4" strokeWidth={2.25} />
                      Start working
                    </Button>
                  )}
                  {complaint.status === 'IN_PROGRESS' && (
                    <Button
                      variant="success"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ status: 'RESOLVED', resolutionRemarks: remarks || undefined })}
                    >
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                      Mark resolved
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    disabled={statusMutation.isPending || complaint.status === 'IN_PROGRESS'}
                    title={complaint.status === 'IN_PROGRESS' ? 'Work has already started — this complaint can no longer be rejected' : undefined}
                    onClick={() => statusMutation.mutate({ status: 'REJECTED', resolutionRemarks: remarks || undefined })}
                  >
                    <XCircle className="h-4 w-4" strokeWidth={2.25} />
                    Reject
                  </Button>
                </div>
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

          {canComment && (
            <Card title="Add a comment" icon={MessageCircle}>
              <div className="space-y-3">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a note…" />
                <Button
                  variant="secondary"
                  disabled={commentMutation.isPending || !comment.trim()}
                  onClick={() => commentMutation.mutate(comment)}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
                  Add comment
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
