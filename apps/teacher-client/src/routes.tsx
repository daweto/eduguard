import { Navigate, createBrowserRouter, type UIMatch, type RouteObject } from "react-router-dom"
import AppLayout from "./components/layouts/AppLayout"
import EnrollStudentPage from "./pages/EnrollStudentPage"
import StudentRosterPage from "./pages/StudentRosterPage"
import GuardiansPage from "./pages/GuardiansPage"
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
      { index: true, element: <Navigate to="/enroll" replace />, handle: { breadcrumb: "Inicio", breadcrumbKey: "navigation:breadcrumbs.home" } satisfies CrumbHandle },
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
      {
        path: "guardians",
        element: <GuardiansPage />,
        handle: { breadcrumb: "Apoderados", breadcrumbKey: "navigation:breadcrumbs.guardians" } satisfies CrumbHandle,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)

export default routes


