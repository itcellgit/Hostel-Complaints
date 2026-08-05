import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { StudentDetailView } from '../../components/students/StudentDetailView.jsx'

export default function PrincipalStudentDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <Link to="/principal/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to students
      </Link>
      <StudentDetailView studentId={id} canManage={false} />
    </div>
  )
}
