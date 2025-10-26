"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import {
  useTeacherContext,
  type TeacherSummary,
} from "@/contexts/teacher-context";
import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";

type TeacherSwitcherProps = {
  className?: ClassValue;
};

export function TeacherSwitcher({ className }: TeacherSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { teacherGroups, activeTeacher, activeTeacherId, selectTeacher } =
    useTeacherContext();

  if (!activeTeacher) {
    return null;
  }

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-label="Cambiar docente"
      aria-expanded={open}
      className={cn(
        "border-sidebar-border justify-center bg-sidebar text-sidebar-foreground gap-2 text-left shadow-none transition",
        isCollapsed
          ? "size-11 px-0"
          : "w-full px-2",
        className,
      )}
    >
      <TeacherAvatar teacher={activeTeacher} />
      {!isCollapsed && (
        <div className="flex min-w-0 flex-col text-left">
          <span className="truncate text-sm font-medium">
            {activeTeacher.fullName}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {activeTeacher.department}
          </span>
        </div>
      )}
      {!isCollapsed && <ChevronsUpDown className="ml-auto size-4 opacity-50" />}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip open={isCollapsed ? undefined : false} disableHoverableContent>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" align="center">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">
                {activeTeacher.fullName}
              </span>
              <span className="text-muted-foreground text-xs">
                {activeTeacher.department}
              </span>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar docente..." />
          <CommandList>
            <CommandEmpty>Sin coincidencias</CommandEmpty>
            {teacherGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.teachers.map((teacher) => (
                  <CommandItem
                    key={teacher.id}
                    onSelect={() => {
                      selectTeacher(teacher.id);
                      setOpen(false);
                    }}
                  >
                    <TeacherAvatar teacher={teacher} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {teacher.fullName}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {teacher.subjects.join(", ")}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto size-4 text-primary",
                        activeTeacherId === teacher.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem disabled className="text-muted-foreground text-xs">
              Docentes cargados desde seed.ts
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TeacherAvatar({ teacher }: { teacher: TeacherSummary }) {
  const initials = React.useMemo(
    () => getInitials(teacher.fullName),
    [teacher.fullName],
  );

  return (
    <div className="bg-sidebar-primary/10 text-sidebar-foreground border-sidebar-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase">
      {initials}
    </div>
  );
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}
