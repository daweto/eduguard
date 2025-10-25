import { Outlet, NavLink, useMatches, useLocation } from "react-router-dom"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { GraduationCap, Users, UserPlus, Shield, BookOpen, List, ChevronRight, Home } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible"
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
                <BreadcrumbLink asChild><NavLink to={item.pathname}>{item.label}</NavLink></BreadcrumbLink>
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
  const location = useLocation()

  const isStudentsActive = location.pathname.startsWith('/students')
  const isGuardiansActive = location.pathname.startsWith('/guardians')

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
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
                {/* Students Domain */}
                <Collapsible asChild defaultOpen={isStudentsActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={t('navigation:tooltips.students')} isActive={isStudentsActive}>
                        <Users />
                        <span>{t('navigation:sidebar.students.label')}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/students'}><NavLink to="/students">
                              <Home className="h-4 w-4" />
                              <span>{t('navigation:sidebar.students.home')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/students/enroll'}><NavLink to="/students/enroll">
                              <UserPlus className="h-4 w-4" />
                              <span>{t('navigation:sidebar.students.enroll')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/students/roster'}><NavLink to="/students/roster">
                              <List className="h-4 w-4" />
                              <span>{t('navigation:sidebar.students.roster')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/students/grades'}><NavLink to="/students/grades">
                              <BookOpen className="h-4 w-4" />
                              <span>{t('navigation:sidebar.students.grades')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                {/* Guardians Domain */}
                <Collapsible asChild defaultOpen={isGuardiansActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={t('navigation:tooltips.guardians')} isActive={isGuardiansActive}>
                        <Shield />
                        <span>{t('navigation:sidebar.guardians.label')}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/guardians'}><NavLink to="/guardians">
                              <Home className="h-4 w-4" />
                              <span>{t('navigation:sidebar.guardians.home')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/guardians/list'}><NavLink to="/guardians/list">
                              <List className="h-4 w-4" />
                              <span>{t('navigation:sidebar.guardians.list')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={location.pathname === '/guardians/create'}><NavLink to="/guardians/create">
                              <UserPlus className="h-4 w-4" />
                              <span>{t('navigation:sidebar.guardians.create')}</span>
                            </NavLink></SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
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


