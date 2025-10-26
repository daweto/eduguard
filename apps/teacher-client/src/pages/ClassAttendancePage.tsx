import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  Trash2,
  Upload,
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useClassStudents } from "@/components/classes/hooks/useClassStudents";
import { toast } from "sonner";
import { RiskBadge } from "@/components/attendance/RiskBadge";
import { CallParentButton } from "@/components/attendance/CallParentButton";
import { useTeacherContext } from "@/contexts/teacher-context";

// Confidence thresholds for attendance categorization
const CONFIDENCE_THRESHOLDS = {
  HIGH: 95, // Confirmed present
  MEDIUM: 80, // Likely present
  // Below MEDIUM = Needs review
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";
const DEBUG_ENABLED = import.meta.env.VITE_ENABLE_ATTENDANCE_DEBUG === "true";

type PhotoData = {
  blob: Blob;
  preview: string;
};

interface BoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

interface DetectedFace {
  boundingBox: BoundingBox;
  confidence: number;
  matchedStudent?: {
    id: string;
    name: string;
    similarity: number;
  };
  faceId?: string;
  topMatches?: Array<{
    studentName: string;
    similarity: number;
    belowThreshold: boolean;
  }>;
  noMatchReason?: string;
}

interface PhotoDebugInfo {
  photoIndex: number;
  totalFacesInPhoto: number;
  faces: DetectedFace[];
}

interface AttendanceResult {
  session_id: string;
  class_id: string;
  timestamp: string;
  photos_processed: number;
  photo_urls: string[];
  expected_students: number;
  present_count: number;
  absent_count: number;
  present_students: Array<{
    student_id: string;
    name: string;
    confidence: number;
    face_id: string;
    identification: string;
  }>;
  absent_students: Array<{
    student_id: string;
    name: string;
    identification: string;
    guardian_id?: string;
    guardian_name?: string;
    guardian_phone?: string;
    risk_level?: string;
  }>;
  total_faces_detected: number;
  debug_info?: PhotoDebugInfo[];
}

export function ClassAttendancePage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { activeTeacherId } = useTeacherContext();
  const { classData, isLoading } = useClassStudents(classId);

  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [submittedPhotos, setSubmittedPhotos] = useState<PhotoData[]>([]); // Keep photos for debug view
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attendanceResult, setAttendanceResult] =
    useState<AttendanceResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = 10 - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    // Convert Files to PhotoData objects with preview URLs
    const newPhotos: PhotoData[] = [];
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newPhotos.push({ blob: file, preview });
      }
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      // Revoke object URL to free memory
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmitAttendance = async () => {
    if (photos.length === 0) {
      toast.error("Por favor, captura al menos una foto");
      return;
    }

    if (!classId) {
      toast.error("ID de clase no válido");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Step 1: Request presigned URLs
      setUploadProgress(10);
      const presignResp = await fetch(`${API_BASE_URL}/api/uploads/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose: "attendance_photo",
          count: photos.length,
          content_type: photos[0].blob.type || "image/jpeg",
        }),
      });

      if (!presignResp.ok) {
        const error = await presignResp.json();
        throw new Error(error.error || "Failed to get upload URLs");
      }

      const presignData = (await presignResp.json()) as {
        bucket: string;
        uploads: Array<{
          key: string;
          upload_url: string;
          content_type: string;
        }>;
      };

      // Step 2: Upload photos to R2
      setUploadProgress(30);
      const uploadPromises = presignData.uploads.map(async (upload, i) => {
        const response = await fetch(upload.upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": upload.content_type,
          },
          body: photos[i].blob,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for photo ${i + 1}`);
        }
      });

      await Promise.all(uploadPromises);

      // Step 3: Create attendance session
      setUploadProgress(70);
      const sessionResp = await fetch(
        `${API_BASE_URL}/api/attendance/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            class_id: classId,
            teacher_id: activeTeacherId,
            photo_keys: presignData.uploads.map((u) => u.key),
            timestamp: new Date().toISOString(),
          }),
        },
      );

      if (!sessionResp.ok) {
        const error = await sessionResp.json();
        throw new Error(
          error.error || `HTTP error! status: ${sessionResp.status}`,
        );
      }

      const result = await sessionResp.json();
      setUploadProgress(100);
      setAttendanceResult(result);

      // Keep photos for debug visualization
      setSubmittedPhotos([...photos]);
      setPhotos([]); // Clear upload queue

      toast.success(
        `Asistencia registrada: ${result.present_count} presentes, ${result.absent_count} ausentes`,
      );
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al registrar la asistencia",
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
            <CardDescription className="text-red-700">
              No se pudo cargar la información de la clase.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/classes")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Clases
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {classData.class.course.name} - Sección {classData.class.section}
            </h1>
            <p className="text-muted-foreground">
              {classData.class.classroom.name} · Período{" "}
              {classData.class.period} · {classData.total} estudiantes
            </p>
          </div>
          {DEBUG_ENABLED && (
            <div className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-xs font-medium text-amber-900">
              🐛 Modo Debug Activo
            </div>
          )}
        </div>
      </div>

      {attendanceResult ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultado de Asistencia</CardTitle>
              <CardDescription>
                Sesión registrada el{" "}
                {new Date(attendanceResult.timestamp).toLocaleString("es-CL")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Categorize students by confidence
                const confirmed = attendanceResult.present_students.filter(
                  (s) => s.confidence >= CONFIDENCE_THRESHOLDS.HIGH,
                );
                const likely = attendanceResult.present_students.filter(
                  (s) =>
                    s.confidence >= CONFIDENCE_THRESHOLDS.MEDIUM &&
                    s.confidence < CONFIDENCE_THRESHOLDS.HIGH,
                );
                const needsReview = attendanceResult.present_students.filter(
                  (s) => s.confidence < CONFIDENCE_THRESHOLDS.MEDIUM,
                );

                return (
                  <>
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <div className="text-2xl font-bold">
                              {attendanceResult.expected_students}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Esperados
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <div className="text-2xl font-bold text-green-700">
                              {confirmed.length}
                            </div>
                            <div className="text-sm text-green-700">
                              Confirmados
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              ≥95% confianza
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-amber-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                            <div className="text-2xl font-bold text-amber-700">
                              {likely.length + needsReview.length}
                            </div>
                            <div className="text-sm text-amber-700">
                              Por Revisar
                            </div>
                            <div className="text-xs text-amber-600 mt-1">
                              &lt;95% confianza
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                            <div className="text-2xl font-bold text-red-700">
                              {attendanceResult.absent_count}
                            </div>
                            <div className="text-sm text-red-700">Ausentes</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Confirmed Present */}
                      {confirmed.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Confirmados Presentes ({confirmed.length})
                          </h3>
                          <div className="space-y-2">
                            {confirmed.map((student) => (
                              <div
                                key={student.student_id}
                                className="p-3 bg-green-50 rounded-lg border border-green-200"
                              >
                                <div className="font-medium">
                                  {student.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  RUT: {student.identification}
                                </div>
                                <div className="text-xs text-green-700 mt-1">
                                  ✓ {student.confidence.toFixed(1)}% confianza
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Likely Present */}
                      {likely.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-amber-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Probablemente Presentes ({likely.length})
                          </h3>
                          <div className="space-y-2">
                            {likely.map((student) => (
                              <div
                                key={student.student_id}
                                className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                              >
                                <div className="font-medium">
                                  {student.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  RUT: {student.identification}
                                </div>
                                <div className="text-xs text-amber-700 mt-1">
                                  ⚠ {student.confidence.toFixed(1)}% confianza
                                  - Revisar
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Needs Review */}
                      {needsReview.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-orange-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Requiere Revisión ({needsReview.length})
                          </h3>
                          <div className="space-y-2">
                            {needsReview.map((student) => (
                              <div
                                key={student.student_id}
                                className="p-3 bg-orange-50 rounded-lg border border-orange-300"
                              >
                                <div className="font-medium">
                                  {student.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  RUT: {student.identification}
                                </div>
                                <div className="text-xs text-orange-700 mt-1 font-medium">
                                  ⚠ {student.confidence.toFixed(1)}% confianza
                                  - Verificar manualmente
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Absent */}
                      <div>
                        <h3 className="font-semibold mb-3 text-red-700 flex items-center gap-2">
                          <XCircle className="h-5 w-5" />
                          Ausentes ({attendanceResult.absent_count})
                        </h3>
                        <div className="space-y-2">
                          {attendanceResult.absent_students.map((student) => (
                            <div
                              key={student.student_id}
                              className="p-3 bg-red-50 rounded-lg border border-red-200"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="font-medium">
                                  {student.name}
                                </div>
                                {student.risk_level && (
                                  <RiskBadge
                                    riskLevel={
                                      student.risk_level as
                                        | "none"
                                        | "low"
                                        | "medium"
                                        | "high"
                                    }
                                  />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                RUT: {student.identification}
                              </div>
                              {student.guardian_name &&
                                student.guardian_phone && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Apoderado: {student.guardian_name} -{" "}
                                    {student.guardian_phone}
                                  </div>
                                )}
                              <div className="text-xs text-red-600 mt-1 mb-2">
                                No detectado
                              </div>
                              <CallParentButton
                                studentId={student.student_id}
                                studentName={student.name}
                                guardianPhone={student.guardian_phone}
                                guardianName={student.guardian_name}
                                guardianId={student.guardian_id}
                                sessionId={attendanceResult.session_id}
                                riskLevel={student.risk_level}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => {
                    // Clean up submitted photos
                    submittedPhotos.forEach((photo) =>
                      URL.revokeObjectURL(photo.preview),
                    );
                    setSubmittedPhotos([]);
                    setAttendanceResult(null);
                    setPhotos([]);
                  }}
                  variant="outline"
                  className="mr-3"
                >
                  Tomar Nueva Asistencia
                </Button>
                <Button onClick={() => navigate("/classes")}>
                  Volver a Mis Clases
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Information - Face Detection Visualization (only in debug mode) */}
          {DEBUG_ENABLED &&
            attendanceResult.debug_info &&
            attendanceResult.debug_info.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Información de Depuración - Detección de Rostros
                  </CardTitle>
                  <CardDescription>
                    Visualización de los rostros detectados y sus coincidencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Debug Summary */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Resumen de Detección
                    </h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">
                          Total de rostros detectados:
                        </span>
                        <span className="font-medium text-blue-900">
                          {attendanceResult.total_faces_detected}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">
                          Estudiantes identificados:
                        </span>
                        <span className="font-medium text-blue-900">
                          {attendanceResult.present_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">
                          Rostros sin identificar:
                        </span>
                        <span className="font-medium text-blue-900">
                          {attendanceResult.total_faces_detected -
                            attendanceResult.present_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">
                          Umbral de confianza:
                        </span>
                        <span className="font-medium text-blue-900">≥95%</span>
                      </div>
                    </div>
                    {attendanceResult.total_faces_detected >
                      attendanceResult.present_count && (
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <p className="text-xs text-blue-800">
                          <strong>
                            💡 Posibles razones por las que algunos rostros no
                            se identificaron:
                          </strong>
                        </p>
                        <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc space-y-1">
                          <li>
                            El estudiante no tiene fotos registradas en el
                            sistema
                          </li>
                          <li>
                            La similitud está por debajo del umbral del 95%
                          </li>
                          <li>
                            La foto es de baja calidad o el rostro está
                            parcialmente oculto
                          </li>
                          <li>
                            El ángulo o iluminación es muy diferente a las fotos
                            registradas
                          </li>
                          <li>El estudiante no está inscrito en esta clase</li>
                        </ul>
                        <div className="mt-2 p-2 bg-blue-100 rounded text-blue-900 text-xs">
                          <strong>
                            ✨ Ahora analizando todos los rostros:
                          </strong>{" "}
                          El sistema analiza cada rostro detectado
                          individualmente para identificar a todos los
                          estudiantes en la foto.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {attendanceResult.debug_info.map((photoInfo) => (
                      <div
                        key={photoInfo.photoIndex}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">
                            Foto #{photoInfo.photoIndex + 1}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {photoInfo.totalFacesInPhoto} rostro(s) detectado(s)
                          </span>
                        </div>

                        {/* Photo with bounding boxes */}
                        {submittedPhotos[photoInfo.photoIndex] && (
                          <div className="relative inline-block max-w-full">
                            <img
                              src={
                                submittedPhotos[photoInfo.photoIndex].preview
                              }
                              alt={`Foto ${photoInfo.photoIndex + 1}`}
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: "500px" }}
                              onLoad={(e) => {
                                // Draw bounding boxes on canvas overlay
                                const img = e.currentTarget;
                                const container = img.parentElement;
                                if (!container) return;

                                // Remove existing canvas
                                const existingCanvas =
                                  container.querySelector("canvas");
                                if (existingCanvas) existingCanvas.remove();

                                // Create canvas overlay
                                const canvas = document.createElement("canvas");
                                canvas.width = img.width;
                                canvas.height = img.height;
                                canvas.style.position = "absolute";
                                canvas.style.top = "0";
                                canvas.style.left = "0";
                                canvas.style.pointerEvents = "none";
                                container.appendChild(canvas);

                                const ctx = canvas.getContext("2d");
                                if (!ctx) return;

                                // Draw each bounding box
                                photoInfo.faces.forEach((face) => {
                                  const box = face.boundingBox;
                                  const x = box.Left * img.width;
                                  const y = box.Top * img.height;
                                  const w = box.Width * img.width;
                                  const h = box.Height * img.height;

                                  // Choose color based on match status
                                  if (face.matchedStudent) {
                                    // Bright green for matched - make it very visible!
                                    ctx.strokeStyle = "#16a34a";
                                    ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
                                    ctx.lineWidth = 5; // Thicker for matched
                                  } else {
                                    // Red for unmatched
                                    ctx.strokeStyle = "#dc2626";
                                    ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
                                    ctx.lineWidth = 3;
                                  }

                                  // Draw box with shadow for depth
                                  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                                  ctx.shadowBlur = 4;
                                  ctx.strokeRect(x, y, w, h);
                                  ctx.fillRect(x, y, w, h);
                                  ctx.shadowBlur = 0;

                                  // Draw label with icon
                                  let label: string;
                                  let bgColor: string;

                                  if (face.matchedStudent) {
                                    label = `✓ ${face.matchedStudent.name} (${face.matchedStudent.similarity.toFixed(1)}%)`;
                                    bgColor = "#16a34a";
                                  } else {
                                    label = `✗ No identificado`;
                                    bgColor = "#dc2626";
                                  }

                                  // Measure text for background
                                  ctx.font = "bold 14px sans-serif";
                                  const textWidth =
                                    ctx.measureText(label).width;

                                  // Draw label background
                                  ctx.fillStyle = bgColor;
                                  ctx.fillRect(x, y - 30, textWidth + 16, 28);

                                  // Draw white text
                                  ctx.fillStyle = "#ffffff";
                                  ctx.fillText(label, x + 8, y - 10);
                                });
                              }}
                            />
                          </div>
                        )}

                        {/* Face details list - separated by match status */}
                        <div className="space-y-4 mt-4">
                          {/* Matched faces first */}
                          {photoInfo.faces.filter((f) => f.matchedStudent)
                            .length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Identificados (
                                {
                                  photoInfo.faces.filter(
                                    (f) => f.matchedStudent,
                                  ).length
                                }
                                )
                              </h5>
                              <div className="grid gap-2">
                                {photoInfo.faces
                                  .filter((f) => f.matchedStudent)
                                  .map((face, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-lg border bg-green-50 border-green-300"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="font-medium text-green-900 flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            {face.matchedStudent!.name}
                                          </div>
                                          <div className="text-sm text-green-700 mt-1">
                                            Confianza detección:{" "}
                                            {face.confidence.toFixed(1)}%{" · "}
                                            Similitud:{" "}
                                            <strong>
                                              {face.matchedStudent!.similarity.toFixed(
                                                1,
                                              )}
                                              %
                                            </strong>
                                          </div>

                                          {/* Show other potential matches */}
                                          {face.topMatches &&
                                            face.topMatches.length > 1 && (
                                              <div className="mt-2 text-xs">
                                                <div className="font-semibold text-gray-600 mb-1">
                                                  Otras posibles coincidencias:
                                                </div>
                                                <div className="space-y-1">
                                                  {face.topMatches
                                                    .slice(1)
                                                    .map((match, i) => (
                                                      <div
                                                        key={i}
                                                        className="flex justify-between items-center p-1 rounded bg-gray-100 text-gray-700"
                                                      >
                                                        <span>
                                                          {match.studentName}
                                                        </span>
                                                        <span>
                                                          {match.similarity.toFixed(
                                                            1,
                                                          )}
                                                          %
                                                        </span>
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Unmatched faces */}
                          {photoInfo.faces.filter((f) => !f.matchedStudent)
                            .length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                No Identificados (
                                {
                                  photoInfo.faces.filter(
                                    (f) => !f.matchedStudent,
                                  ).length
                                }
                                )
                              </h5>
                              <div className="grid gap-2">
                                {photoInfo.faces
                                  .filter((f) => !f.matchedStudent)
                                  .map((face, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-lg border bg-red-50 border-red-300"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="font-medium text-red-900 flex items-center gap-2">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                            Rostro sin identificar #{idx + 1}
                                          </div>
                                          <div className="text-sm text-red-700 mt-1">
                                            Confianza detección:{" "}
                                            {face.confidence.toFixed(1)}%
                                          </div>

                                          {/* Show why no match */}
                                          {face.noMatchReason && (
                                            <div className="text-xs text-amber-800 mt-2 p-2 bg-amber-100 rounded border border-amber-300">
                                              <strong>⚠ Razón:</strong>{" "}
                                              {face.noMatchReason}
                                            </div>
                                          )}

                                          {/* Show top matches if any */}
                                          {face.topMatches &&
                                            face.topMatches.length > 0 && (
                                              <div className="mt-2 text-xs">
                                                <div className="font-semibold text-orange-700 mb-1">
                                                  💡 Mejores coincidencias
                                                  encontradas:
                                                </div>
                                                <div className="space-y-1">
                                                  {face.topMatches.map(
                                                    (match, i) => (
                                                      <div
                                                        key={i}
                                                        className="flex justify-between items-center p-2 rounded bg-orange-50 text-orange-900 border border-orange-200"
                                                      >
                                                        <span className="font-medium">
                                                          {match.studentName}
                                                        </span>
                                                        <span className="font-bold">
                                                          {match.similarity.toFixed(
                                                            1,
                                                          )}
                                                          %
                                                          {match.belowThreshold && (
                                                            <span className="ml-1 text-xs">
                                                              (necesita ≥95%)
                                                            </span>
                                                          )}
                                                        </span>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                                {face.topMatches[0] &&
                                                  face.topMatches[0]
                                                    .similarity >= 85 && (
                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                                                      <strong>
                                                        💡 Sugerencia:
                                                      </strong>{" "}
                                                      Si este estudiante parece
                                                      correcto, considera
                                                      registrar más fotos para
                                                      mejorar la precisión.
                                                    </div>
                                                  )}
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Capturar Fotos</CardTitle>
                <CardDescription>
                  Toma de 1 a 10 fotos del aula para registrar la asistencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photos.length >= 10}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar Foto ({photos.length}/10)
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-video bg-muted rounded-lg overflow-hidden"
                        >
                          <img
                            src={photo.preview}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            Foto {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={handleSubmitAttendance}
                      disabled={photos.length === 0 || isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Procesando..." : "Registrar Asistencia"}
                    </Button>
                    {isSubmitting && uploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          {uploadProgress < 30
                            ? "Preparando fotos..."
                            : uploadProgress < 70
                              ? "Subiendo fotos..."
                              : "Procesando asistencia..."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Estudiantes Inscritos</CardTitle>
                <CardDescription>
                  {classData.total} estudiantes en esta clase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {classData.students.map((student) => (
                    <div
                      key={student.student.id}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className="font-medium text-sm">
                        {student.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.faceCount > 0 ? (
                          <span className="text-green-600">
                            ✓ {student.faceCount} foto(s)
                          </span>
                        ) : (
                          <span className="text-amber-600">⚠ Sin fotos</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
