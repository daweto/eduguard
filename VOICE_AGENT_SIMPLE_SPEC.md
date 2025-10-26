# 📞 Voice Agent: Natural Conversational Absence Notification

## Core Use Case

**Problem:** Student is absent, no excuse received, parent may not know.

**Solution:** **Natural Spanish conversation** (not robotic!) via ElevenLabs Conversational AI.

## 🗣️ KEY: This is a REAL Conversation

**NOT this:** ❌ "Press 1 for yes, press 2 for no" (robotic IVR)

**THIS:** ✅ Natural human-like conversation where parent SPEAKS and AI understands

---

## When Voice Agent Triggers

### Automatic Trigger Conditions (All must be true):

```typescript
const shouldCallParent =
  studentAbsent === true &&              // Not detected in any class
  hasExcuseNote === false &&             // No excuse/note on file
  currentTime > schoolStartTime + 60min  // After 9 AM (1 hour buffer)
  alreadyCalledToday === false;          // Haven't called yet today
```

### Manual Trigger (Teacher Override):

Teacher can click "Call Parent" button to immediately notify regardless of above conditions.

---

## Call Flow (Natural Spanish Conversation)

### Conversational Script (AI adapts naturally)

```
[PHONE RINGS]

Agent (natural Spanish voice):
"Hola, buenos días. Soy el asistente virtual del Colegio San José.
¿Hablo con [GUARDIAN_NAME]?"

Parent: "Sí, soy yo." / "Sí." / "Habla."

Agent:
"Le llamo para informarle que [STUDENT_NAME] no ha asistido a
clases hoy. ¿Está usted al tanto de esta situación?"

Parent: "Sí, está enfermo en casa." / "Sí, tiene cita médica."
  ↓
  Agent:
  "Perfecto, gracias por confirmar. Registraremos la ausencia como
   justificada. ¿Hay algo más que deba saber?"

  Parent: "No, eso es todo."

  Agent: "Muchas gracias. Que se mejore pronto. Que tenga buen día."

OR

Parent: "¿Qué? ¡No sabía!" / "No tenía idea!" / "¿Cómo?"
  ↓
  Agent:
  "Entiendo su preocupación. Su hijo/a no fue detectado en ninguna
   clase hoy. Un administrador del colegio se pondrá en contacto con
   usted inmediatamente para dar seguimiento a esta situación.
   ¿Tiene alguna pregunta?"

  Parent: "No, voy a buscar a mi hijo ahora mismo."

  Agent: "Por favor manténganos informados. Gracias."

OR

Parent doesn't answer / Voicemail:
  ↓
  Agent leaves message:
  "Hola, soy el asistente del Colegio San José. Le informamos que
   [STUDENT_NAME] no asistió hoy. Por favor contacte al colegio al
   [PHONE]. Gracias."

[CALL ENDS]
```

### Timing

- Total call duration: **30-90 seconds** (natural conversation)
- AI responds in real-time to parent's speech
- No DTMF keypresses needed - **just talk naturally**
- Maximum call duration: 3 minutes

---

## Response Handling (Natural Language Understanding)

### Scenario 1: Parent Aware - Justified

**Parent says:** "Sí, está enfermo" / "Tiene cita médica" / "Está en casa conmigo"

```typescript
{
  status: "aware",
  parent_response: "justified_absence",
  excuse_type: "illness" | "medical_appointment" | "family_matter",
  action_needed: "none",
  sentiment: "calm",
  transcript: "Sí, está enfermo en casa."
}
```

**System Actions:**

1. ✅ Mark absence as "excused"
2. ✅ Log parent confirmation with transcript
3. ✅ No further action needed
4. 📝 Record excuse reason from conversation

### Scenario 2: Parent Unaware - URGENT

**Parent says:** "¿Qué? ¡No sabía!" / "¿Cómo que no está?" / "¡Imposible!"

```typescript
{
  status: "unaware",
  parent_response: "shocked" | "concerned" | "alarmed",
  excuse_provided: false,
  action_needed: "immediate_admin_follow_up",
  sentiment: "alarmed",
  urgency_level: "high",
  transcript: "¿Qué? ¡No tenía idea!"
}
```

**System Actions:**

1. 🚨 Create URGENT alert for school admin
2. 📧 Send immediate email to admin + principal
3. 📱 Flag as potential **safety emergency**
4. ⚠️ Activate safety protocol (check security cameras, etc.)
5. 🔔 Push notification to school security

### Scenario 3: Parent Says Will Handle

**Parent says:** "Voy a buscarlo ahora" / "Voy para allá" / "Me ocupo inmediatamente"

```typescript
{
  status: "parent_taking_action",
  parent_response: "will_retrieve_student",
  action_needed: "monitor",
  sentiment: "concerned_proactive",
  transcript: "Voy a buscarlo ahora mismo."
}
```

**System Actions:**

