import { Navigate, Outlet } from "react-router-dom"
import { pb } from "../lib/pb"

export function ProtectedRoute() {
  if (!pb.authStore.isValid) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
