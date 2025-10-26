import {
  Navigate,
  Outlet,
  createBrowserRouter,
  type UIMatch,
  type RouteObject,
} from "react-router-dom";
import AppLayout from "./components/layouts/AppLayout";
import EnrollStudentPage from "./pages/EnrollStudentPage";
import StudentRosterPage from "./pages/StudentRosterPage";
import GuardiansPage from "./pages/GuardiansPage";
import StudentsPage from "./pages/StudentsPage";
import GuardiansHomePage from "./pages/GuardiansHomePage";
import GuardiansCreatePage from "./pages/GuardiansCreatePage";
import RouteErrorBoundary from "./components/layouts/RouteErrorBoundary";
import AttendancePage from "./pages/AttendancePage";
import { TeacherClassesPage } from "./pages/TeacherClassesPage";
import { ClassAttendancePage } from "./pages/ClassAttendancePage";
import EditStudentPage from "./pages/EditStudentPage";

export type CrumbHandle = {
  breadcrumb: string | ((match: UIMatch) => string);
  breadcrumbKey?: string;
};

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    handle: {
      breadcrumb: "Inicio",
      breadcrumbKey: "navigation:breadcrumbs.home",
    } satisfies CrumbHandle,
    children: [
      {
        index: true,
        element: <Navigate to="/classes" replace />,
        handle: {
          breadcrumb: "Inicio",
          breadcrumbKey: "navigation:breadcrumbs.home",
        } satisfies CrumbHandle,
      },
      {
        path: "classes",
        element: <TeacherClassesPage />,
        handle: {
          breadcrumb: "Mis Clases",
          breadcrumbKey: "navigation:breadcrumbs.classes",
        } satisfies CrumbHandle,
      },
      {
        path: "attendance/class/:classId",
        element: <ClassAttendancePage />,
        handle: {
          breadcrumb: "Tomar Asistencia",
          breadcrumbKey: "navigation:breadcrumbs.takeAttendance",
        } satisfies CrumbHandle,
      },
      {
        path: "attendance",
        element: <AttendancePage />,
        handle: {
          breadcrumb: "Asistencia",
          breadcrumbKey: "navigation:breadcrumbs.attendance",
        } satisfies CrumbHandle,
      },
      // Students Domain
      {
        path: "students",
        element: <Outlet />,
        handle: {
          breadcrumb: "Estudiantes",
          breadcrumbKey: "navigation:breadcrumbs.students",
        } satisfies CrumbHandle,
        children: [
          {
            index: true,
            element: <StudentsPage />,
          },
          {
            path: "enroll",
            element: <EnrollStudentPage />,
            handle: {
              breadcrumb: "Inscribir",
              breadcrumbKey: "navigation:breadcrumbs.enroll",
            } satisfies CrumbHandle,
          },
          {
            path: "roster",
            element: <StudentRosterPage />,
            handle: {
              breadcrumb: "Listado",
              breadcrumbKey: "navigation:breadcrumbs.roster",
            } satisfies CrumbHandle,
          },
          {
            path: ":studentId/edit",
            element: <EditStudentPage />,
            handle: {
              breadcrumb: "Editar",
              breadcrumbKey: "navigation:breadcrumbs.editStudent",
            } satisfies CrumbHandle,
          },
        ],
      },
      // Guardians Domain
      {
        path: "guardians",
        element: <Outlet />,
        handle: {
          breadcrumb: "Apoderados",
          breadcrumbKey: "navigation:breadcrumbs.guardians",
        } satisfies CrumbHandle,
        children: [
          {
            index: true,
            element: <GuardiansHomePage />,
          },
          {
            path: "list",
            element: <GuardiansPage />,
            handle: {
              breadcrumb: "Listado",
              breadcrumbKey: "navigation:breadcrumbs.guardiansList",
            } satisfies CrumbHandle,
          },
          {
            path: "create",
            element: <GuardiansCreatePage />,
            handle: {
              breadcrumb: "Registrar",
              breadcrumbKey: "navigation:breadcrumbs.guardiansCreate",
            } satisfies CrumbHandle,
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default routes;
