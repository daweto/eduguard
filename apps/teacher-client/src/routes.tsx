import { Navigate, createBrowserRouter, type UIMatch, type RouteObject } from "react-router-dom"
import AppLayout from "./layouts/AppLayout"
import Enroll from "./pages/Enroll"
import Roster from "./pages/Roster"
import Guardians from "./pages/Guardians"
import RouteErrorBoundary from "./components/RouteErrorBoundary"

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
        element: <Enroll />,
        handle: { breadcrumb: "Inscribir", breadcrumbKey: "navigation:breadcrumbs.enroll" } satisfies CrumbHandle,
      },
      {
        path: "roster",
        element: <Roster />,
        handle: { breadcrumb: "Listado", breadcrumbKey: "navigation:breadcrumbs.roster" } satisfies CrumbHandle,
      },
      {
        path: "guardians",
        element: <Guardians />,
        handle: { breadcrumb: "Apoderados", breadcrumbKey: "navigation:breadcrumbs.guardians" } satisfies CrumbHandle,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)

export default routes


