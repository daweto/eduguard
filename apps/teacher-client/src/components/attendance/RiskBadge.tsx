import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

type RiskLevel = "none" | "low" | "medium" | "high";

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  className?: string;
}

export function RiskBadge({ riskLevel, className }: RiskBadgeProps) {
  const config = {
    none: {
      label: "Sin Riesgo",
      variant: "outline" as const,
      className: "border-gray-300 text-gray-600",
      icon: null,
    },
    low: {
      label: "Riesgo Bajo",
      variant: "outline" as const,
      className: "border-blue-300 bg-blue-50 text-blue-700",
      icon: <Info className="h-3 w-3" />,
    },
    medium: {
      label: "Riesgo Medio",
      variant: "outline" as const,
      className: "border-amber-400 bg-amber-100 text-amber-800",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    high: {
      label: "Riesgo Alto",
      variant: "destructive" as const,
      className: "bg-red-600 text-white border-red-700",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const { label, variant, className: badgeClassName, icon } = config[riskLevel];

  return (
    <Badge variant={variant} className={`${badgeClassName} ${className || ""}`}>
      {icon}
      {label}
    </Badge>
  );
}
