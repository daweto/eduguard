import { Outlet, NavLink, useMatches } from "react-router-dom"
import { useTranslation } from "react-i18next"
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
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { GraduationCap, Users, UserPlus, Shield } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { CrumbHandle } from "@/routes"

function AppBreadcrumb() {
  const matches = useMatches() as Array<ReturnType<typeof useMatches>[number] & { handle?: CrumbHandle }>

  const items = matches
    .filter((m) => m.handle && (m.handle as CrumbHandle).breadcrumb)
    .map((m) => {
      const crumb = (m.handle as CrumbHandle).breadcrumb
      const label = typeof crumb === "function" ? crumb(m) : crumb
      return { pathname: m.pathname, label }
    })

  if (items.length === 0) return null

  return (
    <Breadcrumb className="px-4 py-2">
      <BreadcrumbList>
        {items.map((item, idx) => (
          <BreadcrumbItem key={item.pathname}>
            {idx < items.length - 1 ? (
              <>
                <BreadcrumbLink asChild>
                  <NavLink to={item.pathname}>{item.label}</NavLink>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function AppLayout() {
  const { t } = useTranslation(['common', 'navigation'])

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">{t('common:appName')}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('navigation:sidebar.label')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={false} tooltip={t('navigation:tooltips.enroll')}>
                    <NavLink to="/enroll" className={({ isActive }) => (isActive ? "data-[active=true]" : undefined)}>
                      <UserPlus />
                      <span>{t('navigation:sidebar.enroll')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={false} tooltip={t('navigation:tooltips.roster')}>
                    <NavLink to="/roster" className={({ isActive }) => (isActive ? "data-[active=true]" : undefined)}>
                      <Users />
                      <span>{t('navigation:sidebar.roster')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={false} tooltip={t('navigation:tooltips.guardians')}>
                    <NavLink to="/guardians" className={({ isActive }) => (isActive ? "data-[active=true]" : undefined)}>
                      <Shield />
                      <span>{t('navigation:sidebar.guardians')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-2 pb-2">
          <SidebarSeparator />
          <div className="text-[10px] text-muted-foreground px-2">{t('common:copyright', { year: new Date().getFullYear() })}</div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="border-b bg-card flex items-center gap-2 px-2 py-1">
          <SidebarTrigger />
          <AppBreadcrumb />
        </div>
        <div className="p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


