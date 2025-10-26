/**
 * Image Placeholder Component
 * Used when no image is available for students or other entities
 */

import { User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  icon?: LucideIcon;
  className?: string;
  iconClassName?: string;
  name?: string;
}

export function ImagePlaceholder({
  icon: Icon = User,
  className,
  iconClassName,
  name,
}: ImagePlaceholderProps) {
  // Generate initials from name if provided
  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("")
    : null;

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5",
        className,
      )}
    >
      {initials ? (
        <div className="text-4xl font-bold text-muted-foreground/40">
          {initials}
        </div>
      ) : (
        <Icon
          className={cn("w-20 h-20 text-muted-foreground/30", iconClassName)}
        />
      )}
    </div>
  );
}
