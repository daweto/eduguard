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

/**
 * Minimal interface for the field state we use from TanStack Form
 * Note: TanStack Form uses generic error types, but for our simple string validations
 * we know they'll always be strings or undefined
 */
interface FieldState {
  value: string;
  meta: {
    isTouched: boolean;
    errors: Array<string | undefined>;
    isValid: boolean;
  };
}

/**
 * Minimal interface for field API methods we use from TanStack Form
 */
interface MinimalFieldApi {
  name: string;
  state: FieldState;
  handleChange: (value: string) => void;
  handleBlur: () => void;
}

/**
 * Minimal interface for the form API we use from TanStack Form
 * Using a broad type to be compatible with any FormApi instance
 */
interface MinimalFormApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Field: any; // TanStack Form's FieldComponent with many generics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldValue: (...args: any[]) => any;
  state: {
    isSubmitted: boolean;
  };
}

interface GuardianFormFieldsProps {
  form: MinimalFormApi;
  fieldPrefix?: string; // e.g., "guardian" for nested fields
  formFieldErrorVisible: (isTouched: boolean, hasErrors: boolean) => boolean;
  translationNamespace?: string; // e.g., "guardians" or "enrollment"
  translationKeyPrefix?: string; // e.g., "form" or "fields.guardian"
}

/**
 * Helper to convert TanStack Form string errors to the format expected by FieldError component
 */
function mapErrors(errors: Array<string | undefined>): Array<{ message?: string } | undefined> {
  return errors.map(error => error ? { message: error } : undefined);
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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            // Type assertion is safe because we know the form field structure
            const typedField = field as MinimalFieldApi;
            const showError = formFieldErrorVisible(typedField.state.meta.isTouched, typedField.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('firstName.label'))} *</FieldLabel>
                <FieldContent>
                  <Input
                    id={typedField.name}
                    value={typedField.state.value}
                    onChange={(e) => typedField.handleChange(e.target.value)}
                    onBlur={typedField.handleBlur}
                    placeholder={t(getTranslationKey('firstName.placeholder'))}
                    aria-invalid={showError}
                  />
                </FieldContent>
                <FieldError errors={mapErrors(typedField.state.meta.errors)} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name={getFieldName('lastName')}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const typedField = field as MinimalFieldApi;
            const showError = formFieldErrorVisible(typedField.state.meta.isTouched, typedField.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('lastName.label'))} *</FieldLabel>
                <FieldContent>
                  <Input
                    id={typedField.name}
                    value={typedField.state.value}
                    onChange={(e) => typedField.handleChange(e.target.value)}
                    onBlur={typedField.handleBlur}
                    placeholder={t(getTranslationKey('lastName.placeholder'))}
                    aria-invalid={showError}
                  />
                </FieldContent>
                <FieldError errors={mapErrors(typedField.state.meta.errors)} />
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name={getFieldName('middleName')}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const typedField = field as MinimalFieldApi;
            return (
              <Field className="space-y-2">
                <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('middleName.label'))}</FieldLabel>
                <FieldContent>
                  <Input
                    id={typedField.name}
                    value={typedField.state.value}
                    onChange={(e) => typedField.handleChange(e.target.value)}
                    onBlur={typedField.handleBlur}
                    placeholder={t(getTranslationKey('middleName.placeholder'))}
                  />
                </FieldContent>
              </Field>
            );
          }}
        </form.Field>

        <form.Field name={getFieldName('secondLastName')}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const typedField = field as MinimalFieldApi;
            return (
              <Field className="space-y-2">
                <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('secondLastName.label'))}</FieldLabel>
                <FieldContent>
                  <Input
                    id={typedField.name}
                    value={typedField.state.value}
                    onChange={(e) => typedField.handleChange(e.target.value)}
                    onBlur={typedField.handleBlur}
                    placeholder={t(getTranslationKey('secondLastName.placeholder'))}
                  />
                </FieldContent>
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name={getFieldName('identificationNumber')}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const typedField = field as MinimalFieldApi;
            const showError = formFieldErrorVisible(typedField.state.meta.isTouched, typedField.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('identification.label'))} *</FieldLabel>
                <FieldContent>
                  <Input
                    id={typedField.name}
                    value={typedField.state.value}
                    onChange={(e) => typedField.handleChange(e.target.value)}
                    onBlur={() => {
                      typedField.handleBlur();
                      form.setFieldValue(typedField.name, formatRut(typedField.state.value));
                    }}
                    placeholder={t(getTranslationKey('identification.placeholder'))}
                    aria-invalid={showError}
                    inputMode="text"
                    autoCapitalize="characters"
                  />
                </FieldContent>
                <FieldError errors={mapErrors(typedField.state.meta.errors)} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name={getFieldName('phone')}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const typedField = field as MinimalFieldApi;
            const showError = formFieldErrorVisible(typedField.state.meta.isTouched, typedField.state.meta.errors.length > 0);
            return (
              <Field data-invalid={showError} className="space-y-2">
                <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('phone.label'))} *</FieldLabel>
                <FieldContent>
                  <PhoneInput
                    value={typedField.state.value}
                    onChange={(val) => {
                      typedField.handleChange((val as string) ?? '');
                      typedField.handleBlur();
                    }}
                    placeholder={t(getTranslationKey('phone.placeholder')) as string}
                    defaultCountry="CL"
                  />
                </FieldContent>
                <FieldError errors={mapErrors(typedField.state.meta.errors)} />
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <form.Field name={getFieldName('email')}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => {
          const typedField = field as MinimalFieldApi;
          const showError = formFieldErrorVisible(typedField.state.meta.isTouched, typedField.state.meta.errors.length > 0);
          return (
            <Field data-invalid={showError} className="space-y-2">
              <FieldLabel htmlFor={typedField.name}>{t(getTranslationKey('email.label'))} *</FieldLabel>
              <FieldContent>
                <Input
                  id={typedField.name}
                  type="email"
                  value={typedField.state.value}
                  onChange={(e) => typedField.handleChange(e.target.value)}
                  onBlur={typedField.handleBlur}
                  placeholder={t(getTranslationKey('email.placeholder'))}
                  aria-invalid={showError}
                  autoComplete="email"
                />
              </FieldContent>
              <FieldError errors={mapErrors(typedField.state.meta.errors)} />
            </Field>
          );
        }}
      </form.Field>
    </>
  );
}
