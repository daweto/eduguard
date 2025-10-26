import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClassValue } from "clsx";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface CallParentButtonProps {
  studentId: string;
  studentName: string;
  guardianPhone?: string;
  guardianName?: string;
  guardianId?: string;
  sessionId?: string;
  riskLevel?: string;
  className?: ClassValue;
}

export function CallParentButton({
  studentId,
  studentName,
  guardianPhone,
  guardianName,
  guardianId,
  sessionId,
  riskLevel = "medium",
  className,
}: CallParentButtonProps) {
  const [isCalling, setIsCalling] = useState(false);

  const handleCall = async () => {
    if (!guardianPhone) {
      toast.error("No se encontró teléfono del apoderado");
      return;
    }
    if (!guardianId) {
      toast.error("No se encontró ID del apoderado");
      return;
    }

    setIsCalling(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/voice/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId,
          guardian_id: guardianId,
          student_name: studentName,
          guardian_name: guardianName || "Apoderado",
          guardian_phone: guardianPhone,
          risk_level: riskLevel,
          pattern_type: "manual",
          reasoning: `Llamada manual iniciada por el profesor para ${studentName}`,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al iniciar la llamada");
      }

      const result = await response.json();

      toast.success(
        <div>
          <div className="font-semibold">Llamada iniciada</div>
          <div className="text-sm text-muted-foreground">
            Llamando a {guardianName || "apoderado"} ({guardianPhone})
          </div>
        </div>,
      );

      console.log("Call initiated:", result);
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error(
        <div>
          <div className="font-semibold">Error al llamar</div>
          <div className="text-sm">
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        </div>,
      );
    } finally {
      setIsCalling(false);
    }
  };

  // Disable if no guardian phone
  const isDisabled = !guardianPhone || isCalling;

  return (
    <Button
      onClick={handleCall}
      disabled={isDisabled}
      size="sm"
      variant="outline"
      className={cn("gap-2", className)}
    >
      {isCalling ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Llamando...
        </>
      ) : (
        <>
          <Phone className="h-4 w-4" />
          Llamar Apoderado
        </>
      )}
    </Button>
  );
}
