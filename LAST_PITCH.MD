# EduGuard: Agentes que cuidan la asistencia, en tiempo real

## Problema hoy

- **Tomar asistencia es lento, impreciso y fragmentado**: los avisos a familias se hacen tarde o nunca.
- **Equipos docentes no tienen señales tempranas de riesgo**: llamados manuales consumen horas.
- **Familias reciben información descoordinada** o fuera de contexto.

## Nuestra propuesta

### Tres agentes trabajando juntos, de punta a punta:

- **Agente Visión** (reconocimiento facial): registra asistencia en segundos y reduce errores.
- **Agente Razonamiento** (patrones de asistencia): detecta riesgo (p. ej., "sneak-out", crónico) y prioriza.
- **Agente Voz** (llamadas autónomas): llama al apoderado con voz natural, registra DTMF, transcripción y estado.

### Orquestación automática

Asistencia → análisis → llamada (cuando corresponde) → webhook → tablero docente.

## Valor para cada actor

- **Docente**: menos fricción al pasar lista; alertas claras y priorizadas; historial de llamadas y respuestas en un clic.
- **Escuela**: reducción de inasistencias no justificadas; trazabilidad de comunicaciones; datos para intervención temprana.
- **Quien anota asistencia**: captura rápida con Visión y flujos asistidos; menos digitación y correcciones.
- **Familias**: aviso inmediato, en su idioma, con empatía y opción de responder (DTMF); mejora vínculo escuela–hogar.

---

## Originalidad e Impacto

- **Por qué**: absentismo y deserción parten con señales pequeñas; si actuamos en horas, evitamos meses de daño.
- **Distinto**: un "agente de cuidado" que realmente cierra el ciclo: ve, piensa y actúa por voz.
- **Impacto**: menos ausencias no justificadas, intervención proactiva, mejor experiencia para familias y docentes.

---

## ¿Por qué Agentes de IA? (y no solo código o personas)

### El problema con código tradicional

- **Reglas estáticas**: un script solo puede ejecutar lógica if/else predefinida; no adapta prioridades ni detecta patrones emergentes.
- **Sin contexto acumulado**: no "recuerda" el historial del estudiante ni conecta señales dispersas (ausente + sneak-out + llamada sin respuesta).
- **Escalabilidad limitada**: cada nuevo patrón de riesgo requiere re-programar; no generaliza.

### El problema con procesos manuales

- **Tiempo humano escaso**: docentes y administrativos no pueden revisar 300+ asistencias diarias para detectar micro-patrones.
- **Sesgo y fatiga**: bajo presión, se priorizan casos obvios; señales sutiles (ausentismo intermitente, "sneak-out") pasan desapercibidas.
- **Latencia crítica**: cuando una persona revisa y llama, ya pasaron horas o días; la ventana de intervención se cerró.

### Por qué nuestros agentes de IA son la respuesta

- **Agente Visión**: reconocimiento facial en tiempo real; aprende de correcciones docentes para mejorar precisión por estudiante (personalización).
- **Agente Razonamiento**: combina múltiples señales (asistencia histórica, patrones temporales, contexto de curso) para calcular riesgo; adapta umbrales por perfil.
- **Agente Voz**: conversación natural con empatía; interpreta respuestas (DTMF + transcripción) y ajusta seguimiento; no es un IVR rígido.

### Autonomía real = intervención a tiempo

- **Human-in-the-loop configurable**: el colegio decide qué casos requieren aprobación docente y cuáles se resuelven automáticamente; ante riesgo alto, el agente puede actuar de inmediato (intervención en minutos, no días) o solicitar confirmación.
- **Aprendizaje continuo**: cada llamada, cada corrección de asistencia, cada patrón alimenta la precisión del sistema.
- **Escala sin fricción**: puede analizar y actuar sobre 10 o 10,000 estudiantes con la misma velocidad y consistencia.
- **Interfaz de configuración**: los agentes de IA facilitan crear paneles donde cada colegio ajusta prompts, umbrales de riesgo, tono de voz y reglas de escalamiento sin tocar código; adaptación por contexto local (rural/urbano, niveles educativos).

---

## Profundidad Técnica

### Backend serverless y typed end-to-end

- **Cloudflare Workers** (Hono) + **D1** (Drizzle) + **Durable Object** con contenedor Node para el Agente Voz.
- **ElevenLabs** (outbound call) con variables dinámicas; `userId = guardian_id`; `call_id` propio para trazabilidad.
- **Webhook HMAC** verificado en proxy; reenvío seguro al API; actualización idempotente de llamadas (status, duración, transcript, recording).
- **Shared types** (`packages/shared-types`) para requests/responses; frontend tipado sin drift.
- **Logs estructurados** y agente de decisiones (`agent_logs`) para auditar "por qué llamó".

### Visión como Agente

- Colección por estudiante; pipeline de recorte/subida (S3/Rekognition) ya integrado; preparado para operar en aula con baja latencia.

### Demostrable hoy (sin humo)

- `POST /api/voice/call` → llamada real → webhook → DB → UI (Historial con transcripción y audio).
- `POST /api/reasoning/analyze` → flags de riesgo consumibles por frontend.

---

## Autonomía e Inteligencia del Agente

### Autonomía real

- Razonamiento bulk al cerrar asistencia; si riesgo alto → Agente Voz llama sin intervención.
- El loop se cierra solo vía webhooks (estado, DTMF, transcripción); tablero se actualiza automáticamente.

### Adaptación

- Heurísticas de riesgo configurables (p. ej., "sneak-out"); pronto plug-in de modelos ligeros por curso/estudiante.

### Orquestación

- Tres agentes (Visión, Razonamiento, Voz) con contratos typed; coordinación vía eventos/HTTP y logs de decisiones.

---

## Valor de Uso y Experiencia

### Frontend docente claro

- Alertas por riesgo; botón "Llamar" con un toque; Historial de llamadas con estado, duración, DTMF y transcripción.

### Simplicidad efectiva

- El sistema llama, registra y muestra — sin "ops" manuales.

### Multilenguaje y tono empático

- Mensajería y voz en español; variables contextuales (estudiante, curso, fecha) y respuestas guiadas.

---

## Espíritu del Hackathon / "No BS"

### Construido aquí

- Migraciones D1, endpoints, proxy HMAC, tipos compartidos, UI y logs de producción listos.
- Trazabilidad completa: `call_id` desde el API hasta el webhook; `guardian_id` como `userId` en ElevenLabs.
- Problemas reales resueltos bajo presión (CORS, firmas HMAC, errores de SDK, tipado estricto).

### Iteración visible

- De "llamada manual" a "auto-llamada con cierre por webhook" en menos de 24h, con pruebas en caliente.

---

## Demo (3 minutos)

1. **Tomar asistencia**: Visión/flujo asistido marca ausentes; se dispara Razonamiento.

2. **Flag de alto riesgo** → Agente Voz llama; en vivo: entra el webhook (proxy firma OK) → API actualiza llamada.

3. **Ver en Frontend**: Historial muestra "Completada", duración, DTMF y transcripción; Alertas marcan resuelto.

---

## Por qué ahora

- Infra lista (Workers/ElevenLabs) para escalar por colegio; mucho valor con poca fricción.
- Cada llamada automatizada libera minutos de atención humana que vuelven al aula.

---

## Cierre

**EduGuard transforma asistencia en cuidado activo.** Agentes que ven, piensan y actúan — para que ningún estudiante "desaparezca" en silencio.