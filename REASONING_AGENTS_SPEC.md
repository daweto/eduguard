# 🧠 Multi-Agent Reasoning System Specification

## Architecture Overview

Instead of a single monolithic reasoning agent, EduGuard uses **4 specialized reasoning agents** that run in parallel, each detecting a specific attendance pattern.

```
                    Student Attendance Data
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   Reasoning Agent Orchestrator         │
        │   (Parallel Execution)                 │
        └────────────┬───────────────────────────┘
                     │
         ┌───────────┼───────────┬───────────┐
         ▼           ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
    │Agent2.1│  │Agent2.2│  │Agent2.3│  │Agent2.4│
    │Truancy │  │Sneak-  │  │Class-  │  │Predict-│
    │Detector│  │Out     │  │Cutting │  │ive Risk│
    └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘
         │           │           │           │
         └───────────┴───────────┴───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Risk Consolidator     │
         │ (Determines overall   │
         │  risk & notification) │
         └───────────────────────┘
```

---

## Agent 2.1: Truancy Detector 🔍

### Purpose
Detect chronic absenteeism and unauthorized absence patterns over time.

### Detection Logic
- **Chronic Truancy**: Absent 3+ full days in past 7 days
- **Severe Truancy**: Absent 5+ days in past 14 days
- **Pattern Truancy**: Absent every Monday/Friday (pattern avoidance)

### Input Data
```typescript
{
  student_id: string;
  student_name: string;
  last_30_days: Array<{
    date: string;
    total_classes: number;
    attended_classes: number;
    absent_classes: number;
  }>;
}
```

### Output Schema
```typescript
{
  is_truant: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  days_absent_week: number;
  days_absent_month: number;
  pattern_detected: "none" | "weekday_specific" | "random" | "consecutive";
  risk_level: "none" | "low" | "medium" | "high";
  reasoning: string;
  recommended_action: "none" | "monitor" | "parent_meeting" | "intervention";
}
```

### Example Prompt
```
You are a truancy detection specialist. Analyze this student's attendance:

STUDENT: Sofia Martinez
LAST 7 DAYS:
- Monday: Absent (0/6 classes)
- Tuesday: Present (6/6 classes)
- Wednesday: Absent (0/6 classes)
- Thursday: Present (5/6 classes)
- Friday: Absent (0/6 classes)

LAST 30 DAYS:
- Total days: 20 school days
- Days fully present: 13
- Days fully absent: 7
- Partial days: 0

CRITERIA:
- Chronic: 3+ full-day absences in 7 days
- Severe: 5+ full-day absences in 14 days
- Pattern: Consistent weekday absence (e.g., always Monday)

Assess truancy risk and recommend action.
```

---

## Agent 2.2: Sneak-Out Detector 🏃

### Purpose
Detect mid-day departures where student is present early, then disappears.

### Detection Logic
- **Classic Sneak-Out**: Present Period 1, absent Periods 2-3+
- **Lunch Departure**: Present morning, absent afternoon
- **Late Arrival Skip**: Absent Period 1, present Periods 2-3

### Input Data
```typescript
{
  student_id: string;
  student_name: string;
  today_attendance: Array<{
    period: number;
    class_name: string;
    time: string;
    status: "present" | "absent";
    confidence?: number;
  }>;
  yesterday_attendance?: Array<...>; // For pattern detection
}
```

### Output Schema
```typescript
{
  is_sneakout: boolean;
  sneak_type: "none" | "morning_departure" | "lunch_departure" | "late_arrival";
  present_periods: number[];
  absent_periods: number[];
  estimated_departure_time: string | null;
  risk_level: "none" | "low" | "medium" | "high";
  reasoning: string;
  urgency: "none" | "routine" | "immediate";
}
```

### Example Prompt
```
You are a sneak-out detection specialist. Analyze TODAY's attendance:

STUDENT: Sofia Martinez
DATE: 2025-10-26
TODAY'S SCHEDULE:

Period 1 (8:00-8:50): English - PRESENT (confidence: 99.2%)
Period 2 (9:00-9:50): Math - ABSENT
Period 3 (10:00-10:50): Science - ABSENT
Period 4 (11:00-11:50): History - ABSENT
Lunch (12:00-12:30): N/A
Period 5 (12:30-1:20): PE - ABSENT
Period 6 (1:30-2:20): Art - ABSENT

DETECTION CRITERIA:
- Sneak-Out: Present in early periods, absent in later periods same day
- Urgency: If detected mid-day, parent should be notified immediately
- Pattern: Check if this is recurring behavior

Determine if this is a sneak-out and assess urgency.
```

---

## Agent 2.3: Class-Cutting Detector ✂️

