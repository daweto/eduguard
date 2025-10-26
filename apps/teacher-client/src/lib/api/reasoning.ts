/**
 * Reasoning API client
 * Handles risk assessment and flagged students
 */

import { fetchApi } from "./client";
import type { ReasoningFlagsResponse } from "@repo/shared-types";

/**
 * Get flagged students (risk assessments)
 * @param from - Start date for filtering (ISO string or undefined for today)
 * @param to - End date for filtering (ISO string or undefined for today)
 */
export async function getReasoningFlags(
  from?: string,
  to?: string,
): Promise<ReasoningFlagsResponse> {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/api/reasoning/flags?${queryString}`
    : "/api/reasoning/flags";

  return fetchApi<ReasoningFlagsResponse>(endpoint);
}
