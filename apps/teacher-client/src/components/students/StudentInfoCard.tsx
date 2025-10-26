import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { User, Phone, Mail, IdCard, GraduationCap } from "lucide-react";
import type { Student } from "@/types/student";
import { formatRut } from "@/lib/helpers/rut";

interface StudentInfoCardProps {
  student: Student;
  className?: string;
}

export function StudentInfoCard({ student, className }: StudentInfoCardProps) {
  const studentFullName = [
    student.firstName,
    student.middleName?.trim() ? student.middleName : null,
    student.lastName,
    student.secondLastName?.trim() ? student.secondLastName : null,
  ]
    .filter(Boolean)
    .join(" ");

  const guardianSource = student.guardian ?? null;
  const guardianFullName = guardianSource
    ? [
        guardianSource.firstName,
        guardianSource.middleName?.trim() ? guardianSource.middleName : null,
        guardianSource.lastName,
        guardianSource.secondLastName?.trim()
          ? guardianSource.secondLastName
          : null,
      ]
        .filter(Boolean)
        .join(" ")
    : student.guardianName;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Photo Section */}
          <div>
            {student.photo_urls && student.photo_urls.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {student.photo_urls.map((photoUrl, index) => (
                    <CarouselItem key={index}>
                      <AspectRatio
                        ratio={3 / 4}
                        className="rounded-lg overflow-hidden"
                      >
                        <img
                          src={photoUrl}
                          alt={`${studentFullName} - Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </AspectRatio>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {student.photo_urls.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            ) : (
              <AspectRatio
                ratio={3 / 4}
                className="rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
              >
                <User className="w-20 h-20 text-muted-foreground/30" />
              </AspectRatio>
            )}
          </div>

          {/* Student Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{studentFullName}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <IdCard className="w-4 h-4" />
                  <span>{formatRut(student.identificationNumber)}</span>
                </div>
                {(student.gradeDisplayName || student.gradeId) && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>{student.gradeDisplayName ?? student.gradeId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Información del Apoderado
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{guardianFullName}</p>
                    </div>
                  </div>

                  {guardianSource && (
                    <div className="flex items-start gap-2">
                      <IdCard className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">RUT</p>
                        <p className="font-medium">
                          {formatRut(guardianSource.identificationNumber)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Contacto
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">
                        {guardianSource?.phone ?? student.guardianPhone}
                      </p>
                    </div>
                  </div>

                  {(guardianSource?.email ?? student.guardianEmail) && (
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm">
                          {guardianSource?.email ?? student.guardianEmail}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>
                  Fecha de matrícula:{" "}
                  {new Date(student.enrollmentDate).toLocaleDateString()}
                </span>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  {student.status === "active" ? "Activo" : student.status}
                </Badge>
              </div>
              {student.face_ids && student.face_ids.length > 0 && (
                <div className="mt-1">
                  {student.face_ids.length}{" "}
                  {student.face_ids.length === 1
                    ? "foto indexada"
                    : "fotos indexadas"}{" "}
                  en el sistema
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
