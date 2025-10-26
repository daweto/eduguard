import { Outlet, NavLink, useMatches, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TeacherSwitcher } from "@/components/layouts/TeacherSwitcher";
import { TeacherProvider } from "@/contexts/teacher-context";
import {
  GraduationCap,
  Users,
  UserPlus,
  Shield,
  List,
  ChevronRight,
  Home,
  BookOpen,
  Phone,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Toaster } from "@/components/ui/sonner";
import type { CrumbHandle } from "@/routes";

function AppBreadcrumb() {
  const matches = useMatches() as Array<
    ReturnType<typeof useMatches>[number] & { handle?: CrumbHandle }
  >;

  const items = matches
    .filter((m) => m.handle && (m.handle as CrumbHandle).breadcrumb)
    .map((m) => {
      const crumb = (m.handle as CrumbHandle).breadcrumb;
      const label = typeof crumb === "function" ? crumb(m) : crumb;
      return { pathname: m.pathname, label };
    });

  if (items.length === 0) return null;

  return (
    <Breadcrumb className="px-4 py-2">
      <BreadcrumbList>
        {items.map((item, idx) => (
          <BreadcrumbItem key={item.pathname}>
            {idx < items.length - 1 ? (
              <BreadcrumbLink asChild>
                <NavLink to={item.pathname}>{item.label}</NavLink>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
            {idx < items.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function AppLayout() {
  const { t } = useTranslation(["common", "navigation"]);
  const location = useLocation();

  const isStudentsActive = location.pathname.startsWith("/students");
  const isGuardiansActive = location.pathname.startsWith("/guardians");

  const navigation = [
    {
      key: "classes",
      type: "link" as const,
      to: "/classes",
      label: t("navigation:sidebar.classes"),
      icon: BookOpen,
      tooltip: t("navigation:tooltips.classes"),
      isActive: location.pathname === "/classes",
    },
    {
      key: "calls",
      type: "link" as const,
      to: "/calls",
      label: "Llamadas",
      icon: Phone,
      tooltip: "Historial de llamadas a apoderados",
      isActive: location.pathname === "/calls",
    },
    {
      key: "students",
      type: "collapsible" as const,
      label: t("navigation:sidebar.students.label"),
      icon: Users,
      tooltip: t("navigation:tooltips.students"),
      isActive: isStudentsActive,
      items: [
        {
          key: "students-home",
          to: "/students",
          label: t("navigation:sidebar.students.home"),
          icon: Home,
          isActive: location.pathname === "/students",
        },
        {
          key: "students-enroll",
          to: "/students/enroll",
          label: t("navigation:sidebar.students.enroll"),
          icon: UserPlus,
          isActive: location.pathname === "/students/enroll",
        },
        {
          key: "students-roster",
          to: "/students/roster",
          label: t("navigation:sidebar.students.roster"),
          icon: List,
          isActive: location.pathname === "/students/roster",
        },
      ],
    },
    {
      key: "guardians",
      type: "collapsible" as const,
      label: t("navigation:sidebar.guardiansSection.label"),
      icon: Shield,
      tooltip: t("navigation:tooltips.guardians"),
      isActive: isGuardiansActive,
      items: [
        {
          key: "guardians-home",
          to: "/guardians",
          label: t("navigation:sidebar.guardiansSection.home"),
          icon: Home,
          isActive: location.pathname === "/guardians",
        },
        {
          key: "guardians-list",
          to: "/guardians/list",
          label: t("navigation:sidebar.guardiansSection.list"),
          icon: List,
          isActive: location.pathname === "/guardians/list",
        },
        {
          key: "guardians-create",
          to: "/guardians/create",
          label: t("navigation:sidebar.guardiansSection.create"),
          icon: UserPlus,
          isActive: location.pathname === "/guardians/create",
        },
      ],
    },
  ];

  return (
    <TeacherProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="gap-3">
            <NavLink
              to="/"
              className="group/sidebar-logo grid w-full grid-cols-[auto_1fr] items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:justify-items-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
            >
              <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg transition-all group-data-[collapsible=icon]:size-9">
                <GraduationCap className="size-5" />
              </div>
              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate">{t("common:appName")}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {t("common:appTagline", "Empowering teachers")}
                </span>
              </div>
            </NavLink>
            <TeacherSwitcher className="group-data-[collapsible=icon]:size-9" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                {t("navigation:sidebar.label")}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    if (item.type === "link") {
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            asChild
                            isActive={item.isActive}
                            tooltip={item.tooltip}
                          >
                            <NavLink to={item.to}>
                              <item.icon className="size-4" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <Collapsible
                        key={item.key}
                        asChild
                        defaultOpen={item.isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.tooltip}
                              isActive={item.isActive}
                            >
                              <item.icon className="size-4" />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.key}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={subItem.isActive}
                                  >
                                    <NavLink to={subItem.to}>
                                      <subItem.icon className="h-4 w-4" />
                                      <span>{subItem.label}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-2 pb-2">
            <SidebarSeparator />
            <div className="text-[10px] text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">
              {t("common:copyright", { year: new Date().getFullYear() })}
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <div className="border-b bg-card flex items-center gap-2 px-3 py-2">
            <SidebarTrigger className="md:hidden" />
            <SidebarTrigger className="hidden md:inline-flex" />
            <AppBreadcrumb />
          </div>
          <div className="p-4">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TeacherProvider>
  );
}
