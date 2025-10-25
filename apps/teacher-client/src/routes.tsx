import { Navigate, createBrowserRouter, type UIMatch, type RouteObject } from "react-router-dom"
import AppLayout from "./components/layouts/AppLayout"
import EnrollStudentPage from "./pages/EnrollStudentPage"
import StudentRosterPage from "./pages/StudentRosterPage"
import GuardiansPage from "./pages/GuardiansPage"
import StudentsPage from "./pages/StudentsPage"
import GuardiansHomePage from "./pages/GuardiansHomePage"
import GuardiansCreatePage from "./pages/GuardiansCreatePage"
import RouteErrorBoundary from "./components/layouts/RouteErrorBoundary"

export type CrumbHandle = {
  breadcrumb: string | ((match: UIMatch) => string)
  breadcrumbKey?: string
}

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    handle: { breadcrumb: "Inicio", breadcrumbKey: "navigation:breadcrumbs.home" } satisfies CrumbHandle,
    children: [
      { index: true, element: <Navigate to="/students" replace />, handle: { breadcrumb: "Inicio", breadcrumbKey: "navigation:breadcrumbs.home" } satisfies CrumbHandle },
      // Students Domain
      {
        path: "students",
        handle: { breadcrumb: "Estudiantes", breadcrumbKey: "navigation:breadcrumbs.students" } satisfies CrumbHandle,
        children: [
          {
            index: true,
            element: <StudentsPage />,
          },
          {
            path: "enroll",
            element: <EnrollStudentPage />,
            handle: { breadcrumb: "Inscribir", breadcrumbKey: "navigation:breadcrumbs.enroll" } satisfies CrumbHandle,
          },
          {
            path: "roster",
            element: <StudentRosterPage />,
            handle: { breadcrumb: "Listado", breadcrumbKey: "navigation:breadcrumbs.roster" } satisfies CrumbHandle,
          },
        ],
      },
      // Guardians Domain
      {
        path: "guardians",
        handle: { breadcrumb: "Apoderados", breadcrumbKey: "navigation:breadcrumbs.guardians" } satisfies CrumbHandle,
        children: [
          {
            index: true,
            element: <GuardiansHomePage />,
          },
          {
            path: "list",
            element: <GuardiansPage />,
            handle: { breadcrumb: "Listado", breadcrumbKey: "navigation:breadcrumbs.guardiansList" } satisfies CrumbHandle,
          },
          {
            path: "create",
            element: <GuardiansCreatePage />,
            handle: { breadcrumb: "Registrar", breadcrumbKey: "navigation:breadcrumbs.guardiansCreate" } satisfies CrumbHandle,
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)

export default routes


