export interface LegalGuardian {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredLanguage: string;
  relation: string | null;
  address: string | null;
  createdAt: string;
}

export interface GetGuardiansResponse {
  guardians: LegalGuardian[];
}

export interface CreateGuardianRequest {
  name: string;
  phone: string;
  email?: string;
  preferred_language?: string;
  relation?: string;
  address?: string;
}

