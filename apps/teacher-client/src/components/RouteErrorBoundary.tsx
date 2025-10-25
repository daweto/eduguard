import { isRouteErrorResponse, useRouteError } from "react-router-dom"

export function RouteErrorBoundary() {
  const error = useRouteError()
  let title = "Something went wrong"
  let message = "An unexpected error occurred."

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`
    message = error.statusText || message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default RouteErrorBoundary


