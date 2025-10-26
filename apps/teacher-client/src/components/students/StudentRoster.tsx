import { StudentCard } from "./StudentCard";
import { Button } from "@/components/ui/button";
import { useStudents } from "./hooks/useStudents";
import { Loader2, Users, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentRoster() {
  const { students, loading, error, deleting, refetch, remove } = useStudents();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enrolled Students</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold">No Students Enrolled</h3>
          <p className="text-muted-foreground mt-2">
            Get started by enrolling your first student above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Enrolled Students ({students.length})
        </h2>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <div key={student.id} className="relative">
            {deleting === student.id && (
              <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <StudentCard student={student} onDelete={remove} />
          </div>
        ))}
      </div>
    </div>
  );
}
