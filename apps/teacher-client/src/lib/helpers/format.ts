/**
 * Formatting utilities for displaying data consistently across the application
 */

export interface PersonName {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
}

/**
 * Formats a person's full name with optional middle and second last name
 * @example
 * formatFullName({ firstName: 'María', middleName: 'José', lastName: 'Martínez', secondLastName: 'López' })
 * // => 'María José Martínez López'
 */
export function formatFullName(person: PersonName): string {
  return [
    person.firstName,
    person.middleName?.trim() ? person.middleName : null,
    person.lastName,
    person.secondLastName?.trim() ? person.secondLastName : null,
  ]
    .filter(Boolean)
    .join(" ");
}
