/**
 * Centralized Query Keys
 * Following React Query best practices for consistent cache key management
 */

export const queryKeys = {
  // Students
  students: ["students"] as const,
  student: (id: string) => ["students", id] as const,

  // Guardians (Legal Guardians)
  guardians: ["guardians"] as const,
  guardian: (id: string) => ["guardians", id] as const,

  // Grades and Stages
  stages: ["stages"] as const,
  grades: ["grades"] as const,
  gradeGroups: ["grade-groups"] as const,

  // Reasoning / Alerts
  reasoningFlags: (from?: string, to?: string) =>
    ["reasoning", "flags", { from, to }] as const,

  // Voice Calls
  voiceCalls: ["voice", "calls"] as const,
  voiceCall: (id: string) => ["voice", "calls", id] as const,
} as const;
