/**
 * Guardian API endpoints
 */

import { fetchApi } from './client';
import type { GetGuardiansResponse, CreateGuardianRequest, LegalGuardian } from '@/types/guardian';

/**
 * Get all guardians
 */
export async function getGuardians(): Promise<GetGuardiansResponse> {
  return fetchApi<GetGuardiansResponse>('/api/guardians');
}

/**
 * Create a new guardian
 */
export async function createGuardian(data: CreateGuardianRequest): Promise<LegalGuardian> {
  return fetchApi(`/api/guardians`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
