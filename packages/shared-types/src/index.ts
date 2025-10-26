/**
 * Shared types package for the monorepo
 * These types are used across api-v2 and teacher-client to ensure type consistency
 */

// ============================================================================
// Risk Assessment Types
// ============================================================================

export type RiskLevel = "none" | "low" | "medium" | "high";

export type PatternType = "normal" | "sneak_out" | "chronic" | "irregular";

export type RecommendationType = "none" | "monitor" | "immediate_call";

// ============================================================================
// Attendance Types
// ============================================================================

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

/**
 * AWS Rekognition bounding box coordinates (normalized 0-1)
 */
export interface BoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

// ============================================================================
// Call Types
// ============================================================================

export type CallStatus =
  | "initiated"
  | "ringing"
  | "answered"
  | "voicemail"
  | "failed"
  | "completed";

export type CallInitiatedBy = "manual" | "reasoning-auto";

export interface Call {
  call_id: string;
  student_id: string;
  student_name?: string;
  guardian_name?: string;
  guardian_phone: string;
  initiated_by: CallInitiatedBy;
  risk_level?: RiskLevel;
  status: CallStatus;
  duration?: number;
  dtmf_response?: string;
  transcript?: string;
  recording_url?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// Reasoning Analysis Types
// ============================================================================

export interface ReasoningAnalysis {
  id: string;
  studentId: string;
  sessionId: string;
  riskScore: number; // 0-100
  riskLabel: RiskLevel;
  patternType?: PatternType;
  summary: string;
  recommendation: RecommendationType;
  reasoning?: string;
  confidence?: number; // 0-1
  createdAt: string;
}

// ============================================================================
// Common Entity Types
// ============================================================================

export interface Student {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  identificationNumber: string;
  gradeId?: string | null;
  gradeSectionId?: string | null;
  guardianId: string;
  enrollmentDate: string;
  academicYear?: string | null;
  status?: string | null;
  awsCollectionId?: string | null;
  metadata?: string | null;
  createdAt?: string | null;
}

export interface LegalGuardian {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  identificationNumber: string;
  phone: string;
  email: string;
  preferredLanguage?: string | null;
  relation?: string | null;
  address?: string | null;
  createdAt?: string | null;
}

export interface Teacher {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  email: string;
  phone?: string | null;
  subjects?: string | null;
  department?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request payload for initiating a voice call
 */
export interface VoiceCallRequest {
  student_id: string;
  guardian_id?: string;
  guardianId?: string; // Alternative field name
  guardian_phone: string;
  session_id?: string;
  class_id?: string;
  pattern_type?: string;
  risk_level?: RiskLevel;
}

/**
 * Response from voice call API
 */
export interface VoiceCallResponse {
  call_id?: string;
  conversation_id?: string;
  call_sid?: string;
  status: string;
  message?: string;
}

// ============================================================================
// Form Types (for TanStack Form integration)
// ============================================================================

/**
 * Guardian form field values
 * Used in GuardianFormFields component and anywhere guardian data is collected
 */
export interface GuardianFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationNumber: string;
  phone: string;
  email: string;
  relation?: string;
  address?: string;
}

/**
 * Student form field values
 * Used in student enrollment/creation forms
 */
export interface StudentFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationNumber: string;
  gradeId?: string;
  gradeSectionId?: string;
  enrollmentDate: string;
  academicYear?: string;
}

