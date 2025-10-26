import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface AttendanceStatusBadgeProps {
  status: "present" | "absent" | "excused" | "late";
  corrected?: boolean;
}

export function AttendanceStatusBadge({ status, corrected }: AttendanceStatusBadgeProps) {
  const config = {
    present: {
      label: "Presente",
      variant: "default" as const,
      className: "bg-green-100 text-green-800 hover:bg-green-100",
      icon: CheckCircle2,
    },
    absent: {
      label: "Ausente",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 hover:bg-red-100",
      icon: XCircle,
    },
    excused: {
      label: "Justificado",
      variant: "secondary" as const,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      icon: AlertCircle,
    },
    late: {
      label: "Tarde",
      variant: "outline" as const,
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      icon: Clock,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
      {corrected && <span className="ml-1 text-xs">*</span>}
    </Badge>
  );
}

