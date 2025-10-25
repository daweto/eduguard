import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  enrollStudent,
  ApiError,
  getStages,
  getGrades,
} from '@/lib/api';
import type { Grade, Stage } from '@/types/grade';
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';

const photoSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a valid image file.' }),
  preview: z.string(),
  base64: z.string().optional(),
});

const enrollmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Student name is required'),
  grade: z
    .string()
    .trim()
    .max(50, 'Grade must be 50 characters or less')
    .optional()
    .or(z.literal('')),
  guardian_name: z.string().trim().min(1, 'Guardian name is required'),
  guardian_phone: z
    .string()
    .trim()
    .min(7, 'Guardian phone number is required')
    .max(20, 'Guardian phone number is too long')
    .regex(/^[-+()\d\s]+$/, 'Enter a valid phone number'),
  guardian_email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .or(z.literal(''))
    .optional(),
  photos: z.array(photoSchema).min(1, 'Upload at least one photo').max(3, 'Maximum 3 photos allowed'),
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

const defaultValues: EnrollmentFormValues = {
  name: '',
  grade: '',
  guardian_name: '',
  guardian_phone: '',
  guardian_email: '',
  photos: [],
};

interface EnrollmentFormProps {
  onSuccess?: () => void;
}

export function EnrollmentForm({ onSuccess }: EnrollmentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [gradeGroups, setGradeGroups] = useState<Array<Stage & { grades: Grade[] }>>([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradesError, setGradesError] = useState<string | null>(null);

  const form = useForm({
    defaultValues,
    validators: {
      onBlur: enrollmentFormSchema,
      onSubmit: enrollmentFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      setSuccess(false);

      try {
        const grade = value.grade?.trim() ?? '';
        const guardianEmail = value.guardian_email?.trim() ?? '';

        await enrollStudent(
          {
            name: value.name,
            grade: grade ? grade : undefined,
            guardian_name: value.guardian_name,
            guardian_phone: value.guardian_phone,
            guardian_email: guardianEmail ? guardianEmail : undefined,
          },
          value.photos.map((photo) => photo.file)
        );

        value.photos.forEach((photo) => URL.revokeObjectURL(photo.preview));

        formApi.reset();
        setSuccess(true);
        onSuccess?.();
      } catch (error) {
        if (error instanceof ApiError) {
          setServerError(`Error: ${error.message}`);
        } else {
          setServerError('Failed to enroll student. Please try again.');
        }
        console.error('Enrollment error:', error);
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;

  useEffect(() => {
    return () => {
      form.state.values.photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, [form]);

  useEffect(() => {
    let isMounted = true;

    async function loadGrades() {
      setGradesLoading(true);
      try {
        const [stagesResponse, gradesResponse] = await Promise.all([
          getStages(),
          getGrades(),
        ]);

        if (!isMounted) return;

        const stagesSorted = [...stagesResponse.stages].sort(
          (a, b) => a.order - b.order,
        );
        const gradesSorted = [...gradesResponse.grades].sort(
          (a, b) => a.order - b.order,
        );

        const grouped = stagesSorted.map((stage) => ({
          ...stage,
          grades: gradesSorted.filter((grade) => grade.stageId === stage.id),
        }));

        setGradeGroups(grouped);
        setGradesError(null);
      } catch (error) {
        console.error('Failed to load grade metadata', error);
        if (!isMounted) return;
        setGradesError('No pudimos cargar la lista de cursos. Intenta nuevamente.');
      } finally {
        if (isMounted) {
          setGradesLoading(false);
        }
      }
    }

    void loadGrades();

    return () => {
      isMounted = false;
    };
  }, []);

  const formFieldErrorVisible = (isTouched: boolean, hasErrors: boolean) =>
    hasErrors && (isTouched || form.state.isSubmitted);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enroll New Student</CardTitle>
        <CardDescription>
          Add a new student to the system with 1-3 portrait photos for facial recognition
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
          noValidate
        >
          <FieldSet className="space-y-4">
            <FieldLegend variant="label">Student Information</FieldLegend>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field name="name">
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);

                  return (
                    <Field data-invalid={showError} className="space-y-2">
                      <FieldLabel htmlFor={field.name}>Student Name *</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Sofia Martinez"
                          aria-invalid={showError}
                          autoComplete="name"
                          className="text-base"
                        />
                      </FieldContent>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="grade">
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);
                  const placeholder = gradesLoading
                    ? 'Cargando cursos...'
                    : 'Selecciona el curso';

                  return (
                    <Field data-invalid={showError} className="space-y-2">
                      <FieldLabel htmlFor={field.name}>Grade</FieldLabel>
                      <FieldContent>
                        <Select
                          value={field.state.value || undefined}
                          onValueChange={(value) => {
                            field.handleChange(value);
                            field.handleBlur();
                          }}
                          disabled={gradesLoading || !!gradesError}
                        >
                          <SelectTrigger
                            id={field.name}
                            aria-invalid={showError}
                            className="w-full justify-between text-left text-base"
                          >
                            <SelectValue placeholder={placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin curso asignado</SelectItem>
                            <SelectSeparator />
                            {gradeGroups.map((stage) => (
                              <SelectGroup key={stage.id}>
                                <SelectLabel>{stage.displayName}</SelectLabel>
                                {stage.grades.map((grade) => (
                                  <SelectItem key={grade.id} value={grade.displayName}>
                                    {grade.displayName}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                      {gradesError && (
                        <FieldError>{gradesError}</FieldError>
                      )}
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet className="space-y-4">
            <FieldLegend variant="label">Guardian Information</FieldLegend>
            <FieldGroup className="space-y-4">
              <form.Field name="guardian_name">
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);

                  return (
                    <Field data-invalid={showError} className="space-y-2">
                      <FieldLabel htmlFor={field.name}>Guardian Name *</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Maria Martinez"
                          aria-invalid={showError}
                          autoComplete="name"
                          className="text-base"
                        />
                      </FieldContent>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  );
                }}
              </form.Field>

              <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="guardian_phone">
                  {(field) => {
                    const hasErrors = field.state.meta.errors.length > 0;
                    const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);

                    return (
                      <Field data-invalid={showError} className="space-y-2">
                        <FieldLabel htmlFor={field.name}>Phone Number *</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="tel"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="+56912345678"
                            aria-invalid={showError}
                            autoComplete="tel"
                            className="text-base"
                          />
                        </FieldContent>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="guardian_email">
                  {(field) => {
                    const hasErrors = field.state.meta.errors.length > 0;
                    const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);

                    return (
                      <Field data-invalid={showError} className="space-y-2">
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="email"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="maria@example.com"
                            aria-invalid={showError}
                            autoComplete="email"
                            className="text-base"
                          />
                        </FieldContent>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    );
                  }}
                </form.Field>
              </FieldGroup>
            </FieldGroup>
          </FieldSet>

          <FieldSet className="space-y-4">
            <FieldLegend variant="label">Student Photos</FieldLegend>
            <form.Field name="photos" mode="array">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);
                const photos = field.state.value;

                const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
                  const files = Array.from(event.target.files ?? []);
                  if (!files.length) {
                    return;
                  }

                  const remainingSlots = Math.max(0, 3 - photos.length);
                  if (!remainingSlots) {
                    setServerError('Maximum 3 photos allowed');
                    field.setMeta((prev) => ({ ...prev, isTouched: true }));
                    event.target.value = '';
                    return;
                  }

                  const filesToAdd = files.slice(0, remainingSlots);
                  const newPhotos = filesToAdd.map((file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                  }));

                  field.setValue([...photos, ...newPhotos]);
                  field.setMeta((prev) => ({ ...prev, isTouched: true }));
                  field.handleBlur();
                  setServerError(null);
                  event.target.value = '';
                };

                const removePhoto = (index: number) => {
                  const photo = photos[index];
                  if (!photo) return;
                  URL.revokeObjectURL(photo.preview);
                  field.removeValue(index);
                  field.setMeta((prev) => ({ ...prev, isTouched: true }));
                  field.handleBlur();
                };

                return (
                  <Field data-invalid={showError} className="space-y-4">
                    <FieldDescription>
                      Upload 1-3 clear photos of the student. Drag-and-drop or click the upload area.
                    </FieldDescription>

                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                          <div key={photo.preview} className="relative group">
                            <img
                              src={photo.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg border-2 border-border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {photos.length < 3 && (
                      <div>
                        <FieldLabel
                          htmlFor="photo-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload photo ({photos.length}/3)
                            </p>
                          </div>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePhotoSelect}
                            onBlur={field.handleBlur}
                          />
                        </FieldLabel>
                      </div>
                    )}

                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>
          </FieldSet>

          {serverError && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {serverError}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Student enrolled successfully!</span>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enrolling Student...
              </>
            ) : (
              'Enroll Student'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