### Purpose
Detect selective absence where student skips specific classes but attends others.

### Detection Logic
- **Targeted Cutting**: High absence rate for 1-2 specific classes
- **Subject Avoidance**: Skips all Math or all Science classes
- **Teacher Avoidance**: Skips classes with specific teacher

### Input Data
```typescript
{
  student_id: string;
  student_name: string;
  by_class_data: Array<{
    class_id: string;
    class_name: string;
    teacher_name: string;
    total_sessions: number;
    attended: number;
    absent: number;
    attendance_rate: number;
  }>;
  overall_attendance_rate: number;
}
```

### Output Schema
```typescript
{
  is_cutting: boolean;
  cut_type: "none" | "class_specific" | "subject_specific" | "teacher_specific";
  targeted_classes: string[];
  targeted_subjects: string[];
  attendance_rate_by_class: Record<string, number>;
  worst_attendance_class: {
    class_name: string;
    rate: number;
  } | null;
  risk_level: "none" | "low" | "medium" | "high";
  reasoning: string;
  intervention_suggestion: string;
}
```

### Example Prompt
```
You are a class-cutting detection specialist. Analyze this student's attendance by class:

STUDENT: Sofia Martinez
OVERALL ATTENDANCE: 85%

BY CLASS:
- English (Mrs. Smith): 28/30 sessions = 93%
- Math (Mr. Johnson): 18/30 sessions = 60% ⚠️
- Science (Dr. Lee): 26/30 sessions = 87%
- History (Ms. Garcia): 29/30 sessions = 97%
- PE (Coach Martinez): 30/30 sessions = 100%
- Art (Ms. Brown): 21/30 sessions = 70% ⚠️

DETECTION CRITERIA:
- Class-Cutting: Attendance rate 20%+ below overall average for specific class
- Subject Pattern: Multiple classes of same subject (e.g., all Math classes)
- Teacher Pattern: Multiple classes with same teacher

Determine if student is cutting specific classes and why.
```

---

## Agent 2.4: Predictive Risk Agent 🔮

### Purpose
Predict future truancy risk based on trends and early warning signs.

### Detection Logic
- **Declining Trend**: Attendance rate dropping over time
- **Early Warning**: Small changes that predict future problems
- **Seasonal Patterns**: Attendance changes by month/season

### Input Data
```typescript
{
  student_id: string;
  student_name: string;
  trend_data: {
    month_1: { rate: number; absences: number };
    month_2: { rate: number; absences: number };
    month_3: { rate: number; absences: number };
  };
  risk_factors: {
    recent_family_changes: boolean;
    academic_struggles: boolean;
    peer_issues: boolean;
    previous_truancy_history: boolean;
  };
}
```

### Output Schema
```typescript
{
  future_risk: "none" | "low" | "medium" | "high";
  trend: "improving" | "stable" | "declining" | "rapidly_declining";
  trend_percentage_change: number;
  early_warning_signs: string[];
  intervention_needed: boolean;
  intervention_timing: "none" | "within_week" | "within_month" | "monitor";
  reasoning: string;
  predicted_outcome_30days: string;
}
```

### Example Prompt
```
You are a predictive risk assessment specialist. Analyze attendance trends:

STUDENT: Sofia Martinez
ATTENDANCE TREND (3 months):

Month 1 (Sept): 95% attendance (2 absences)
Month 2 (Oct): 87% attendance (5 absences) ↓
Month 3 (Nov): 80% attendance (8 absences) ↓

TREND: Declining (-15% over 3 months)

RISK FACTORS:
- Recent family changes: No
- Academic struggles: Yes (Math grade dropped)
- Peer issues: Unknown
- Previous truancy: No history

DETECTION CRITERIA:
- High Risk: >10% decline in 3 months
- Medium Risk: 5-10% decline
- Early Warning: Consistent small declines

Predict future truancy risk and recommend intervention timing.
```

---

## Consolidated Risk Assessment

### Risk Consolidation Logic

