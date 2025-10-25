import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enrollStudent, ApiError } from "@/lib/api";
import { useGrades } from "@/components/grades/hooks/useGrades";
import { useGuardians } from "@/components/guardians/hooks/useGuardians";
import { GuardianFormFields } from "@/components/guardians/GuardianFormFields";
import { formatFullName } from "@/lib/helpers/format";
import { formatRut, zRutString } from "@/lib/helpers/rut";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import type { EnrollStudentRequest } from "@/types/student";

type PhotoData = {
  file: File;
  preview: string;
  base64?: string;
};

type EnrollmentFormValues = {
  student: {
    firstName: string;
    middleName: string;
    lastName: string;
    secondLastName: string;
    identificationNumber: string;
    gradeId: string;
  };
  guardian: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    secondLastName: string;
    identificationNumber: string;
    phone: string;
    email: string;
    preferredLanguage: string;
  };
  photos: PhotoData[];
};

const defaultValues: EnrollmentFormValues = {
  student: {
    firstName: "",
    middleName: "",
    lastName: "",
    secondLastName: "",
    identificationNumber: "",
    gradeId: "",
  },
  guardian: {
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    secondLastName: "",
    identificationNumber: "",
    phone: "",
    email: "",
    preferredLanguage: "es",
  },
  photos: [],
};

