/**
 * Self-contained form for creating a new guardian
 * Can be used in pages, dialogs, or modals
 */

import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import type { CreateGuardianRequest } from "@/types/guardian";
import { zRutString } from "@/lib/helpers/rut";
import { Loader2 } from "lucide-react";
import { GuardianFormFields } from "./GuardianFormFields";

interface GuardianCreateFormProps {
  onSuccess?: (guardian: CreateGuardianRequest) => void | Promise<void>;
  onError?: (error: Error) => void;
  onSubmit: (data: CreateGuardianRequest) => Promise<void>;
}

export function GuardianCreateForm({
  onSuccess,
  onError,
  onSubmit,
}: GuardianCreateFormProps) {
  const { t } = useTranslation("guardians");

  const form = useForm({
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      identificationNumber: "",
      phone: "",
      email: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const normalized: CreateGuardianRequest = {
          firstName: value.firstName.trim(),
          middleName: value.middleName.trim() || undefined,
          lastName: value.lastName.trim(),
          secondLastName: value.secondLastName.trim() || undefined,
          identificationNumber: zRutString.parse(value.identificationNumber),
          phone: value.phone.trim(),
          email: value.email.trim(),
        };

        await onSubmit(normalized);
        formApi.reset();
        await onSuccess?.(normalized);
      } catch (error) {
        console.error("Guardian creation error:", error);
        onError?.(error as Error);
      }
    },
  });

  const formFieldErrorVisible = (isTouched: boolean, hasErrors: boolean) =>
    hasErrors && (isTouched || form.state.isSubmitted);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
      noValidate
    >
      <FieldSet className="space-y-4">
        <FieldLegend variant="label">{t("form.legend")}</FieldLegend>
        <GuardianFormFields
          form={form}
          formFieldErrorVisible={formFieldErrorVisible}
        />
      </FieldSet>

      <Button
        type="submit"
        disabled={form.state.isSubmitting}
        className="w-full"
      >
        {form.state.isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("form.submitting")}
          </>
        ) : (
          t("form.submit")
        )}
      </Button>
    </form>
  );
}