```typescript
function consolidateRisk(agents: {
  truancy: TruancyResult;
  sneakout: SneakOutResult;
  cutting: ClassCuttingResult;
  predictive: PredictiveResult;
}) {
  // Highest risk wins
  const riskLevels = [
    agents.truancy.risk_level,
    agents.sneakout.risk_level,
    agents.cutting.risk_level,
    agents.predictive.future_risk,
  ];

  const maxRisk = getHighestRisk(riskLevels);

  // Determine notification urgency
  const urgency = 
    agents.sneakout.is_sneakout && agents.sneakout.urgency === "immediate"
      ? "immediate"
      : agents.truancy.severity === "severe"
      ? "urgent"
      : maxRisk === "high"
      ? "high_priority"
      : "routine";

  // Build comprehensive reasoning
  const activePatterns = [];
  if (agents.truancy.is_truant) activePatterns.push("chronic_truancy");
  if (agents.sneakout.is_sneakout) activePatterns.push("sneak_out");
  if (agents.cutting.is_cutting) activePatterns.push("class_cutting");
  if (agents.predictive.intervention_needed) activePatterns.push("declining_trend");

  return {
    overall_risk: maxRisk,
    urgency,
    active_patterns: activePatterns,
    should_notify: maxRisk === "high" || urgency === "immediate",
    primary_concern: determinePrimaryConcern(agents),
    detailed_analysis: {
      truancy: agents.truancy,
      sneakout: agents.sneakout,
      cutting: agents.cutting,
      predictive: agents.predictive,
    },
    recommended_actions: generateActions(agents, urgency),
  };
}
```

---

## Implementation Example

```typescript
// apps/ai-agents/src/routes/reasoning.ts

import { Hono } from 'hono';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const app = new Hono();

// Schemas (defined above)
const TruancySchema = z.object({ /* ... */ });
const SneakOutSchema = z.object({ /* ... */ });
const ClassCuttingSchema = z.object({ /* ... */ });
const PredictiveSchema = z.object({ /* ... */ });

app.post('/analyze', async (c) => {
  const { student_data, attendance_history } = await c.req.json();

  console.log(`🧠 Running 4 reasoning agents in parallel...`);

  // Execute all agents in parallel (3 seconds total, not 12!)
  const [truancy, sneakout, cutting, predictive] = await Promise.all([
    detectTruancy(attendance_history),
    detectSneakOut(student_data.today),
    detectClassCutting(student_data.by_class),
    assessPredictiveRisk(student_data.trends),
  ]);

  // Consolidate results
  const consolidated = consolidateRisk({
    truancy: truancy.object,
    sneakout: sneakout.object,
    cutting: cutting.object,
    predictive: predictive.object,
  });

  console.log(`   ✅ Analysis complete: ${consolidated.overall_risk} risk`);
  console.log(`   📊 Active patterns: ${consolidated.active_patterns.join(', ')}`);

  return c.json(consolidated);
});

async function detectTruancy(history: any) {
  return generateObject({
    model: openai('gpt-4o-mini'),
    schema: TruancySchema,
    prompt: buildTruancyPrompt(history),
  });
}

async function detectSneakOut(todayData: any) {
  return generateObject({
    model: openai('gpt-4o-mini'),
    schema: SneakOutSchema,
    prompt: buildSneakOutPrompt(todayData),
  });
}

async function detectClassCutting(byClassData: any) {
  return generateObject({
    model: openai('gpt-4o-mini'),
    schema: ClassCuttingSchema,
    prompt: buildClassCuttingPrompt(byClassData),
  });
}

async function assessPredictiveRisk(trends: any) {
  return generateObject({
    model: openai('gpt-4o-mini'),
    schema: PredictiveSchema,
    prompt: buildPredictivePrompt(trends),
  });
}

export default app;
```

---

## Benefits of Multi-Agent Approach

### 1. Specialization
Each agent is an expert in ONE pattern type:
- Better prompts (specific, not generic)
- More accurate detection
- Clearer reasoning

### 2. Parallel Execution
- All 4 agents run simultaneously
- Total time: ~3 seconds (same as single agent)
- 4x more analysis in same time

### 3. Comprehensive Coverage
Single agent might miss patterns:
- ❌ "Student has medium risk" (vague)
- ✅ "High sneak-out risk + declining trend + cutting Math" (specific)

### 4. Explainability
- Each agent provides specific reasoning
- Teachers understand WHY student is flagged
- Easier to dispute false positives

### 5. Flexibility
- Can disable agents (e.g., turn off predictive for new students)
- Can adjust thresholds per agent
- Can add new agents without changing existing ones

---

## Demo Narrative

**Judges:** "How does your reasoning work?"

**You:** "Instead of one AI trying to do everything, we have 4 specialized agents:

1. **Truancy Detector** - Checks if Sofia has chronic absence (she doesn't)
2. **Sneak-Out Detector** - Sees she was here Period 1, gone Period 2 → HIGH RISK
3. **Class-Cutting Detector** - No selective pattern detected
4. **Predictive Agent** - Her attendance is declining 15% over 3 months → WARNING

All 4 run in parallel in 3 seconds. The system sees BOTH the immediate sneak-out AND the concerning trend. That's why it flags her as high-priority immediate notification.

A single agent might miss the trend. Our multi-agent system catches everything."

---

**Built for comprehensive student safety monitoring** 🛡️

