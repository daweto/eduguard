import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types/student';
import { User, Phone, Mail, GraduationCap, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface StudentCardProps {
  student: Student;
  onDelete?: (id: string) => void;
}

export function StudentCard({ student, onDelete }: StudentCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = student.photo_urls || [];

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Photo section */}
        {photos.length > 0 ? (
          <div className="relative h-48 bg-muted">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <User className="w-20 h-20 text-muted-foreground/30" />
              {/* In production, display actual photo:
              <img
                src={photos[currentPhotoIndex]}
                alt={student.name}
                className="w-full h-full object-cover"
              />
              */}
            </div>

            {/* Photo navigation (if multiple photos) */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  ‹
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-48 bg-muted flex items-center justify-center">
            <User className="w-20 h-20 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Student name */}
        <div>
          <h3 className="text-xl font-semibold truncate">{student.name}</h3>
          {student.grade && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <GraduationCap className="w-4 h-4" />
              <span>Grade {student.grade}</span>
            </div>
          )}
        </div>

        {/* Guardian info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Guardian</p>
              <p className="font-medium">{student.guardian_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Phone</p>
              <p className="font-medium">{student.guardian_phone}</p>
            </div>
          </div>

          {student.guardian_email && (
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium truncate">{student.guardian_email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-3 border-t text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</span>
            <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
          </div>
          {student.face_ids && student.face_ids.length > 0 && (
            <div className="mt-1">
              {student.face_ids.length} face{student.face_ids.length > 1 ? 's' : ''} indexed
            </div>
          )}
        </div>

        {/* Delete button (optional) */}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-2"
            onClick={() => onDelete(student.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Student
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
