import { EnrollmentForm } from "@/components/EnrollmentForm"
import { UserPlus } from "lucide-react"

export default function Enroll() {
  const handleEnrollmentSuccess = () => {
    // no-op for now; roster page can refetch on mount
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Student Enrollment
        </h2>
        <p className="text-muted-foreground">
          Enroll new students by uploading 1-3 portrait photos for facial recognition. The system will automatically index their faces for future attendance tracking.
        </p>
      </div>
      <div className="max-w-4xl">
        <EnrollmentForm onSuccess={handleEnrollmentSuccess} />
      </div>
    </div>
  )
}


