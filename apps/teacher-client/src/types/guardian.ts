export interface LegalGuardian {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  identificationNumber: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  relation: string | null;
  address: string | null;
  createdAt: string;
}

export interface GetGuardiansResponse {
  guardians: LegalGuardian[];
}

export interface GuardianProfileDetails {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationNumber: string;
  phone: string;
  email: string;
  preferredLanguage?: string;
  relation?: string;
  address?: string;
}

export type GuardianProfileInput =
  | ({ id: string } & Partial<
      Omit<GuardianProfileDetails, "firstName" | "lastName" | "identificationNumber" | "phone">
    >)
  | GuardianProfileDetails;

export type CreateGuardianRequest = GuardianProfileDetails;
