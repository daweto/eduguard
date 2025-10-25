import { useEffect, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  getGuardians,
} from '@/lib/api';
import type { Grade, Stage } from '@/types/grade';
import type { LegalGuardian } from '@/types/guardian';
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

type PhotoData = {
  file: File;
  preview: string;
  base64?: string;
};

type EnrollmentFormValues = {
  name: string;
  grade: string;
  guardian_id?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  photos: PhotoData[];
};

const defaultValues: EnrollmentFormValues = {
  name: '',
  grade: '',
  guardian_id: undefined,
  guardian_name: '',
  guardian_phone: '',
  guardian_email: '',
  photos: [],
};

interface EnrollmentFormProps {
  onSuccess?: () => void;
}

export function EnrollmentForm({ onSuccess }: EnrollmentFormProps) {
  const { t } = useTranslation('enrollment');
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [gradeGroups, setGradeGroups] = useState<Array<Stage & { grades: Grade[] }>>([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradesError, setGradesError] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<LegalGuardian[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(true);
  const [guardiansError, setGuardiansError] = useState<string | null>(null);

  const photoSchema = z.object({
    file: z.instanceof(File, { message: t('fields.photos.invalidFile') }),
    preview: z.string(),
    base64: z.string().optional(),
  });

  const enrollmentFormSchema = z.object({
    name: z.string().trim().min(1, t('fields.studentName.required')),
    grade: z
      .string()
      .trim()
      .max(50, t('common:validation.maxLength', { max: 50 }))
      .or(z.literal('')),
    guardian_id: z.string().trim().optional(),
    guardian_name: z.string().trim().min(1, t('fields.guardianName.required')),
    guardian_phone: z
      .string()
      .trim()
      .min(7, t('fields.phone.required'))
      .max(20, t('fields.phone.tooLong'))
      .regex(/^[-+()\d\s]+$/, t('fields.phone.invalid')),
    guardian_email: z
      .string()
      .trim()
      .email(t('fields.email.invalid'))
      .or(z.literal(''))
      .optional(),
    photos: z.array(photoSchema).min(1, t('fields.photos.minRequired')).max(3, t('fields.photos.maxExceeded')),
  });

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
            guardian_id: value.guardian_id || undefined,
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
          setServerError(t('messages.error', { message: error.message }));
        } else {
          setServerError(t('messages.genericError'));
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
      setGuardiansLoading(true);
      try {
        const [stagesResponse, gradesResponse, guardiansResponse] = await Promise.all([
          getStages(),
          getGrades(),
          getGuardians(),
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
        setGuardians(guardiansResponse.guardians);
        setGuardiansError(null);
      } catch (error) {
        console.error('Failed to load grade metadata', error);
        if (!isMounted) return;
        setGradesError(t('fields.grade.loadError'));
        setGuardiansError('No pudimos cargar la lista de apoderados.');
      } finally {
        if (isMounted) {
          setGradesLoading(false);
          setGuardiansLoading(false);
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
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
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
            <FieldLegend variant="label">{t('sections.studentInfo')}</FieldLegend>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field name="name">
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);

                  return (
                    <Field data-invalid={showError} className="space-y-2">
                      <FieldLabel htmlFor={field.name}>{t('fields.studentName.label')} *</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                          placeholder={t('fields.studentName.placeholder')}
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
                    ? t('fields.grade.loading')
                    : t('fields.grade.placeholder');

                  return (
                    <Field data-invalid={showError} className="space-y-2">
                      <FieldLabel htmlFor={field.name}>{t('fields.grade.label')}</FieldLabel>
                      <FieldContent>
                        <Select
                          value={field.state.value || undefined}
                          onValueChange={(value) => {
                            const next = value === 'none' ? '' : value;
                            field.handleChange(next);
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
                            <SelectItem value="none">{t('fields.grade.none')}</SelectItem>
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
            <FieldLegend variant="label">{t('sections.guardianInfo')}</FieldLegend>
            <FieldGroup className="space-y-4">
              <form.Field name="guardian_id">
                {(field) => {
                  return (
                    <Field className="space-y-2">
                      <FieldLabel htmlFor={field.name}>{t('fields.guardianSelect.label', { defaultValue: 'Select Existing Guardian' })}</FieldLabel>
                      <FieldContent>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            field.handleChange(value);
                            field.handleBlur();
                            const selected = guardians.find((g) => g.id === value);
                            if (selected) {
                              form.setFieldValue('guardian_name', selected.name);
                              form.setFieldValue('guardian_phone', selected.phone);
                              form.setFieldValue('guardian_email', selected.email ?? '');
                            }
                          }}
                          disabled={guardiansLoading || !!guardiansError}
                        >
                          <SelectTrigger id={field.name} className="w-full justify-between text-left text-base">
                            <SelectValue placeholder={guardiansLoading ? 'Cargando apoderados...' : 'Selecciona un apoderado'} />
                          </SelectTrigger>
                          <SelectContent>
                            {guardians.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name} — {g.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  );
                }}
              </form.Field>
              <form.Field name="guardian_name">
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const showError = formFieldErrorVisible(field.state.meta.isTouched, hasErrors);

                  return (
                    <Field data-invalid={showError} className="space-y-2">
                      <FieldLabel htmlFor={field.name}>{t('fields.guardianName.label')} *</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                          placeholder={t('fields.guardianName.placeholder')}
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
                        <FieldLabel htmlFor={field.name}>{t('fields.phone.label')} *</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="tel"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder={t('fields.phone.placeholder')}
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
                        <FieldLabel htmlFor={field.name}>{t('fields.email.label')}</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="email"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            placeholder={t('fields.email.placeholder')}
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
            <FieldLegend variant="label">{t('sections.photos')}</FieldLegend>
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
                    setServerError(t('fields.photos.maxExceeded'));
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
                      {t('fields.photos.description')}
                    </FieldDescription>

                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                          <div key={photo.preview} className="relative group">
                            <img
                              src={photo.preview}
                              alt={t('fields.photos.previewAlt', { number: index + 1 })}
                              className="w-full h-40 object-cover rounded-lg border-2 border-border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={t('fields.photos.removeAlt', { number: index + 1 })}
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
                              {t('fields.photos.uploadLabel', { count: photos.length })}
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
              <span>{t('messages.success')}</span>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('button.submitting')}
              </>
            ) : (
              t('button.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
