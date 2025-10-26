import { useState, useEffect, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  ArrowLeft,
  Upload,
  X,
  Camera,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudent,
  uploadStudentPhotos,
  type Student,
} from "@/lib/api/students";
import { formatRut } from "@/lib/helpers/rut";

type PhotoData = {
  file: File;
  preview: string;
};

export default function EditStudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("students");

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fullName = student
    ? [
        student.firstName,
        student.middleName,
        student.lastName,
        student.secondLastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;

      try {
        const data = await getStudent(studentId);
        setStudent(data);
      } catch (error) {
        console.error("Error fetching student:", error);
        toast.error(t("edit.errors.loadStudent"));
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, t]);

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: PhotoData[] = [];
    const maxPhotos = 5; // Limit to 5 photos total
    const remainingSlots = maxPhotos - photos.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(t("edit.errors.invalidImage", { fileName: file.name }));
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("edit.errors.fileTooLarge", { fileName: file.name }));
        continue;
      }

      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.error(t("edit.errors.selectPhotos"));
      return;
    }

    if (!studentId) {
      toast.error(t("edit.errors.loadStudent"));
      return;
    }

    setUploading(true);
    setSuccess(false);

    try {
      // Upload photos using presigned URLs
      const photoFiles = photos.map((photo) => photo.file);
      const result = await uploadStudentPhotos(studentId, photoFiles);

      setSuccess(true);
      toast.success(
        t("edit.success.photosUploaded", { count: result.photos_uploaded }),
      );

      // Clean up
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);

      // Refresh student data
      const updatedStudent = await getStudent(studentId);
      setStudent(updatedStudent);
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error(
        error instanceof Error ? error.message : t("edit.errors.uploadFailed"),
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">
              {t("common:error", "Error")}
            </CardTitle>
            <CardDescription className="text-red-700">
              {t("edit.errors.notFound")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/students/roster")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("edit.backToRoster")}
        </Button>

        <h1 className="text-3xl font-bold mb-2">{t("edit.title")}</h1>
        <p className="text-muted-foreground">{fullName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("edit.info.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("edit.info.fullName")}
              </p>
              <p className="font-medium">{fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("edit.info.rut")}
              </p>
              <p className="font-medium">
                {formatRut(student.identificationNumber)}
              </p>
            </div>
            {student.gradeId && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("edit.info.grade")}
                </p>
                <p className="font-medium">{student.gradeId}</p>
              </div>
            )}
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                {t("edit.info.currentPhotos")}
              </p>
              <p className="font-medium">
                {t("edit.info.photosCount", {
                  count: student.photo_urls?.length || 0,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("edit.info.indexedFaces")}
              </p>
              <p className="font-medium">
                {t("edit.info.facesCount", {
                  count: student.face_ids?.length || 0,
                })}
                {student.face_ids && student.face_ids.length > 0 && (
                  <span className="text-green-600 ml-2">
                    {t("edit.info.readyForAttendance")}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Photos */}
        {student.photo_urls && student.photo_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("edit.currentPhotos.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {student.photo_urls?.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={url}
                      alt={t("edit.currentPhotos.photoAlt", {
                        index: index + 1,
                      })}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Photos Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("edit.upload.title")}</CardTitle>
          <CardDescription>{t("edit.upload.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  {t("edit.upload.success.title")}
                </p>
                <p className="text-sm text-green-700">
                  {t("edit.upload.success.message")}
                </p>
              </div>
            </div>
          )}

          <div>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
              disabled={uploading || photos.length >= 5}
            />
            <label htmlFor="photo-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading || photos.length >= 5}
                asChild
              >
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  {t("edit.upload.selectButton", {
                    current: photos.length,
                    max: 5,
                  })}
                </span>
              </Button>
            </label>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={photo.preview}
                    alt={t("edit.upload.previewAlt", { index: index + 1 })}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemovePhoto(index)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {t("edit.upload.photoLabel", { index: index + 1 })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={photos.length === 0 || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("edit.upload.uploading")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t("edit.upload.submitButton", { count: photos.length })}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