1. ⏰ Log parent taking action
2. 📋 Notify admin for monitoring
3. ✅ No additional intervention unless parent doesn't follow up

### Scenario 4: Parent Questions/Confused

**Parent says:** "¿Está seguro?" / "Debe ser un error" / "Él salió esta mañana"

```typescript
{
  status: "parent_disputing",
  parent_response: "questioning",
  action_needed: "verify_and_callback",
  sentiment: "confused",
  transcript: "¿Está seguro? Él salió de casa esta mañana."
}
```

**System Actions:**

1. 🔍 Double-check attendance records
2. 📞 Admin calls back with details
3. 📸 Review attendance photos for verification

### Scenario 5: No Answer / Voicemail

```typescript
{
  status: "no_answer",
  excuse_provided: false,
  action_needed: "retry_later",
  voicemail_left: true
}
```

**System Actions:**

1. 🎙️ Leave voicemail message
2. ⏰ Schedule retry call in 2 hours
3. 📧 Send email notification as backup
4. 📋 Try alternate contact

---

## API Implementation

### Endpoint: `POST /api/voice/notify-absence`

```typescript
app.post("/notify-absence", async (c) => {
  const { student_id } = await c.req.json();

  // 1. Check if should call
  const shouldCall = await checkCallCriteria(student_id);
  if (!shouldCall.eligible) {
    return c.json({
      skipped: true,
      reason: shouldCall.reason,
    });
  }

  // 2. Get student & guardian info
  const student = await getStudent(student_id);
  const guardian = await getGuardian(student.guardian_id);

  // 3. Build Spanish prompt
  const prompt = buildAbsenceNotificationPrompt(student.name, guardian.name);

  // 4. Initiate call
  const client = new ElevenLabsClient({
    apiKey: c.env.ELEVENLABS_API_KEY,
  });

  const call = await client.conversationalAi.call({
    agentId: c.env.ELEVENLABS_AGENT_ID,
    phoneNumber: guardian.phone,
    systemPrompt: prompt,
  });

  // 5. Log call
  await db.insert(calls).values({
    id: generateId(),
    student_id,
    call_id: call.call_id,
    initiated_at: new Date().toISOString(),
    status: "in_progress",
    reason: "unexcused_absence",
  });

  return c.json({
    call_id: call.call_id,
    status: "initiated",
    student_name: student.name,
    guardian_phone: guardian.phone,
  });
});
```

### Endpoint: `POST /api/voice/webhook/call-completed`

```typescript
app.post("/webhook/call-completed", async (c) => {
  const { call_id, dtmf_input, duration, status } = await c.req.json();

  // 1. Get call record
  const call = await db
    .select()
    .from(calls)
    .where(eq(calls.call_id, call_id))
    .limit(1);

  // 2. Interpret response
  const interpretation = interpretDTMF(dtmf_input);

  // 3. Update database
  await db
    .update(calls)
    .set({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
      dtmf_response: dtmf_input,
      parent_aware: interpretation.parent_aware,
    })
    .where(eq(calls.call_id, call_id));

  // 4. Take action based on response
  if (interpretation.urgent) {
    await createAdminAlert({
      type: "URGENT",
      student_id: call[0].student_id,
      message: "Parent unaware of absence - immediate follow-up required",
    });
  }

  if (interpretation.mark_excused) {
    await markAbsenceExcused(call[0].student_id);
  }

  return c.json({ processed: true });
});

function interpretDTMF(input: string | null) {
  switch (input) {
    case "1":
      return {
        parent_aware: true,
        mark_excused: true,
        urgent: false,
        action: "Mark as excused",
      };
    case "2":
      return {
        parent_aware: false,
        mark_excused: false,
        urgent: true,
        action: "Alert administrator",
      };
    default:
      return {
        parent_aware: null,
        mark_excused: false,
        urgent: false,
        action: "Schedule retry",
      };
  }
}
```

---

## Database Schema Addition

### Calls Table (Already exists, ensure these fields):