interface EnrollmentFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function StudentEnrollmentForm({
  onSuccess,
  onError,
}: EnrollmentFormProps) {
  const { t } = useTranslation("enrollment");
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Use hooks for data fetching
  const {
    gradeGroups,
    loading: gradesLoading,
    error: gradesError,
  } = useGrades();

  const {
    guardians,
    loading: guardiansLoading,
    error: guardiansError,
  } = useGuardians();

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      setSuccess(false);

      try {
        const normalize = (input: string) => input.trim();

        const payload: {
          student: EnrollStudentRequest["student"];
          guardian: EnrollStudentRequest["guardian"];
        } = {
          student: {
            firstName: normalize(value.student.firstName),
            middleName: value.student.middleName.trim() || undefined,
            lastName: normalize(value.student.lastName),
            secondLastName: value.student.secondLastName.trim() || undefined,
            identificationNumber: zRutString.parse(
              value.student.identificationNumber,
            ),
            gradeId: value.student.gradeId.trim() || undefined,
          },
          guardian: {
            id: value.guardian.id.trim() || undefined,
            firstName: normalize(value.guardian.firstName),
            middleName: value.guardian.middleName.trim() || undefined,
            lastName: normalize(value.guardian.lastName),
            secondLastName: value.guardian.secondLastName.trim() || undefined,
            identificationNumber: zRutString.parse(
              value.guardian.identificationNumber,
            ),
            phone: normalize(value.guardian.phone),
            email: normalize(value.guardian.email),
            preferredLanguage: value.guardian.preferredLanguage.trim() || "es",
          },
        };

        await enrollStudent(
          payload,
          value.photos.map((photo) => photo.file),
        );

        // Revoke object URLs to free memory
        value.photos.forEach((photo) => URL.revokeObjectURL(photo.preview));

        // Reset form before calling onSuccess (which may redirect)
        formApi.reset();
        setSuccess(true);
        onSuccess?.();
      } catch (error) {
        if (error instanceof ApiError) {
          setServerError(t("messages.error", { message: error.message }));
        } else {
          setServerError(t("messages.genericError"));
        }
        console.error("Enrollment error:", error);
        onError?.(error as Error);
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;

  const formFieldErrorVisible = (isTouched: boolean, hasErrors: boolean) =>
    hasErrors && (isTouched || form.state.isSubmitted);

  const handleGuardianSelection = (guardianId: string) => {
    if (!guardianId) {
      form.setFieldValue("guardian.id", "");
      return;
    }

    const selected = guardians.find((g) => g.id === guardianId);
    if (!selected) return;

    form.setFieldValue("guardian.id", selected.id);
    form.setFieldValue("guardian.firstName", selected.firstName);
    form.setFieldValue("guardian.middleName", selected.middleName ?? "");
    form.setFieldValue("guardian.lastName", selected.lastName);
    form.setFieldValue(
      "guardian.secondLastName",
      selected.secondLastName ?? "",
    );
    form.setFieldValue(
      "guardian.identificationNumber",
      formatRut(selected.identificationNumber),
    );
    form.setFieldValue("guardian.phone", selected.phone);
    form.setFieldValue("guardian.email", selected.email);
    form.setFieldValue(
      "guardian.preferredLanguage",
      selected.preferredLanguage ?? "es",
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6 relative"
      noValidate
    >
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("messages.enrolling")}
            </p>
          </div>
        </div>
      )}
      <FieldSet className="space-y-4">
        <FieldLegend variant="label">{t("sections.studentInfo")}</FieldLegend>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="student.firstName">
            {(field) => {
              const showError = formFieldErrorVisible(
                field.state.meta.isTouched,
                field.state.meta.errors.length > 0,
              );
              return (
                <Field data-invalid={showError} className="space-y-2">
                  <FieldLabel htmlFor={field.name}>
                    {t("fields.student.firstName.label")} *
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      placeholder={t("fields.student.firstName.placeholder")}
                      aria-invalid={showError}
                      autoComplete="given-name"
                    />
                  </FieldContent>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="student.lastName">
            {(field) => {
              const showError = formFieldErrorVisible(
                field.state.meta.isTouched,
                field.state.meta.errors.length > 0,
              );
              return (
                <Field data-invalid={showError} className="space-y-2">
                  <FieldLabel htmlFor={field.name}>
                    {t("fields.student.lastName.label")} *
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      placeholder={t("fields.student.lastName.placeholder")}
                      aria-invalid={showError}
                      autoComplete="family-name"
                    />
                  </FieldContent>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="student.middleName">
            {(field) => (
              <Field className="space-y-2">
                <FieldLabel htmlFor={field.name}>
                  {t("fields.student.middleName.label")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t("fields.student.middleName.placeholder")}
                    autoComplete="additional-name"
                  />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="student.secondLastName">
            {(field) => (
              <Field className="space-y-2">
                <FieldLabel htmlFor={field.name}>
                  {t("fields.student.secondLastName.label")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t("fields.student.secondLastName.placeholder")}
                  />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="student.identificationNumber">
            {(field) => {
              const showError = formFieldErrorVisible(
                field.state.meta.isTouched,
                field.state.meta.errors.length > 0,
              );
              return (
                <Field data-invalid={showError} className="space-y-2">
                  <FieldLabel htmlFor={field.name}>
                    {t("fields.student.identification.label")} *
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={() => {
                        field.handleBlur();
                        form.setFieldValue(
                          field.name,
                          formatRut(field.state.value),
                        );
                      }}
                      placeholder={t(
                        "fields.student.identification.placeholder",
                      )}
                      aria-invalid={showError}
                      autoComplete="off"
                      inputMode="text"
                      autoCapitalize="characters"
                    />
                  </FieldContent>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="student.gradeId">
            {(field) => {
              const showError = formFieldErrorVisible(
                field.state.meta.isTouched,
                field.state.meta.errors.length > 0,
              );
              const placeholder = gradesLoading
                ? t("fields.student.grade.loading")
                : t("fields.student.grade.placeholder");

              return (
                <Field data-invalid={showError} className="space-y-2">
                  <FieldLabel htmlFor={field.name}>
                    {t("fields.student.grade.label")}
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) => {
                        const next = value === "none" ? "" : value;
                        field.handleChange(next);
                        field.handleBlur();
                      }}
                      disabled={gradesLoading || !!gradesError}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={showError}
                        className="w-full justify-between text-left"
                      >
                        <SelectValue placeholder={placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("fields.student.grade.none")}
                        </SelectItem>
                        <SelectSeparator />
                        {gradeGroups.map((stage) => (
                          <SelectGroup key={stage.id}>
                            <SelectLabel>{stage.displayName}</SelectLabel>
                            {stage.grades.map((grade) => (
                              <SelectItem key={grade.id} value={grade.id}>
                                {grade.displayName}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  {gradesError && <FieldError>{gradesError}</FieldError>}
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="space-y-4">
        <FieldLegend variant="label">{t("sections.guardianInfo")}</FieldLegend>
        <FieldGroup className="space-y-4">
          <form.Field name="guardian.id">
            {(field) => (
              <Field className="space-y-2">
                <FieldLabel htmlFor={field.name}>
                  {t("fields.guardian.select.label")}
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={field.state.value || undefined}
                    onValueChange={(value) => {
                      field.handleChange(value === "none" ? "" : value);
                      field.handleBlur();
                      if (value === "none") {
                        form.setFieldValue("guardian.id", "");
                      } else {
                        handleGuardianSelection(value);
                      }
                    }}
                    disabled={guardiansLoading || !!guardiansError}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="w-full justify-between text-left"
                    >
                      <SelectValue
                        placeholder={
                          guardiansLoading
                            ? t("fields.guardian.select.loading")
                            : t("fields.guardian.select.placeholder")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t("fields.guardian.select.none")}
                      </SelectItem>
                      <SelectSeparator />
                      {guardians.map((guardian) => (
                        <SelectItem key={guardian.id} value={guardian.id}>
                          {formatFullName(guardian)} — {guardian.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
                {guardiansError && <FieldError>{guardiansError}</FieldError>}
              </Field>
            )}
          </form.Field>

          <GuardianFormFields
            form={form}
            fieldPrefix="guardian"
            formFieldErrorVisible={formFieldErrorVisible}
            translationNamespace="enrollment"
            translationKeyPrefix="fields.guardian"
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet className="space-y-4">
        <FieldLegend variant="label">{t("sections.photos")}</FieldLegend>
        <form.Field name="photos" mode="array">
          {(field) => {
            const photos = field.state.value;
            const showError = formFieldErrorVisible(
              field.state.meta.isTouched,
              field.state.meta.errors.length > 0,
            );

            const handlePhotoSelect = (
              event: ChangeEvent<HTMLInputElement>,
            ) => {
              const files = Array.from(event.target.files ?? []);
              if (!files.length) return;

              const remainingSlots = Math.max(0, 3 - photos.length);
              if (!remainingSlots) {
                setServerError(t("fields.photos.maxExceeded"));
                field.setMeta((prev) => ({ ...prev, isTouched: true }));
                event.target.value = "";
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
              event.target.value = "";
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
                  {t("fields.photos.description")}
                </FieldDescription>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={photo.preview} className="relative group">
                        <img
                          src={photo.preview}
                          alt={t("fields.photos.previewAlt", {
                            number: index + 1,
                          })}
                          className="w-full h-40 object-cover rounded-lg border-2 border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={t("fields.photos.removeAlt", {
                            number: index + 1,
                          })}
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
                          {t("fields.photos.uploadLabel", {
                            count: photos.length,
                          })}
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
          <span>{t("messages.success")}</span>
        </div>
      )}

      <Button
        type="submit"
        loading={isSubmitting}
        className="w-full h-12 text-base"
      >
        {isSubmitting ? t("button.submitting") : t("button.submit")}
      </Button>
    </form>
  );
}
