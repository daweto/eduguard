/**
 * Reusable guardian form fields component
 * Can be used in GuardianCreateForm, StudentEnrollmentForm, or any form that needs guardian data
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { formatRut } from '@/lib/helpers/rut';

interface GuardianFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any; // FormApi from @tanstack/react-form
  fieldPrefix?: string; // e.g., "guardian" for nested fields
  formFieldErrorVisible: (isTouched: boolean, hasErrors: boolean) => boolean;
  translationNamespace?: string; // e.g., "guardians" or "enrollment"
  translationKeyPrefix?: string; // e.g., "form" or "fields.guardian"
}

export function GuardianFormFields({
  form,
  fieldPrefix = '',
  formFieldErrorVisible,
  translationNamespace = 'guardians',
  translationKeyPrefix = 'form',
}: GuardianFormFieldsProps) {
  const { t } = useTranslation(translationNamespace);

  const getFieldName = (field: string) => (fieldPrefix ? `${fieldPrefix}.${field}` : field);
  const getTranslationKey = (key: string) => `${translationKeyPrefix}.${key}`;

  return (
    <>
      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name={getFieldName('firstName')}>
          {(field: any) => {
            const showError = formFieldErrorVisible(field.state.meta.isTouched, field.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={field.name}>{t(getTranslationKey('firstName.label'))} *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t(getTranslationKey('firstName.placeholder'))}
                    aria-invalid={showError}
                  />
                </FieldContent>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name={getFieldName('lastName')}>
          {(field: any) => {
            const showError = formFieldErrorVisible(field.state.meta.isTouched, field.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={field.name}>{t(getTranslationKey('lastName.label'))} *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t(getTranslationKey('lastName.placeholder'))}
                    aria-invalid={showError}
                  />
                </FieldContent>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name={getFieldName('middleName')}>
          {(field: any) => (
            <Field className="space-y-2">
              <FieldLabel htmlFor={field.name}>{t(getTranslationKey('middleName.label'))}</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t(getTranslationKey('middleName.placeholder'))}
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name={getFieldName('secondLastName')}>
          {(field: any) => (
            <Field className="space-y-2">
              <FieldLabel htmlFor={field.name}>{t(getTranslationKey('secondLastName.label'))}</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t(getTranslationKey('secondLastName.placeholder'))}
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name={getFieldName('identificationNumber')}>
          {(field: any) => {
            const showError = formFieldErrorVisible(field.state.meta.isTouched, field.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={field.name}>{t(getTranslationKey('identification.label'))} *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={() => {
                      field.handleBlur();
                      form.setFieldValue(field.name, formatRut(field.state.value));
                    }}
                    placeholder={t(getTranslationKey('identification.placeholder'))}
                    aria-invalid={showError}
                    inputMode="text"
                    autoCapitalize="characters"
                  />
                </FieldContent>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name={getFieldName('phone')}>
          {(field: any) => {
            const showError = formFieldErrorVisible(field.state.meta.isTouched, field.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={field.name}>{t(getTranslationKey('phone.label'))} *</FieldLabel>
                <FieldContent>
                  <PhoneInput
                    value={field.state.value}
                    onChange={(val) => {
                      field.handleChange((val as string) ?? '');
                      field.handleBlur();
                    }}
                    placeholder={t(getTranslationKey('phone.placeholder')) as string}
                    defaultCountry="CL"
                  />
                </FieldContent>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <form.Field name={getFieldName('email')}>
        {(field: any) => {
          const showError = formFieldErrorVisible(field.state.meta.isTouched, field.state.meta.errors.length > 0);
          return (
            <Field data-invalid={showError} className="space-y-2">
              <FieldLabel htmlFor={field.name}>{t(getTranslationKey('email.label'))} *</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t(getTranslationKey('email.placeholder'))}
                  aria-invalid={showError}
                  autoComplete="email"
                />
              </FieldContent>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>
    </>
  );
}