```sql
CREATE TABLE calls (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  initiated_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL, -- 'initiated' | 'in_progress' | 'completed' | 'failed'
  reason TEXT NOT NULL, -- 'unexcused_absence' | 'sneak_out' | 'manual'
  dtmf_response TEXT,   -- '1' | '2' | null
  parent_aware BOOLEAN, -- true (code 1) | false (code 2) | null (no answer)
  duration_seconds INTEGER,
  recording_url TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### Excuses Table (New):

```sql
CREATE TABLE absence_excuses (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  submitted_by TEXT NOT NULL, -- 'parent' | 'teacher' | 'admin'
  submitted_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

---

## Frontend Integration

### Admin Dashboard Alert

```typescript
// When parent presses "2" (unaware)
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>🚨 URGENT: Parent Unaware</AlertTitle>
  <AlertDescription>
    Sofia Martinez's parent was not aware of today's absence.
    Call completed at 9:31 AM. Response: Code 2 (Unaware).
    <Button onClick={() => followUp(studentId)} className="mt-2">
      Follow Up Now
    </Button>
  </AlertDescription>
</Alert>
```

### Teacher View (Manual Trigger)

```typescript
// In attendance results for absent students
{student.status === 'absent' && !student.has_excuse && (
  <Button
    variant="outline"
    onClick={() => callParent(student.id)}
  >
    <Phone className="h-4 w-4 mr-2" />
    Llamar Apoderado
  </Button>
)}
```

---

## ElevenLabs Agent Configuration

### Agent Setup (Dashboard)

1. **Name:** "EduGuard Absence Notifier"
2. **Language:** Spanish (es-ES or es-MX)
3. **Voice:** Professional female Spanish voice (clear, calm)
4. **First Message:** Dynamic (built from prompt)
5. **DTMF Enabled:** YES
6. **DTMF Timeout:** 10 seconds
7. **Max Duration:** 2 minutes
8. **Voicemail Detection:** YES

### System Prompt Template (Natural Conversation)

```
Eres un asistente virtual de asistencia escolar del Colegio San José.
Hablas español de forma natural y profesional.

CONTEXTO:
- Estudiante: {student_name}
- Apoderado: {guardian_name}
- Fecha: {today_date}
- Situación: El estudiante no asistió a clases hoy y no hay justificación registrada

OBJETIVO DE LA LLAMADA:
1. Notificar al apoderado sobre la ausencia
2. Verificar si el apoderado está al tanto
3. Determinar si la ausencia está justificada

FLUJO DE CONVERSACIÓN:

APERTURA:
- Saluda cordialmente según la hora (buenos días/tardes)
- Identifícate como asistente del colegio
- Confirma que hablas con el apoderado de {student_name}

NOTIFICACIÓN:
- Informa que {student_name} no ha asistido a clases hoy
- Pregunta de forma natural: "¿Está usted al tanto de esta ausencia?"

ESCUCHA Y RESPONDE SEGÚN EL CASO:

Si el apoderado confirma que está al tanto:
  - Pregunta brevemente el motivo (enfermedad, cita, etc.)
  - Confirma que registrarás la ausencia como justificada
  - Agradece y despídete

Si el apoderado NO sabía de la ausencia:
  - Mantén la calma (no alarmes)
  - Informa que un administrador contactará pronto
  - Ofrece el número del colegio si quiere llamar
  - Despídete profesionalmente

Si el apoderado cuestiona o disputa:
  - Escucha con empatía
  - Confirma que verificarás la información
  - Ofrece que el administrador llamará con detalles
  - Mantén tono profesional

CIERRE:
- Agradece el tiempo
- Despídete cordialmente
- Máximo 2 minutos de llamada total

TONO Y ESTILO:
- Habla como una persona real, no como robot
- Profesional pero amable y cálida
- Clara y directa, sin rodeos innecesarios
- NO alarmista ni dramático
- Respetuosa del tiempo del padre
- Empática si el padre se preocupa
- Tranquilizadora pero seria

IMPORTANTE:
- Esta es una CONVERSACIÓN NATURAL
- El apoderado HABLA libremente, no presiona botones
- Escucha y adapta tus respuestas a lo que dicen
- No uses menús de opciones ni "presione 1, presione 2"
- Habla en español chileno natural
- Duración ideal: 60-90 segundos
- Enfócate solo en la ausencia de HOY
```

---

## Testing Checklist

### Before Production:

- [ ] Test with your own phone number
- [ ] Verify Spanish pronunciation is clear
- [ ] Test DTMF code 1 response
- [ ] Test DTMF code 2 response
- [ ] Test no-response timeout
- [ ] Verify webhook receives data correctly
- [ ] Test database updates work
- [ ] Test admin alert creation
- [ ] Verify excuse marking works
- [ ] Test retry scheduling

### Test Call Script:

```bash
curl -X POST http://localhost:3001/api/voice/notify-absence \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-student-123",
    "student_name": "Test Student",
    "guardian_name": "Test Parent",
    "guardian_phone": "+56YOUR_PHONE_NUMBER"
  }'
```

---

## Success Metrics

### Week 1 Goals:

- [ ] 100% of unexcused absences trigger calls
- [ ] <1% failed call rate
- [ ] > 90% parents respond to DTMF
- [ ] <30 second average call duration

### Impact Metrics:

- **Before:** Parents notified 1-3 days later via email
- **After:** Parents notified within 90 minutes via call
- **Result:** Parents aware same-day, can intervene immediately

---

## Future Enhancements (Post-Hackathon)

1. **Multi-language support** (English + Spanish)
2. **SMS fallback** if call fails
3. **Voicemail message** if no answer
4. **Alternate contact** if primary doesn't answer
5. **Smart scheduling** (don't call during work hours)
6. **Call recording playback** in admin dashboard

---

**This is the MVP voice agent - simple, focused, high-impact.** 🎯
