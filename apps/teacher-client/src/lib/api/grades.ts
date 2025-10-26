/**
 * Grades and stages API endpoints
 */

import { fetchApi } from "./client";
import type { GetStagesResponse, GetGradesResponse } from "@/types/grade";

/**
 * Get all educational stages
 */
export async function getStages(): Promise<GetStagesResponse> {
  return fetchApi<GetStagesResponse>("/api/grades/stages");
}

/**
 * Get all grades, optionally filtered by stage
 */
export async function getGrades(stageId?: string): Promise<GetGradesResponse> {
  const query = stageId ? `?stage_id=${stageId}` : "";
  return fetchApi<GetGradesResponse>(`/api/grades${query}`);
}
