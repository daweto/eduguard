/**
 * Shared types package for the monorepo
 * These types are used across api-v2 and teacher-client to ensure type consistency
 */

// ============================================================================
// Risk Assessment Types
// ============================================================================

export type RiskLevel = "none" | "low" | "medium" | "high";

export type PatternType =
  | "normal"
  | "sneak_out"
  | "chronic"
  | "irregular"
  | "cutting";

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

export interface ReasoningAnalysisInput {
  studentId: string;
  sessionId: string;
  riskScore: number; // 0-100
  riskLabel: RiskLevel;
  patternType?: PatternType;
  summary: string;
  recommendation: RecommendationType;
  reasoning?: string;
  confidence?: number; // 0-1
  detectedBy?: string[];
}

export interface ReasoningAnalysis extends ReasoningAnalysisInput {
  id: string;
  createdAt: string;
}

export interface ReasoningFlagView extends ReasoningAnalysis {
  studentName: string;
  identification: string;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
}

// ============================================================================
// Reasoning request/response for AI Agents
// ============================================================================

export interface AttendanceRecord {
  date: string;
  period?: number;
  status: string;
  classId?: string;
  className?: string;
  confidence?: number | null;
}

export interface ReasoningBulkAbsentItem {
  student_id: string;
  name: string;
  guardian_id?: string;
  guardian_phone?: string;
}

export interface ReasoningBulkAnalyzeRequest {
  session_id: string;
  absent: ReasoningBulkAbsentItem[];
}

export interface ReasoningAnalyzeSingleRequest {
  student_id: string;
  student_name: string;
  session_id: string;
  today_attendance: AttendanceRecord[];
  history_7d: AttendanceRecord[];
}

export interface RiskAssessmentObject {
  risk_level: RiskLevel;
  pattern_type: PatternType;
  confidence: number; // 0-1
  should_notify: boolean;
  reasoning: string;
  recommended_action: RecommendationType;
}

export interface ReasoningAnalyzeSingleResponse {
  student_id: string;
  student_name: string;
  session_id: string;
  analysis: RiskAssessmentObject;
  analyzed_at: string;
  stats: {
    total_records: number;
    absent_count: number;
    absent_rate: number;
  };
}

export interface ReasoningBatchAnalyzeResponse {
  session_id: string;
  total: number;
  successful: number;
  failed: number;
  results: unknown[];
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
 * Request payload for initiating a voice call (API gateway)
 */
export interface VoiceCallInitiateRequest {
  student_id: string;
  guardian_id: string;
  guardian_phone: string;
  session_id?: string;
  class_id?: string;
  pattern_type?: PatternType;
  risk_level?: RiskLevel;
  reason?: string;
  initiated_by?: CallInitiatedBy;
  // Optional extra context; API may forward to agent
  student_name?: string;
  guardian_name?: string;
}

export type VoiceCallRequest = VoiceCallInitiateRequest;

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

export interface VoiceCallRecord {
  id: string;
  studentId: string;
  guardianId: string;
  guardianPhone: string;
  sessionId?: string | null;
  classId?: string | null;
  initiatedBy: CallInitiatedBy;
  riskLevel?: RiskLevel | null;
  status: CallStatus;
  dtmfResponse?: string | null;
  transcript?: string | null;
  recordingUrl?: string | null;
  duration?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Standard API list/detail envelopes
export interface VoiceCallsListResponse {
  total: number;
  calls: Call[];
}

export interface VoiceCallGetResponse {
  call: Call;
}

export interface ReasoningLogResponse {
  id: string;
}

export interface ReasoningFlagsResponse {
  total: number;
  flags: ReasoningFlagView[];
}

// ============================================================================
// Webhooks & Agent Logs
// ============================================================================

export interface ElevenLabsPostCallEvent {
  type: "post_call_transcription";
  event_timestamp: number;
  data: {
    agent_id: string;
    conversation_id: string;
    status: string;
    transcript: Array<{
      role: "agent" | "user";
      message: string;
      time_in_call_secs?: number;
    }>;
    metadata?: Record<string, unknown>;
    analysis?: Record<string, unknown>;
    conversation_initiation_client_data?: Record<string, unknown>;
  };
}

export type Agent = "vision" | "reasoning" | "voice";
export type DecisionType = "score" | "auto_call" | "skip_call" | "manual_call";

export interface AgentDecisionLog {
  id: string;
  agent: Agent;
  decisionType: DecisionType;
  sessionId?: string;
  studentId?: string;
  callId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// AI-Agents specific request/response shapes
// ============================================================================

export interface VoiceAgentCallRequest {
  student_id: string;
  student_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_id?: string;
  call_id?: string;
  risk_level: RiskLevel;
  pattern_type: PatternType | "manual";
  reasoning?: string;
  class_name?: string;
  time?: string;
}

export interface VoiceAgentCallData {
  call_id: string;
  conversation_id: string | null;
  call_sid: string | null;
  student_id: string;
  student_name: string;
  guardian_name: string;
  guardian_phone: string;
  risk_level: RiskLevel | string;
  pattern_type: PatternType | "manual" | string;
  status: string;
  initiated_at: string;
  updated_at?: string;
  completed_at?: string;
  duration?: number;
  dtmf_response?: string;
  transcript?: string;
  outcome?: string;
}

export interface WebhookCallCompletedPayload {
  call_id: string;
  conversation_id: string;
  status: string;
  duration: number;
  dtmf_input: string;
  transcript: string;
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
